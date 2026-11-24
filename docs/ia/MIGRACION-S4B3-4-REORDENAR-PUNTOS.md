# S4B3.4: reordenar los puntos de una zona (migración y guía de aplicación)

> **Para quién es:** para ti, que vas a aplicar esta migración tú mismo en `la-merced-dev` desde el SQL Editor de Supabase.
> **Estado:** la migración está **escrita pero no aplicada** en ningún proyecto de Supabase. Esta guía no ejecuta nada por ti.
> **Qué no está hecho:** la interfaz para reordenar. No se empieza hasta que confirmes que la función existe y funciona en `la-merced-dev`.

Cada bloque de SQL lleva una etiqueta:

- **[SOLO LECTURA]**: solo consulta. No cambia nada.
- **[MODIFICA LA BASE]**: cambia la base de forma permanente.
- **[MODIFICA Y SE REVIERTE SOLO]**: cambia datos dentro de una transacción que se deshace al terminar. No deja nada.

## 1. Qué habilita

Una función de PostgreSQL, `public.reordenar_puntos(p_zona_id, p_ids)`, que cambia el orden de **todos** los puntos de una zona de una sola vez y de forma **atómica**: o se reasignan todos o no cambia ninguno.

- **Entrada:** el identificador de la zona y la lista **completa** de ids de los puntos de esa zona, en el orden nuevo.
- **Salida:** una tabla `(punto_id, nuevo_orden)` con los puntos de la zona y el orden que quedó.
- **Cómo reparte el orden:** entrega a los puntos, según su lugar en la lista, los **mismos valores de `orden` que la zona ya tenía**. Ejemplo: si la zona tiene los valores 1, 3, 4 y 7 y envías los puntos `[D, A, C, B]`, quedan D=1, A=3, C=4, B=7. No crea números nuevos ni cierra huecos. Esto es deliberado: el mapa del visitante completa con puntos de demostración los números de `orden` que no están ocupados por un punto real (`src/datos/recorrido.ts`), y no queremos que reordenar cambie cuáles aparecen.
- **Quién puede usarla:** quien tenga sesión y un rol de `editor`, `revisor` o `admin`. El visitante anónimo no puede.

## 2. Qué crea o modifica en PostgreSQL

Solo **una función** y sus permisos. No añade tablas, columnas, políticas ni triggers, y no toca migraciones anteriores.

| Objeto                                          | Detalle                                                                                                                                                                                         |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Función `public.reordenar_puntos(uuid, uuid[])` | PL/pgSQL, `security invoker` (corre con los permisos de quien la llama, así que la política «personal edita puntos» también se aplica), `search_path` vacío (todo va con el esquema explícito). |
| Permiso de ejecución                            | `authenticated`: sí. `anon` y `public`: no (se revocan de forma explícita porque Supabase da permisos por defecto a `anon` en funciones nuevas).                                                |
| Restricción `puntos_orden_por_zona`             | **No se modifica.** Ya es `unique (zona_id, orden) deferrable initially immediate`; la función la difiere durante la reasignación y la comprueba antes de terminar.                             |

Lo que hace la función, en orden: (1) comprueba que quien llama tenga rol; (2) valida la lista (no nula, no vacía, de una dimensión, sin nulos ni repetidos) y que la zona exista; (3) toma un candado por zona y bloquea sus puntos; (4) comprueba que la lista sea **exactamente** el conjunto de puntos de la zona; (5) reasigna el orden en un solo `UPDATE` con la restricción diferida; (6) vuelve a exigir la restricción dentro de la función y devuelve el resultado.

## 3. Qué se verificó y qué no

**Verificado por mí en un PostgreSQL 18 local y desechable** (no es Supabase; creé las tablas con las migraciones 1 y 2 del repositorio y simulé `auth.uid()` y los roles `anon` y `authenticated`):

