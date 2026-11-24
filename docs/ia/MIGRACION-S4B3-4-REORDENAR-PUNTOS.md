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
- Invertir el orden de una zona de 4 puntos funciona aunque se intercambien valores (la restricción diferida) y conserva el mismo conjunto de valores de `orden`.
- Se rechazan: lista repetida, con un punto de menos, con un id desconocido, con un elemento nulo, vacía, nula, y ids de otra zona. Después de rechazar, el orden no cambió.
- Con los roles `editor`, `revisor` y `admin` funciona. Un usuario sin rol y el visitante anónimo son rechazados.
- Atomicidad: forcé un fallo a mitad del `UPDATE` (un trigger de prueba) y no quedó ningún punto cambiado.
- Concurrencia: dos reordenamientos simultáneos de la misma zona se ejecutan uno tras otro (el segundo esperó al primero) y el resultado final fue el del último.
- Las consultas de verificación de la sección 6 devuelven lo descrito allí.

**No verificado:** nada de esto se ha ejecutado en `la-merced-dev`. Las diferencias con Supabase (la implementación real de `auth.uid()`, PostgREST, los permisos por defecto) pueden dar sorpresas. Por eso existen las secciones 6 y 7. Tampoco se probó llamar a la función desde el navegador con una sesión real.

## 4. Antes de aplicar

Haz esto antes de nada. Todo es **solo lectura**.

1. Abre el panel de Supabase y confirma que estás en el proyecto **`la-merced-dev`** (el nombre aparece arriba a la izquierda). Si no es ese, detente.
2. Ve a **SQL Editor → New query**.
3. Ejecuta, **uno por uno**, estos tres bloques.

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

**[SOLO LECTURA] 4.3. Copia de seguridad del orden actual.** Guarda el resultado completo (cópialo a un archivo o toma una captura). Si algo sale mal, es lo que necesitas para devolver el orden original:

```sql
select z.slug as zona, p.slug as punto, p.id, p.orden
from public.puntos p
join public.zonas z on z.id = p.zona_id
order by z.slug, p.orden;
```

## 5. Aplicar la migración

**Archivo a ejecutar:** [`supabase/migrations/20261123000001_reordenar_puntos.sql`](../../supabase/migrations/20261123000001_reordenar_puntos.sql). Ejecuta su **contenido completo**, de la primera línea de comentarios a la última línea (`grant execute ...`). No ejecutes solo una parte.

**[MODIFICA LA BASE]** Pasos:

1. Abre el archivo en tu editor y copia **todo** su contenido.
2. En el panel de `la-merced-dev`, ve a **SQL Editor → New query**.
3. Pega el contenido completo.
4. Pulsa **Run**. Si el panel avisa de una operación «potencialmente destructiva» por el `revoke`, revisa que sea esta función y confirma.
5. El resultado esperado es **Success. No rows returned**. Si sale un error, copia el mensaje completo y no sigas; la sección 8 explica cómo dejarlo como estaba.

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

**[SOLO LECTURA] 6.3. Lista de permisos** (esperado: `authenticated`, más los roles internos `postgres` y `service_role`. **No** debe aparecer `anon` ni `PUBLIC`):

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

## 7. Prueba controlada del reordenamiento (no deja nada cambiado)

Esta prueba **modifica datos dentro de una transacción y los revierte sola**: hace un reordenamiento real de la zona `fachada-principal`, lo comprueba y termina con un error **intencional** que deshace todo. Por eso el panel mostrará un error en rojo. **Ese error es el resultado esperado**: el texto del error es el informe de la prueba.

**[MODIFICA Y SE REVIERTE SOLO]** Ejecuta este bloque completo en una consulta nueva:

