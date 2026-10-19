-- Reglas de acceso (RLS) en todas las tablas.
--
--   visitante (anon)  lee zonas, puntos, medios, fuentes y punto_fuentes; fichas solo aprobadas.
--   editor            además lee fichas en cualquier estado y crea/edita puntos, fichas, medios
--                     y fuentes. Puede pasar una ficha a revisión, pero no a aprobado.
--   revisor           lo mismo que el editor y además aprueba o devuelve fichas a borrador.
--   admin             todo, incluido asignar roles en perfiles.

-- ---------------------------------------------------------------------------
-- Rol del usuario actual
-- ---------------------------------------------------------------------------

-- security definer para leer perfiles sin pasar por su propia RLS.
create function public.rol_actual()
returns public.rol_usuario
language sql
stable
security definer
set search_path = ''
as $$
  select rol from public.perfiles where id = auth.uid();
$$;

revoke execute on function public.rol_actual() from public;
grant execute on function public.rol_actual() to anon, authenticated;

-- Atajos legibles para las políticas.
create function public.es_personal()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.rol_actual() is not null;
$$;

create function public.es_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select public.rol_actual() = 'admin';
$$;

-- ---------------------------------------------------------------------------
-- Activar RLS en todas las tablas, sin excepción
-- ---------------------------------------------------------------------------

alter table public.perfiles enable row level security;
alter table public.zonas enable row level security;
alter table public.puntos enable row level security;
alter table public.medios enable row level security;
alter table public.fichas enable row level security;
alter table public.fuentes enable row level security;
alter table public.punto_fuentes enable row level security;

-- ---------------------------------------------------------------------------
-- perfiles: el personal se ve entre sí; solo admin asigna roles
-- ---------------------------------------------------------------------------

create policy "personal lee perfiles" on public.perfiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.es_personal()));

create policy "admin gestiona perfiles" on public.perfiles
  for all to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

-- ---------------------------------------------------------------------------
-- zonas: lectura pública; solo admin las cambia
-- ---------------------------------------------------------------------------

create policy "todos leen zonas" on public.zonas
  for select to anon, authenticated
  using (true);

create policy "admin gestiona zonas" on public.zonas
  for all to authenticated
  using ((select public.es_admin()))
  with check ((select public.es_admin()));

-- ---------------------------------------------------------------------------
-- puntos, medios, fuentes, punto_fuentes: lectura pública; el personal crea y edita
-- ---------------------------------------------------------------------------

create policy "todos leen puntos" on public.puntos
  for select to anon, authenticated using (true);
create policy "personal crea puntos" on public.puntos
  for insert to authenticated with check ((select public.es_personal()));
create policy "personal edita puntos" on public.puntos
  for update to authenticated
  using ((select public.es_personal())) with check ((select public.es_personal()));
create policy "admin borra puntos" on public.puntos
  for delete to authenticated using ((select public.es_admin()));

create policy "todos leen medios" on public.medios
  for select to anon, authenticated using (true);
create policy "personal crea medios" on public.medios
  for insert to authenticated with check ((select public.es_personal()));
create policy "personal edita medios" on public.medios
  for update to authenticated
  using ((select public.es_personal())) with check ((select public.es_personal()));
create policy "personal borra medios" on public.medios
  for delete to authenticated using ((select public.es_personal()));

create policy "todos leen fuentes" on public.fuentes
  for select to anon, authenticated using (true);
create policy "personal crea fuentes" on public.fuentes
  for insert to authenticated with check ((select public.es_personal()));
create policy "personal edita fuentes" on public.fuentes
  for update to authenticated
  using ((select public.es_personal())) with check ((select public.es_personal()));
create policy "admin borra fuentes" on public.fuentes
  for delete to authenticated using ((select public.es_admin()));

create policy "todos leen punto_fuentes" on public.punto_fuentes
  for select to anon, authenticated using (true);
create policy "personal crea punto_fuentes" on public.punto_fuentes
  for insert to authenticated with check ((select public.es_personal()));
create policy "personal edita punto_fuentes" on public.punto_fuentes
  for update to authenticated
  using ((select public.es_personal())) with check ((select public.es_personal()));
create policy "personal borra punto_fuentes" on public.punto_fuentes
  for delete to authenticated using ((select public.es_personal()));

-- ---------------------------------------------------------------------------
-- fichas: el visitante solo ve las aprobadas; solo revisor y admin aprueban
-- ---------------------------------------------------------------------------

create policy "visitante lee fichas aprobadas" on public.fichas
  for select to anon, authenticated
  using (estado = 'aprobado');

create policy "personal lee todas las fichas" on public.fichas
  for select to authenticated
  using ((select public.es_personal()));

create policy "personal crea fichas" on public.fichas
  for insert to authenticated
  with check (
    (select public.rol_actual()) in ('revisor', 'admin')
    or ((select public.rol_actual()) = 'editor' and estado <> 'aprobado')
  );

-- Un editor puede editar una ficha aprobada, pero al guardarla debe volver a borrador o
-- revisión: cualquier cambio a contenido publicado pasa otra vez por un revisor.
create policy "personal edita fichas" on public.fichas
  for update to authenticated
  using ((select public.es_personal()))
  with check (
    (select public.rol_actual()) in ('revisor', 'admin')
    or ((select public.rol_actual()) = 'editor' and estado <> 'aprobado')
  );

create policy "admin borra fichas" on public.fichas
  for delete to authenticated using ((select public.es_admin()));