- La migración se aplica sin errores y se puede volver a aplicar (es idempotente).
- Invertir el orden de una zona funciona aunque se intercambien valores (la restricción diferida) y conserva el mismo conjunto de valores de `orden`.
- Se rechazan: lista repetida, con un punto de menos, con un id desconocido, con un elemento nulo, vacía, nula, y ids de otra zona. Después de rechazar, el orden no cambió.
- Con los roles `editor`, `revisor` y `admin` funciona. Un usuario sin rol y el visitante anónimo son rechazados.
- Atomicidad: forcé un fallo a mitad del `UPDATE` (un trigger de prueba) y no quedó ningún punto cambiado.
- Concurrencia: dos reordenamientos simultáneos de la misma zona se ejecutan uno tras otro (el segundo esperó al primero) y el resultado final fue el del último.
- La prueba controlada de la sección 7 funciona con zonas de 4, de 1 y de 0 puntos reales, con los tres roles, y no deja ningún dato cambiado.
- Las consultas de las secciones 4, 6 y 9 devuelven lo descrito allí, y el script de restauración (4.4) devuelve el orden original.

**No verificado:** nada de esto se ha ejecutado en `la-merced-dev`. Las diferencias con Supabase (la implementación real de `auth.uid()`, PostgREST, los permisos por defecto, cómo trata el SQL Editor las transacciones) pueden dar sorpresas. Por eso existen las secciones 6 y 7. Tampoco se probó llamar a la función con una sesión real; eso es la sección 8, cuando exista la interfaz.

## 4. Antes de aplicar

Haz esto antes de nada. Todo es **solo lectura**.

1. Abre el panel de Supabase y confirma que estás en el proyecto **`la-merced-dev`** (el nombre aparece arriba a la izquierda). Si no es ese, detente.
2. Ve a **SQL Editor → New query**.
3. Ejecuta, **uno por uno**, estos cuatro bloques.

**[SOLO LECTURA] 4.1. La función todavía no existe** (debe devolver 0 filas; si devuelve una, ya se aplicó antes):

```sql
select p.proname, pg_get_function_identity_arguments(p.oid) as argumentos
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'reordenar_puntos';
```

**[SOLO LECTURA] 4.2. Las piezas de las que depende existen** (debe devolver `es_personal` y `puntos_orden_por_zona`, esta con `diferible = true` y `diferida_por_defecto = false`):

```sql
select 'funcion' as tipo, proname::text as nombre, null::boolean as diferible, null::boolean as diferida_por_defecto
from pg_proc
where pronamespace = 'public'::regnamespace and proname = 'es_personal'
union all
select 'restriccion', conname::text, condeferrable, condeferred
from pg_constraint
where conname = 'puntos_orden_por_zona';
```

**[SOLO LECTURA] 4.3. Copia de seguridad del orden actual.** Guarda el resultado completo (cópialo a un archivo o toma una captura). Sirve para comparar antes y después:

```sql
select z.slug as zona, p.slug as punto, p.id, p.orden
from public.puntos p
join public.zonas z on z.id = p.zona_id
order by z.slug, p.orden;
```

**[SOLO LECTURA] 4.4. Script de restauración ya escrito.** Esta consulta **no cambia nada**: solo te devuelve, en una celda, el texto de un script que, si lo ejecutaras, dejaría el orden como está **ahora**. Copia el contenido de la celda `script_de_restauracion` y guárdalo en un archivo (por ejemplo `restaurar-orden.sql`). Solo lo usarás si más adelante hay que devolver el orden original (sección 9.2):

```sql
select 'begin;' || E'\n'
    || 'set constraints public.puntos_orden_por_zona deferred;' || E'\n'
    || 'update public.puntos p' || E'\n'
    || 'set orden = v.orden' || E'\n'
    || 'from (values' || E'\n'
    || string_agg(format('  (%L::uuid, %s)', p.id, p.orden), E',\n' order by z.slug, p.orden) || E'\n'
    || ') as v (id, orden)' || E'\n'
    || 'where p.id = v.id and p.orden <> v.orden;' || E'\n'
    || 'set constraints public.puntos_orden_por_zona immediate;' || E'\n'
    || 'commit;' as script_de_restauracion
from public.puntos p
join public.zonas z on z.id = p.zona_id;
```

## 5. Aplicar la migración

**Archivo a ejecutar:** [`supabase/migrations/20261123000001_reordenar_puntos.sql`](../../supabase/migrations/20261123000001_reordenar_puntos.sql). Ejecuta su **contenido completo**, de la primera línea de comentarios a la última línea (`grant execute ...`). No ejecutes solo una parte.

**[MODIFICA LA BASE]** Pasos:

