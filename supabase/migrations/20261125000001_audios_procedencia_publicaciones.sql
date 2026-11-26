-- Gestor: audios, publicación y carga de las fichas (Sprint 4).
--
-- 1. Audios: la base comprueba que el audio de una ficha sea un audio del mismo punto y del mismo
--    idioma, y Storage solo acepta MP3 o M4A dentro de audios/. Antes solo lo revisaba el navegador.
-- 2. Procedencia: fichas, medios y fuentes anotan de qué entrega de la URL vienen (importación).
-- 3. Publicaciones: cada vez que un admin presiona «Publicar» queda una fila con la instantánea JSON
--    exacta que se despliega en Vercel, su versión, su huella SHA-256 y su estado. Solo puede haber
--    una publicación en curso. Una publicación fallida nunca reemplaza a la última válida.
--
-- Solo agrega: no cambia ni borra datos existentes. Las restricciones nuevas sobre medios se crean
-- NOT VALID: se exigen a lo nuevo, sin revisar las filas que ya existen.

-- ---------------------------------------------------------------------------
-- 1. Audios
-- ---------------------------------------------------------------------------

-- Un audio siempre tiene idioma y vive en audios/ como .mp3 o .m4a.
alter table public.medios
  add constraint medios_audio_valido check (
    tipo <> 'audio'
    or (idioma is not null and ruta ~ '^audios/[^/]+\.(mp3|m4a)$')
  ) not valid;

-- El audio de una ficha debe ser un medio de tipo audio, del mismo punto y del mismo idioma.
create function public.validar_audio_de_ficha()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  medio record;
begin
  if new.audio_id is null then
    return new;
  end if;

  select tipo, idioma, punto_id into medio from public.medios where id = new.audio_id;

  if not found or medio.tipo <> 'audio' then
    raise exception 'El medio % no es un audio', new.audio_id using errcode = '23514';
  end if;
  if medio.idioma is distinct from new.idioma then
    raise exception 'El audio es en %, pero la ficha es en %', medio.idioma, new.idioma
      using errcode = '23514';
  end if;
  if medio.punto_id is distinct from new.punto_id then
    raise exception 'El audio pertenece a otro punto' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger validar_audio
  before insert or update of audio_id, idioma, punto_id on public.fichas
  for each row execute function public.validar_audio_de_ficha();

-- Storage: además de las cuatro carpetas, en audios/ solo se aceptan .mp3 y .m4a. El tamaño máximo
-- (50 MB) y los tipos MIME ya los exige el bucket.
create function public.es_archivo_de_medios_valido(nombre text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select public.es_carpeta_de_medios(nombre)
    and (
      (storage.foldername(nombre))[1] <> 'audios'
      or lower(storage.extension(nombre)) in ('mp3', 'm4a')
    );
$$;

drop policy "personal sube medios" on storage.objects;
create policy "personal sube medios" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'medios'
    and public.es_archivo_de_medios_valido(name)
    and (select public.es_personal())
  );

drop policy "personal reemplaza medios" on storage.objects;
create policy "personal reemplaza medios" on storage.objects
  for update to authenticated
  using (bucket_id = 'medios' and (select public.es_personal()))
  with check (
    bucket_id = 'medios'
    and public.es_archivo_de_medios_valido(name)
    and (select public.es_personal())
  );

-- ---------------------------------------------------------------------------
-- 2. Procedencia de lo importado
-- ---------------------------------------------------------------------------

-- Ejemplo: {"origen": "URL", "entrega": "2026-11-23", "archivo": "fichas/07.docx", "sha256": "…"}.
-- Null en lo que se escribió a mano en el gestor. No se publica en la instantánea.
alter table public.fichas add column procedencia jsonb;
alter table public.medios add column procedencia jsonb;
alter table public.fuentes add column procedencia jsonb;

comment on column public.fichas.procedencia is
  'De qué entrega de la URL viene la ficha (importación). Null si se escribió en el gestor.';
comment on column public.medios.procedencia is
  'De qué entrega de la URL viene el archivo (importación). Null si se subió desde el gestor.';
comment on column public.fuentes.procedencia is
  'De qué entrega de la URL viene la fuente (importación). Null si se creó en el gestor.';

-- ---------------------------------------------------------------------------
-- 3. Publicaciones
-- ---------------------------------------------------------------------------

create type public.estado_publicacion as enum ('generando', 'desplegando', 'publicada', 'fallida');

create table public.publicaciones (
  id uuid primary key default gen_random_uuid(),
  version integer generated always as identity unique,
  estado public.estado_publicacion not null default 'generando',
  -- El JSON exacto que se despliega (texto, no jsonb, para conservar cada byte y su huella).
  contenido text,
  sha256 text check (sha256 ~ '^[0-9a-f]{64}$'),
  -- Cuántos puntos, fichas y medios incluye.
  resumen jsonb not null default '{}'::jsonb,
  error text,
  creada_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now(),
  desplegado_en timestamptz,
  actualizado_en timestamptz not null default now(),
  constraint publicaciones_contenido_con_huella check ((contenido is null) = (sha256 is null)),
  constraint publicaciones_desplegando_con_contenido check (
    estado not in ('desplegando', 'publicada') or contenido is not null
  )
);

comment on table public.publicaciones is
  'Cada «Publicar» del gestor: la instantánea JSON de lo aprobado que se despliega en Vercel.';

-- Una sola publicación en curso a la vez: dos admins no pueden pisarse.
create unique index publicaciones_una_en_curso on public.publicaciones ((true))
  where estado in ('generando', 'desplegando');

create trigger fijar_actualizado_en before update on public.publicaciones
  for each row execute function public.fijar_actualizado_en();

-- Una publicación terminada (publicada o fallida) ya no cambia, y una publicada nunca pasa a fallida.
create function public.proteger_publicacion_terminada()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.estado in ('publicada', 'fallida') then
    raise exception 'La publicación % ya terminó (%)', old.version, old.estado
      using errcode = '23514';
  end if;
  if new.contenido is distinct from old.contenido and old.estado <> 'generando' then
    raise exception 'El contenido de una publicación no cambia después de generarse'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger proteger_terminada
  before update on public.publicaciones
  for each row execute function public.proteger_publicacion_terminada();

alter table public.publicaciones enable row level security;

-- Solo el admin publica, consulta y actualiza el estado. Nadie borra el historial.
create policy "admin lee publicaciones" on public.publicaciones
  for select to authenticated using ((select public.es_admin()));
create policy "admin crea publicaciones" on public.publicaciones
  for insert to authenticated
  with check ((select public.es_admin()) and estado = 'generando' and contenido is null);
create policy "admin actualiza publicaciones" on public.publicaciones
  for update to authenticated
  using ((select public.es_admin())) with check ((select public.es_admin()));

-- La instantánea que debe llevar el próximo despliegue: la que se está desplegando o, si no hay,
-- la última publicada. La usa el build de Vercel con la clave pública. Solo devuelve contenido
-- público (lo aprobado), así que puede leerla cualquiera.
create function public.instantanea_para_desplegar()
returns table (version integer, estado public.estado_publicacion, sha256 text, contenido text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.version, p.estado, p.sha256, p.contenido
  from public.publicaciones p
  where p.estado in ('desplegando', 'publicada')
  order by (p.estado = 'desplegando') desc, p.version desc
  limit 1;
$$;

revoke execute on function public.instantanea_para_desplegar() from public;
grant execute on function public.instantanea_para_desplegar() to anon, authenticated;
