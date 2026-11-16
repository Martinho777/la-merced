-- Textos de la interfaz del visitante, editables sin tocar código (Sprint 4, bloque 1).
--
-- Cada fila es una clave de i18next (p. ej. 'bienvenida.titulo') en un idioma. Al abrir, la app pone
-- estos textos encima de los JSON de src/i18n; si la base no responde o falta una clave, usa el JSON.
-- La sección «Textos de la app» del gestor (bloque 3) los edita.
--
-- Acceso: cualquiera lee (el visitante los necesita sin sesión); solo el rol admin crea, edita o borra.
-- La base anota quién y cuándo cambió cada texto.

create table public.textos_interfaz (
  clave text not null check (clave ~ '^[A-Za-z0-9_]+(\.[A-Za-z0-9_]+)*$'),
  idioma public.idioma not null,
  texto text not null check (btrim(texto) <> ''),
  actualizado_por uuid references public.perfiles (id) on delete set null,
  actualizado_en timestamptz not null default now(),
  primary key (clave, idioma)
);

comment on table public.textos_interfaz is
  'Textos de la interfaz del visitante por clave de i18next e idioma. Sobrescriben los JSON de src/i18n.';

-- Anota quién y cuándo creó o cambió el texto. En la semilla (sin sesión) actualizado_por queda null.
create function public.registrar_cambio_de_texto()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_por := auth.uid();
  new.actualizado_en := now();
  return new;
end;
$$;

create trigger registrar_cambio
  before insert or update on public.textos_interfaz
  for each row execute function public.registrar_cambio_de_texto();

-- ---------------------------------------------------------------------------
-- Reglas de acceso
-- ---------------------------------------------------------------------------

alter table public.textos_interfaz enable row level security;

create policy "todos leen textos" on public.textos_interfaz
  for select to anon, authenticated using (true);
create policy "admin crea textos" on public.textos_interfaz
  for insert to authenticated with check ((select public.es_admin()));
create policy "admin edita textos" on public.textos_interfaz
  for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));
create policy "admin borra textos" on public.textos_interfaz
  for delete to authenticated using ((select public.es_admin()));