1. Abre el archivo en tu editor y copia **todo** su contenido.
2. En el panel de `la-merced-dev`, ve a **SQL Editor → New query**.
3. Pega el contenido completo.
4. Pulsa **Run**. Si el panel avisa de una operación «potencialmente destructiva» por el `revoke`, revisa que sea esta función y confirma.
5. El resultado esperado es **Success. No rows returned**. Si sale un error, copia el mensaje completo y no sigas; la sección 9.1 explica cómo dejarlo como estaba.

Notas:

- **Es idempotente** (`create or replace`, `revoke`, `grant`): si la ejecutas dos veces, no pasa nada.
- Ejecutarla en el SQL Editor **no la anota** en el historial de migraciones de Supabase. Si el equipo usa después `supabase db push`, intentará aplicarla de nuevo; es inofensivo por lo anterior, pero avisa al responsable del bloque 1 para que lo tenga presente.
- Si más tarde la API devuelve «Could not find the function», el caché de esquema no se recargó: ejecuta `notify pgrst, 'reload schema';` (no cambia datos).

## 6. Verificar que existe y tiene los permisos esperados

Todo **solo lectura**. Ejecuta cada bloque por separado.

**[SOLO LECTURA] 6.1. Existe, con la firma correcta** (esperado: 1 fila; `argumentos` = `p_zona_id uuid, p_ids uuid[]`; `resultado` = `TABLE(punto_id uuid, nuevo_orden integer)`; `security_definer` = `false`; `configuracion` contiene `search_path=""`):

```sql
select p.proname as funcion,
       pg_get_function_identity_arguments(p.oid) as argumentos,
       pg_get_function_result(p.oid) as resultado,
       p.prosecdef as security_definer,
       p.proconfig as configuracion
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'reordenar_puntos';
```

**[SOLO LECTURA] 6.2. Quién puede ejecutarla** (esperado: `anon` = false, `authenticated` = true, `public_pseudorol` = false):

```sql
select has_function_privilege('anon', 'public.reordenar_puntos(uuid, uuid[])', 'execute') as anon,
       has_function_privilege('authenticated', 'public.reordenar_puntos(uuid, uuid[])', 'execute') as authenticated,
       has_function_privilege('public', 'public.reordenar_puntos(uuid, uuid[])', 'execute') as public_pseudorol;
```

**[SOLO LECTURA] 6.3. Lista de permisos** (esperado: `authenticated` y los roles internos de Supabase, como `postgres` y `service_role`; puede haber alguno más. Lo importante es que **no** aparezca `anon` ni `PUBLIC`):

```sql
select grantee, privilege_type
from information_schema.routine_privileges
where routine_schema = 'public' and routine_name = 'reordenar_puntos'
order by grantee;
```

**[SOLO LECTURA] 6.4. La restricción sigue igual** (esperado: `diferible = true`, `diferida_por_defecto = false`, definición `UNIQUE (zona_id, orden) DEFERRABLE`):

```sql
select conname, condeferrable as diferible, condeferred as diferida_por_defecto,
       pg_get_constraintdef(oid) as definicion
from pg_constraint
where conname = 'puntos_orden_por_zona';
```

**6.5. Opcional: comprobar con la API real que el visitante anónimo no puede llamarla.** A diferencia de la sección 7, esta llamada sí pasa por la API de Supabase (PostgREST), como lo haría un visitante. Se ejecuta en **tu terminal**, en la raíz del repositorio. Usa un id inexistente (todo ceros), así que **no puede cambiar nada aunque se permitiera**: se rechaza antes de tocar datos. Las claves se leen de `.env.local` y no se imprimen; **no añadas `-v`**, que las mostraría.

```bash
set -a; . ./.env.local; set +a
curl -s -w '\nHTTP %{http_code}\n' -X POST "$VITE_SUPABASE_URL/rest/v1/rpc/reordenar_puntos" \
  -H "apikey: $VITE_SUPABASE_ANON_KEY" -H "Content-Type: application/json" \
  -d '{"p_zona_id":"00000000-0000-0000-0000-000000000000","p_ids":["00000000-0000-0000-0000-000000000000"]}'
```

- **Esperado:** un error `401` o `403` con `permission denied for function reordenar_puntos`. Eso confirma que el permiso de `anon` está revocado.
- Si dice `No tienes permiso para reordenar puntos.`: tampoco se escribió nada (la función se negó), pero el permiso de `anon` **no** está revocado; vuelve a ejecutar el `revoke` de la migración.
- Si dice `Could not find the function`: la API no ve la función todavía (ver la nota de `notify pgrst` de la sección 5).

