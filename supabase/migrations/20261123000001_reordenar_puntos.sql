-- Reordenar los puntos de una zona de forma atómica (Sprint 4, bloque 3, S4B3.4).
--
-- reordenar_puntos(p_zona_id, p_ids) recibe la lista COMPLETA de los puntos de una zona en el orden
-- nuevo y reasigna sus valores de `orden`. Todo ocurre en una sola transacción: si algo falla, no
-- cambia ningún punto.
--
-- Cómo asigna el orden: reparte entre los puntos, según su posición en la lista, los MISMOS valores
-- de `orden` que la zona ya tenía (el menor al primero, el siguiente al segundo, y así). No crea
-- números nuevos ni cierra huecos: si la zona tenía 1, 3 y 4, seguirá teniendo 1, 3 y 4. Así el mapa
-- del visitante, que completa con puntos de demostración los números de `orden` que no están
-- ocupados, no cambia por reordenar.
--
-- Acceso: la ejecuta quien tenga sesión y un rol (editor, revisor o admin). La función corre con los
-- permisos de quien la llama (security invoker), así que la política "personal edita puntos" también
-- se aplica. No hay cambios de esquema ni de políticas.
--
-- Es idempotente (create or replace, revoke, grant): ejecutarla de nuevo no daña nada.

create or replace function public.reordenar_puntos(p_zona_id uuid, p_ids uuid[])
returns table (punto_id uuid, nuevo_orden integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_total integer;
  v_sobran integer;
  v_faltan integer;
begin
  -- 1. Quién llama. Sin sesión o sin rol (editor, revisor, admin) no se hace nada.
  if not public.es_personal() then
    raise exception 'No tienes permiso para reordenar puntos.' using errcode = '42501';
  end if;

  -- 2. La lista debe ser válida: presente, no vacía, de una dimensión, sin nulos y sin repetidos.
  if p_zona_id is null or p_ids is null then
    raise exception 'Faltan la zona o la lista de puntos.' using errcode = '22023';
  end if;

  v_total := coalesce(cardinality(p_ids), 0);
  if v_total = 0 then
    raise exception 'La lista de puntos está vacía.' using errcode = '22023';
  end if;

  if array_ndims(p_ids) <> 1 then
    raise exception 'La lista de puntos debe ser de una sola dimensión.' using errcode = '22023';
  end if;

  if exists (select 1 from unnest(p_ids) as t (id) where t.id is null) then
    raise exception 'La lista de puntos contiene valores nulos.' using errcode = '22023';
  end if;

  if (select count(distinct t.id) from unnest(p_ids) as t (id)) <> v_total then
    raise exception 'La lista de puntos repite algún punto.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.zonas z where z.id = p_zona_id) then
    raise exception 'La zona indicada no existe.' using errcode = '22023';
  end if;

  -- 3. Un reordenamiento a la vez por zona, y los puntos de la zona quedan bloqueados hasta el
  --    final de la transacción: nadie los cambia mientras se comprueba y se reasigna.
  perform pg_advisory_xact_lock(hashtextextended('reordenar_puntos:' || p_zona_id::text, 0));
  perform 1 from public.puntos p where p.zona_id = p_zona_id order by p.id for update;

  -- 4. La lista debe ser exactamente el conjunto de puntos de la zona: ni de más ni de menos.
  select count(*) into v_sobran
  from unnest(p_ids) as t (id)
  where not exists (
    select 1 from public.puntos p where p.id = t.id and p.zona_id = p_zona_id
  );
  if v_sobran > 0 then
    raise exception 'La lista incluye % punto(s) que no existen o no pertenecen a la zona.', v_sobran
      using errcode = '22023';
  end if;

  select count(*) into v_faltan
  from public.puntos p
  where p.zona_id = p_zona_id and p.id <> all (p_ids);
  if v_faltan > 0 then
    raise exception 'La lista no incluye % punto(s) de la zona.', v_faltan using errcode = '22023';
  end if;

  -- 5. Reasignar. La restricción (zona_id, orden) es diferible: durante el UPDATE dos puntos pueden
  --    tener un mismo valor un instante (al intercambiar, por ejemplo); se comprueba una vez al final.
  set constraints public.puntos_orden_por_zona deferred;

  update public.puntos as p
  set orden = a.orden
  from (
    select t.id, t.pos
    from unnest(p_ids) with ordinality as t (id, pos)
  ) as n
  join (
    select q.orden, row_number() over (order by q.orden) as pos
    from public.puntos q
    where q.zona_id = p_zona_id
  ) as a on a.pos = n.pos
  where p.id = n.id
    and p.zona_id = p_zona_id
    and p.orden <> a.orden;

  -- Comprobar la unicidad ya, dentro de la función, para que un fallo se vea aquí y no al cerrar la
  -- transacción.
  set constraints public.puntos_orden_por_zona immediate;

  return query
  select p.id, p.orden
  from public.puntos p
  where p.zona_id = p_zona_id
  order by p.orden;
end;
$$;

comment on function public.reordenar_puntos(uuid, uuid[]) is
  'Reasigna atómicamente el orden de todos los puntos de una zona según la lista de ids dada (S4B3.4). Solo personal (editor, revisor, admin).';

-- Solo con sesión: ni el visitante anónimo ni PUBLIC pueden ejecutarla. (En Supabase, anon recibe
-- permisos por defecto sobre las funciones nuevas; hay que quitárselos de forma explícita.)
revoke execute on function public.reordenar_puntos(uuid, uuid[]) from public, anon;
grant execute on function public.reordenar_puntos(uuid, uuid[]) to authenticated;