```sql
do $$
declare
  v_rol text := 'editor';                    -- cambia a 'revisor' o 'admin' para repetir con otro rol
  v_zona_slug text := 'fachada-principal';
  v_usuario uuid;
  v_zona uuid;
  v_otra_zona uuid;
  v_antes uuid[];
  v_ordenes_antes integer[];
  v_invertida uuid[];
  v_despues uuid[];
  v_ordenes_despues integer[];
  v_n integer;
  v_caso text;
  v_lista uuid[];
  v_informe text := '';
begin
  select p.id into v_usuario from public.perfiles p where p.rol = v_rol::public.rol_usuario limit 1;
  if v_usuario is null then raise exception 'No hay ningún usuario con rol %.', v_rol; end if;

  select z.id into v_zona from public.zonas z where z.slug = v_zona_slug;
  select z.id into v_otra_zona from public.zonas z where z.slug <> v_zona_slug limit 1;

  select array_agg(p.id order by p.orden), array_agg(p.orden order by p.orden)
    into v_antes, v_ordenes_antes
  from public.puntos p where p.zona_id = v_zona;
  v_n := coalesce(cardinality(v_antes), 0);
  if v_n < 2 then raise exception 'Se necesitan al menos 2 puntos en la zona para la prueba.'; end if;

  select array_agg(t.id order by t.pos desc) into v_invertida from unnest(v_antes) with ordinality as t (id, pos);

  -- Actuar como el usuario elegido (como lo haría la app con su sesión).
  perform set_config('request.jwt.claims', json_build_object('sub', v_usuario, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- 1. Invertir el orden completo: debe funcionar aunque se intercambien valores (restricción diferida).
  perform public.reordenar_puntos(v_zona, v_invertida);
  select array_agg(p.id order by p.orden), array_agg(p.orden order by p.orden)
    into v_despues, v_ordenes_despues
  from public.puntos p where p.zona_id = v_zona;
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

**Resultado esperado** (el mensaje del error, algo como):

```text
PRUEBA TERMINADA. Se revirtió TODO (este error es intencional).
Rol probado: editor
1. Inversión del orden: OK. Mismos valores de orden que antes: OK.
2. Lista duplicado: rechazada -> La lista de puntos repite algún punto.
2. Lista faltante: rechazada -> La lista no incluye 1 punto(s) de la zona.
2. Lista desconocido: rechazada -> La lista incluye 1 punto(s) que no existen o no pertenecen a la zona.
2. Lista elemento nulo: rechazada -> La lista de puntos contiene valores nulos.
2. Lista vacía: rechazada -> La lista de puntos está vacía.
2. Lista nula: rechazada -> Faltan la zona o la lista de puntos.
2. Puntos de otra zona: rechazado -> La lista incluye N punto(s) que no existen o no pertenecen a la zona.
3. Tras los rechazos el orden no cambió: OK.
4. Usuario sin rol: rechazado -> No tienes permiso para reordenar puntos.
4. Visitante anónimo: rechazado -> permission denied for function reordenar_puntos
```

- Cualquier línea que diga **FALLÓ** es un problema: no sigas y copia el informe completo.
- Repítela cambiando `v_rol` a `'revisor'` y a `'admin'` (primera línea del bloque `declare`).
- Si dice «No hay ningún usuario con rol…», falta ese usuario de prueba en `perfiles`.
- La prueba necesita al menos 2 puntos reales en `fachada-principal`.

**[SOLO LECTURA] Después, confirma que no cambió nada.** Repite la consulta 4.3 y compárala con la copia que guardaste: debe ser idéntica.

Qué no cubre esta prueba, y no debe darse por probado hasta hacerlo: llamar a la función desde la app con una sesión real (eso es la interfaz, el siguiente paso) y la concurrencia dentro de Supabase.

## 8. Reversión

**[MODIFICA LA BASE: esquema]** Para retirar la función y sus permisos:

```sql
drop function if exists public.reordenar_puntos(uuid, uuid[]);
```

Efectos:

- Se elimina la función y, con ella, sus permisos. Es lo único que la migración creó.
- **No afecta a los puntos existentes**: sus valores de `orden`, las fichas, la restricción y las políticas quedan igual.
- Hoy ningún código de la app llama a la función, así que no se rompe nada. Si más adelante la interfaz ya la usa, dejaría de poder reordenar hasta que se vuelva a aplicar la migración.
- El archivo de migración del repositorio no cambia: volver a aplicarlo la crea de nuevo.

**Si ya reordenaste puntos de verdad y quieres devolver el orden original**, la función no se deshace sola: usa la copia de la consulta 4.3. **[MODIFICA LA BASE: datos]** Plantilla (rellena con tus valores; va en una sola transacción porque durante el cambio dos puntos pueden coincidir un instante):

```sql
begin;
set constraints public.puntos_orden_por_zona deferred;
update public.puntos p
set orden = v.orden
from (values
  ('<id del punto 1>'::uuid, 1),
  ('<id del punto 2>'::uuid, 3)
  -- ...un renglón por cada punto de la zona, con su orden original
) as v (id, orden)
where p.id = v.id;
set constraints public.puntos_orden_por_zona immediate;
commit;
```

## 9. Después de aplicar

- **No empieces la interfaz.** Esperamos tu confirmación de que la función existe (sección 6) y pasa la prueba (sección 7) en `la-merced-dev`.
- **Tipos generados:** `src/lib/tipos-db.ts` todavía no conoce la función. Se regenera con `npm run db:types`, que consulta el proyecto enlazado y por eso necesita tu aprobación explícita. Mientras tanto, [`src/datos/reordenar.ts`](../../src/datos/reordenar.ts) la llama con un envoltorio sin tipos, que se quita al regenerar.

**Contrato que usa la app:**

|                                   |                                                                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Llamada                           | `supabase.rpc('reordenar_puntos', { p_zona_id, p_ids })`                                                                       |
| Éxito                             | filas `{ punto_id, nuevo_orden }` de todos los puntos de la zona, por orden nuevo                                              |
| Errores (en español en `message`) | `42501` sin sesión o sin rol; `22023` lista inválida (nula, vacía, con nulos, repetidos, de más o de menos) o zona inexistente |

## 10. Riesgos y consideraciones

- **Concurrencia entre reordenamientos:** un candado por zona (`pg_advisory_xact_lock`) los hace esperar uno tras otro; gana el último. No hay control de versiones: si dos personas reordenan a la vez, la segunda sobrescribe lo de la primera sin avisar.
- **Cambios simultáneos en los puntos de la zona:** los puntos se bloquean (`for update`) mientras dura la función, así que guardar una ubicación en ese instante espera. Si **alguien crea o borra un punto de la zona justo en ese momento**, la comprobación de «lista completa» puede quedar desactualizada; el gestor hoy no crea ni borra puntos, así que el riesgo es bajo.
- **Los valores de `orden` se reparten, no se renumeran.** Si quieres que la zona quede 1, 2, 3…, es una decisión aparte (y cambiaría qué puntos de demostración aparecen en el mapa).
- **Nombres:** si algún día se renombra la restricción `puntos_orden_por_zona`, la función fallará hasta que se actualice.
- **Roles:** la función usa `es_personal()`, la misma que las políticas, así que sigue cualquier cambio en cómo se definen los roles.
- **`security invoker`:** si alguien quita la política «personal edita puntos», la función dejaría de poder actualizar. Es lo deseado.
- **Sin probar en Supabase** hasta que ejecutes la sección 7.

## 11. Checklist

**Antes**

- [ ] Estoy en el proyecto `la-merced-dev` (nombre en el panel).
- [ ] 4.1: la función no existe todavía.
- [ ] 4.2: `es_personal` y la restricción diferible existen.
- [ ] 4.3: guardé la copia del orden actual.

**Aplicación**

- [ ] Ejecuté el contenido **completo** de `20261123000001_reordenar_puntos.sql` y salió «Success».

**Después**

- [ ] 6.1 a 6.4 devuelven lo esperado (en especial: `anon` = false, `authenticated` = true).
- [ ] La prueba controlada (sección 7) termina con «PRUEBA TERMINADA» y sin ninguna línea «FALLÓ», con los roles editor, revisor y admin.
- [ ] Repetí 4.3 y el orden es idéntico a mi copia.
- [ ] Avisé que la función existe y funciona, para empezar la interfaz.