## 7. Prueba controlada del reordenamiento (no deja nada cambiado)

### 7.1 Qué hace y por qué está escrita así

El bloque de la sección 7.3 hace un reordenamiento real y comprueba el resultado, y al final **provoca un error a propósito** (`PRUEBA TERMINADA…`). Eso deshace todo lo que hizo, y **el texto de ese error es el informe de la prueba**. Por eso el panel mostrará un error en rojo: es lo esperado.

**¿Por qué no usar `BEGIN; … ROLLBACK;`?** En PostgreSQL funciona, pero en el SQL Editor es poco fiable para esta prueba:

- El editor muestra solo el resultado de la **última** sentencia. Si la última es `ROLLBACK`, no verías nada del reordenamiento.
- Si una sentencia intermedia falla, el `ROLLBACK` del final **no se ejecuta** y la transacción queda abierta y abortada hasta que termine esa sesión. Lo comprobé en PostgreSQL: la siguiente sentencia de la misma sesión falla con «current transaction is aborted». Cómo trata Supabase esa sesión no lo he podido comprobar, así que no dependemos de ello.

Un bloque `do $$ … $$` es **una sola sentencia**: o termina entera o se deshace entera, y entrega el informe en el mensaje de error, sin depender de cómo gestione el editor las transacciones. (Si algún día ejecutas esto desde `psql` o la CLI, `begin; …; rollback;` sí es válido y puedes leer los resultados entre medias.)

### 7.2 Antes de ejecutarla

- Necesita un usuario con el rol probado en `perfiles` (`editor`, `revisor` o `admin`). Si falta, la prueba lo dice y se detiene sin cambiar nada.
- **No necesita que la zona tenga 2 puntos reales.** Añade 2 puntos **temporales** (`zz-prueba-reordenar-1` y `-2`) al final de la zona dentro de la misma transacción, así que funciona con 0, 1 o más puntos reales. Los temporales se descartan junto con todo lo demás; no quedan en la base.
- Si la zona tiene **un solo** punto real, la prueba reordena ese punto junto con los temporales: valida la lógica, pero no ves cambiar el orden de puntos reales entre sí. Eso se verá en la sección 8, con puntos reales suficientes.
- Si la zona indicada no existe, la prueba lo dice y se detiene.
- Puedes cambiar `v_rol` y `v_zona_slug` en las primeras líneas del bloque.

### 7.3 El bloque

**[MODIFICA Y SE REVIERTE SOLO]** Ejecuta este bloque completo en una consulta nueva:

```sql
do $$
declare
  v_rol text := 'editor';                    -- cambia a 'revisor' o 'admin' para repetir con otro rol
  v_zona_slug text := 'fachada-principal';
  v_usuario uuid;
  v_zona uuid;
  v_otra_zona uuid;
  v_reales integer;
  v_antes uuid[];
  v_ordenes_antes integer[];
  v_invertida uuid[];
  v_despues uuid[];
  v_ordenes_despues integer[];
  v_n integer;
  v_caso text;
  v_lista uuid[];
  v_detalle_antes text;
  v_detalle_despues text;
  v_informe text := '';
begin
  select p.id into v_usuario from public.perfiles p where p.rol = v_rol::public.rol_usuario limit 1;
  if v_usuario is null then raise exception 'No hay ningún usuario con rol %.', v_rol; end if;

  select z.id into v_zona from public.zonas z where z.slug = v_zona_slug;
  if v_zona is null then raise exception 'No existe la zona %.', v_zona_slug; end if;
  select z.id into v_otra_zona from public.zonas z where z.slug <> v_zona_slug limit 1;

  select count(*) into v_reales from public.puntos p where p.zona_id = v_zona;

  -- Dos puntos TEMPORALES al final de la zona, para que la prueba funcione aunque tenga 0 o 1 puntos
  -- reales. Como todo lo demás, se descartan al terminar (nada de esto queda en la base).
  insert into public.puntos (zona_id, slug, orden)
  select v_zona, 'zz-prueba-reordenar-' || g,
         coalesce((select max(p.orden) from public.puntos p where p.zona_id = v_zona), 0) + g
  from generate_series(1, 2) as g;

  select array_agg(p.id order by p.orden), array_agg(p.orden order by p.orden),
         string_agg(p.slug || '=' || p.orden, ', ' order by p.orden)
    into v_antes, v_ordenes_antes, v_detalle_antes
  from public.puntos p where p.zona_id = v_zona;
  v_n := cardinality(v_antes);

  select array_agg(t.id order by t.pos desc) into v_invertida from unnest(v_antes) with ordinality as t (id, pos);

  -- Actuar como el usuario elegido (simulación: ver la sección 7.5 de la guía).
  perform set_config('request.jwt.claims', json_build_object('sub', v_usuario, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- 1. Invertir el orden completo: debe funcionar aunque se intercambien valores (restricción diferida).
  perform public.reordenar_puntos(v_zona, v_invertida);
  select array_agg(p.id order by p.orden), array_agg(p.orden order by p.orden),
         string_agg(p.slug || '=' || p.orden, ', ' order by p.orden)
    into v_despues, v_ordenes_despues, v_detalle_despues
  from public.puntos p where p.zona_id = v_zona;
  v_informe := v_informe || format(E'0. Zona %s: %s punto(s) real(es) + 2 temporales.\n   Antes:   %s\n   Después: %s\n',
    v_zona_slug, v_reales, v_detalle_antes, v_detalle_despues);
  v_informe := v_informe || format(E'1. Inversión del orden: %s. Mismos valores de orden que antes: %s.\n',
    case when v_despues = v_invertida then 'OK' else 'FALLÓ' end,
    case when v_ordenes_despues = v_ordenes_antes then 'OK' else 'FALLÓ' end);

  -- 2. Listas inválidas: todas deben rechazarse y no cambiar nada.
  foreach v_caso in array array['duplicado', 'faltante', 'desconocido', 'elemento nulo', 'vacía', 'nula'] loop
    v_lista := case v_caso
      when 'duplicado'     then v_invertida[1:v_n - 1] || v_invertida[1]
      when 'faltante'      then v_invertida[1:v_n - 1]
      when 'desconocido'   then v_invertida[1:v_n - 1] || gen_random_uuid()
      when 'elemento nulo' then v_invertida[1:v_n - 1] || null::uuid
      when 'vacía'         then '{}'::uuid[]
      else null
    end;
    begin
      perform public.reordenar_puntos(v_zona, v_lista);
      v_informe := v_informe || format(E'2. Lista %s: FALLÓ (no se rechazó)\n', v_caso);
    exception when others then
      v_informe := v_informe || format(E'2. Lista %s: rechazada -> %s\n', v_caso, sqlerrm);
    end;
  end loop;

  if v_otra_zona is not null then
    begin
      perform public.reordenar_puntos(v_otra_zona, v_invertida);
      v_informe := v_informe || E'2. Puntos de otra zona: FALLÓ (no se rechazó)\n';
    exception when others then
      v_informe := v_informe || format(E'2. Puntos de otra zona: rechazado -> %s\n', sqlerrm);
    end;
  end if;

  select array_agg(p.id order by p.orden) into v_lista from public.puntos p where p.zona_id = v_zona;
  v_informe := v_informe || format(E'3. Tras los rechazos el orden no cambió: %s.\n',
    case when v_lista = v_despues then 'OK' else 'FALLÓ' end);

  -- 4. Sin permiso: usuario sin rol, y visitante anónimo.
  perform set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
  begin
    perform public.reordenar_puntos(v_zona, v_antes);
    v_informe := v_informe || E'4. Usuario sin rol: FALLÓ (se permitió)\n';
  exception when others then
    v_informe := v_informe || format(E'4. Usuario sin rol: rechazado -> %s\n', sqlerrm);
  end;

  set local role anon;
  begin
    perform public.reordenar_puntos(v_zona, v_antes);
    v_informe := v_informe || E'4. Visitante anónimo: FALLÓ (se permitió)\n';
  exception when others then
    v_informe := v_informe || format(E'4. Visitante anónimo: rechazado -> %s\n', sqlerrm);
  end;

  -- Todo lo anterior se deshace: este "error" es intencional y es la forma de no dejar nada cambiado.
  raise exception E'PRUEBA TERMINADA. Se revirtió TODO (este error es intencional).\nRol probado: %\n%', v_rol, v_informe;
end;
$$;
```

### 7.4 Resultado esperado

El mensaje del error, algo como (los puntos y números dependen de tus datos):

```text
PRUEBA TERMINADA. Se revirtió TODO (este error es intencional).
Rol probado: editor
0. Zona fachada-principal: 4 punto(s) real(es) + 2 temporales.
   Antes:   p4=1, p3=3, p2=4, p1=7, zz-prueba-reordenar-1=8, zz-prueba-reordenar-2=9
   Después: zz-prueba-reordenar-2=1, zz-prueba-reordenar-1=3, p1=4, p2=7, p3=8, p4=9
1. Inversión del orden: OK. Mismos valores de orden que antes: OK.
2. Lista duplicado: rechazada -> La lista de puntos repite algún punto.
2. Lista faltante: rechazada -> La lista no incluye 1 punto(s) de la zona.
2. Lista desconocido: rechazada -> La lista incluye 1 punto(s) que no existen o no pertenecen a la zona.
2. Lista elemento nulo: rechazada -> La lista de puntos contiene valores nulos.
2. Lista vacía: rechazada -> La lista de puntos está vacía.
2. Lista nula: rechazada -> Faltan la zona o la lista de puntos.
2. Puntos de otra zona: rechazado -> La lista incluye 6 punto(s) que no existen o no pertenecen a la zona.
3. Tras los rechazos el orden no cambió: OK.
4. Usuario sin rol: rechazado -> No tienes permiso para reordenar puntos.
4. Visitante anónimo: rechazado -> permission denied for function reordenar_puntos
```

- La línea `0.` muestra el orden antes y después: los **valores** de `orden` son los mismos, solo cambia quién tiene cada uno.
- Cualquier línea que diga **FALLÓ** es un problema: no sigas y copia el informe completo.
- Repite la prueba cambiando `v_rol` a `'revisor'` y a `'admin'`.
- Si el mensaje dice `permission denied to set role`, el SQL Editor no te deja simular roles: no es un defecto de la función. Salta a la sección 8, que usa una sesión real.

**[SOLO LECTURA] Después, confirma que no cambió nada.** Repite la consulta 4.3 y compárala con la copia que guardaste: debe ser idéntica. En particular, **no** debe existir ningún punto `zz-prueba-reordenar-…`.

### 7.5 Qué demuestra esta prueba y qué no (una simulación no es una sesión real)

La prueba **simula** a un usuario: dentro de SQL cambia el rol de la conexión a `authenticated` o `anon` y escribe a mano los datos de la sesión (`request.jwt.claims`). Eso es útil, pero **no es una sesión de Supabase**.

| Sí demuestra                                                                | No demuestra                                                                                    |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Que la lógica de la función es correcta (validaciones, orden, atomicidad)   | Que un inicio de sesión real produzca un token que la base reconozca como ese usuario           |
| Que la restricción diferida permite intercambiar valores                    | Que PostgREST exponga la función y entienda los parámetros (`uuid[]`) tal como los envía la app |
| Que los permisos de ejecución de `anon` y `authenticated` son los esperados | Que la app, con el token real de un editor, revisor o admin, sea aceptada                       |
| Que `es_personal()` lee el rol del perfil del usuario elegido               | Cómo se comporta con dos personas en dos navegadores a la vez dentro de Supabase                |

Para cubrir lo que falta, usa la **6.5** (visitante anónimo, por la API real) y la **sección 8** (sesión real con la interfaz). Hasta entonces, el resultado de esta sección es «la función es correcta en una simulación», no «funciona de extremo a extremo».

## 8. Prueba de extremo a extremo (cuando exista la interfaz de reordenamiento)

> **No la ejecutes todavía:** la interfaz no existe. Este es el procedimiento previsto para cuando se construya; la redacción exacta de los mensajes dependerá de ella.

**Preparación** (solo lectura)

1. Confirma el proyecto `la-merced-dev` y repite 4.3 y 4.4 para tener la copia y el script de restauración **actuales**.
2. Elige una zona con **al menos 3 puntos**, de preferencia puntos de prueba y no puntos con contenido real del equipo de investigación. Si no los hay, avisa antes de seguir.

**Pasos**

| #   | Paso                                                                                                        | Resultado esperado                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1   | Inicia sesión como **editor** y abre la pantalla de reordenamiento de la zona elegida                       | Aparecen los puntos en su orden actual                                                            |
| 2   | Cambia el orden (por ejemplo, sube un punto una posición) y guarda                                          | Mensaje de éxito; el botón se bloquea mientras guarda                                             |
| 3   | Recarga la página                                                                                           | El orden nuevo se mantiene                                                                        |
| 4   | **[SOLO LECTURA]** Ejecuta 4.3 y compárala con la copia                                                     | Solo cambió el reparto de `orden` entre los puntos de esa zona; los valores usados son los mismos |
| 5   | Abre el mapa del visitante de esa zona (`/mapa?zona=…`) en una ventana nueva                                | Los números de los marcadores y el orden de la ruta reflejan el orden nuevo                       |
| 6   | Repite 1 a 3 con **revisor** y con **admin**                                                                | Funciona con los tres roles                                                                       |
| 7   | Cierra sesión en otra pestaña e intenta guardar un cambio en la primera                                     | Error claro; el orden **no** cambia (confirma con 4.3)                                            |
| 8   | Abre la pantalla en dos pestañas, cambia el orden distinto en cada una y guarda primero una y luego la otra | Se guarda el de la última (no hay aviso de conflicto: es el comportamiento documentado)           |
| 9   | Devuelve el orden original desde la interfaz (o con el script de 4.4, sección 9.2) y ejecuta 4.3            | Idéntica a la copia del paso 1 de la preparación                                                  |

**Criterio:** la prueba se aprueba cuando los pasos 2 a 6 salen como se espera, el 7 no deja datos cambiados y el 9 devuelve exactamente la copia original.

## 9. Deshacer: son dos cosas distintas

**Revertir la migración** (quitar la función) y **restaurar datos reordenados** (devolver los `orden` a como estaban) son operaciones independientes. Una no hace la otra.

|                    | 9.1 Revertir la migración                    | 9.2 Restaurar datos reordenados                               |
| ------------------ | -------------------------------------------- | ------------------------------------------------------------- |
| Qué cambia         | Quita la función y sus permisos              | Vuelve a escribir los valores de `orden` de los puntos        |
| Cuándo se usa      | Si la migración dio error o no se quiere     | Si alguien reordenó puntos y hay que volver al orden original |
| ¿Toca los puntos?  | **No**: el `orden` queda como esté           | **Sí**: solo la columna `orden` de los puntos indicados       |
| ¿Quita la función? | Sí                                           | **No**: la función sigue existiendo                           |
| Tipo de cambio     | Esquema (se vuelve a crear con la migración) | Datos (lo que se pierde es el orden que había hasta entonces) |
| Qué necesitas      | Una línea de SQL                             | La copia de 4.3 o el script de 4.4 guardados **antes**        |

Si necesitas ambas, restaura primero los datos (9.2) y después retira la función (9.1).

### 9.1 Revertir la migración (quitar la función)

**[MODIFICA LA BASE: esquema]**

```sql
drop function if exists public.reordenar_puntos(uuid, uuid[]);
```

Efectos:

- Se elimina la función y, con ella, sus permisos. Es lo único que la migración creó.
- **No afecta a los puntos existentes**: sus valores de `orden`, las fichas, la restricción y las políticas quedan igual. **Si ya se había reordenado algo, el orden nuevo se queda**; para devolverlo usa 9.2.
- Hoy ningún código de la app llama a la función, así que no se rompe nada. Si más adelante la interfaz ya la usa, dejaría de poder reordenar hasta que se vuelva a aplicar la migración.
- El archivo de migración del repositorio no cambia: volver a aplicarlo la crea de nuevo.

### 9.2 Restaurar datos reordenados

Solo si reordenaste puntos de verdad y quieres devolver el orden que había cuando guardaste el script de la consulta 4.4.

**[MODIFICA LA BASE: datos]**

1. Abre el archivo `restaurar-orden.sql` que guardaste en 4.4 y revisa que tenga un renglón por cada punto, con los `id` y `orden` que anotaste.
2. En el SQL Editor de `la-merced-dev`, pega el contenido **completo** (de `begin;` a `commit;`) y pulsa **Run**.
3. **[SOLO LECTURA]** Ejecuta 4.3 y compárala con la copia: debe ser idéntica.

Notas:

- El script va en una sola transacción porque, mientras cambia, dos puntos pueden tener el mismo valor un instante (la restricción es diferible). Solo actualiza los puntos cuyo `orden` cambió.
- **No se puede usar `reordenar_puntos` para esto desde el SQL Editor:** ahí no hay sesión de usuario, así que la función te rechaza (no tienes un rol). Por eso existe este script.
- Si te quedaste sin el script, pero tienes la copia de 4.3, arma los renglones `('<id>'::uuid, <orden>)` a mano con esos datos y usa la misma estructura del script.
- El script restaura **todos** los puntos como estaban al ejecutar 4.4. Si desde entonces se agregó, se borró o se editó otro `orden` a propósito, esos cambios también se revierten o no se aplican: revisa el script antes de ejecutarlo.

## 10. Después de aplicar

- **No empieces la interfaz.** Esperamos tu confirmación de que la función existe (sección 6) y pasa la prueba (sección 7) en `la-merced-dev`.
- **Tipos generados:** `src/lib/tipos-db.ts` todavía no conoce la función. Se regenera con `npm run db:types`, que consulta el proyecto enlazado y por eso necesita tu aprobación explícita. Mientras tanto, [`src/datos/reordenar.ts`](../../src/datos/reordenar.ts) la llama con un envoltorio sin tipos, que se quita al regenerar.

**Contrato que usa la app:**

|                                   |                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Llamada                           | `supabase.rpc('reordenar_puntos', { p_zona_id, p_ids })`                                                                       |
| Éxito                             | filas `{ punto_id, nuevo_orden }` de todos los puntos de la zona, por orden nuevo                                              |
| Errores (en español en `message`) | `42501` sin sesión o sin rol; `22023` lista inválida (nula, vacía, con nulos, repetidos, de más o de menos) o zona inexistente |

## 11. Riesgos y consideraciones

- **Concurrencia entre reordenamientos:** un candado por zona (`pg_advisory_xact_lock`) los hace esperar uno tras otro; gana el último. No hay control de versiones: si dos personas reordenan a la vez, la segunda sobrescribe lo de la primera sin avisar.
- **Cambios simultáneos en los puntos de la zona:** los puntos se bloquean (`for update`) mientras dura la función, así que guardar una ubicación en ese instante espera. Si **alguien crea o borra un punto de la zona justo en ese momento**, la comprobación de «lista completa» puede quedar desactualizada; el gestor hoy no crea ni borra puntos, así que el riesgo es bajo.
- **Los valores de `orden` se reparten, no se renumeran.** Si quieres que la zona quede 1, 2, 3…, es una decisión aparte (y cambiaría qué puntos de demostración aparecen en el mapa).
- **Nombres:** si algún día se renombra la restricción `puntos_orden_por_zona`, la función fallará hasta que se actualice.
- **Roles:** la función usa `es_personal()`, la misma que las políticas, así que sigue cualquier cambio en cómo se definen los roles.
- **`security invoker`:** si alguien quita la política «personal edita puntos», la función dejaría de poder actualizar. Es lo deseado.
- **Una simulación SQL no es una sesión real:** la sección 7 no demuestra por sí sola que funcione con un inicio de sesión real (sección 7.5).
- **Sin probar en Supabase** hasta que ejecutes las secciones 6 y 7.

## 12. Checklist

**Antes**

- [ ] Estoy en el proyecto `la-merced-dev` (nombre en el panel).
- [ ] 4.1: la función no existe todavía.
- [ ] 4.2: `es_personal` y la restricción diferible existen.
- [ ] 4.3: guardé la copia del orden actual.
- [ ] 4.4: guardé el script de restauración en un archivo.

**Aplicación**

- [ ] Ejecuté el contenido **completo** de `20261123000001_reordenar_puntos.sql` y salió «Success».

**Después**

- [ ] 6.1 a 6.4 devuelven lo esperado (en especial: `anon` = false, `authenticated` = true).
- [ ] 6.5 (opcional): la llamada anónima por la API es rechazada con `permission denied`.
- [ ] La prueba controlada (sección 7) termina con «PRUEBA TERMINADA» y sin ninguna línea «FALLÓ», con los roles editor, revisor y admin.
- [ ] Repetí 4.3 y el orden es idéntico a mi copia, sin puntos `zz-prueba-reordenar-…`.
- [ ] Entendí que esto es una **simulación**; la prueba de extremo a extremo (sección 8) queda para cuando exista la interfaz.
- [ ] Avisé que la función existe y funciona, para empezar la interfaz.
