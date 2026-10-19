-- Esquema inicial: tipos enumerados, tablas y triggers de fechas.
-- Las reglas de acceso (RLS) van en la siguiente migración.

-- ---------------------------------------------------------------------------
-- Tipos enumerados
-- ---------------------------------------------------------------------------

create type public.idioma as enum ('es', 'cak', 'en');
create type public.estado_contenido as enum ('borrador', 'revision', 'aprobado');
create type public.nivel_confianza as enum ('documentado', 'probable', 'especulativo');
create type public.tipo_medio as enum ('foto', 'foto_historica', 'audio', 'ilustracion', 'modelo_3d');
create type public.rol_usuario as enum ('editor', 'revisor', 'admin');

-- ---------------------------------------------------------------------------
-- Trigger común: mantiene actualizado_en al día
-- ---------------------------------------------------------------------------

create function public.fijar_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- perfiles: una fila por usuario del gestor
-- ---------------------------------------------------------------------------

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  -- null = sin permisos hasta que un admin le asigne un rol
  rol public.rol_usuario,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- Crea el perfil automáticamente cuando se invita a un usuario.
create function public.crear_perfil_de_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', new.email));
  return new;
end;
$$;

create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil_de_usuario();

-- ---------------------------------------------------------------------------
-- zonas
-- ---------------------------------------------------------------------------

create table public.zonas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  orden integer not null unique,
  disponible boolean not null default false,
  usa_camara boolean not null default false,
  ilustracion_id uuid, -- FK a medios, se agrega abajo
  contorno_id uuid, -- FK a medios, se agrega abajo
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- puntos
-- ---------------------------------------------------------------------------

create table public.puntos (
  id uuid primary key default gen_random_uuid(),
  zona_id uuid not null references public.zonas (id) on delete restrict,
  slug text not null unique,
  orden integer not null,
  es_esencial boolean not null default false,
  -- Relativos al ancho y alto de la ilustración (0 a 1). Null mientras no se ubique.
  pos_x numeric(6, 5) check (pos_x between 0 and 1),
  pos_y numeric(6, 5) check (pos_y between 0 and 1),
  tiene_3d boolean not null default false,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  -- Diferible para poder reordenar la ruta en una sola transacción.
  constraint puntos_orden_por_zona unique (zona_id, orden) deferrable initially immediate
);

-- ---------------------------------------------------------------------------
-- medios: fotos, audios, ilustraciones y modelos 3D guardados en Storage
-- ---------------------------------------------------------------------------

create table public.medios (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_medio not null,
  ruta text not null unique, -- ruta dentro del bucket "medios", p. ej. fotos/punto-01.webp
  punto_id uuid references public.puntos (id) on delete set null,
  idioma public.idioma, -- solo para audios
  texto_alternativo jsonb not null default '{}'::jsonb, -- { "es": "...", "cak": "...", "en": "..." }
  credito text,
  fecha_original text, -- texto libre: "1920", "ca. 1890", "siglo XVIII"
  derechos text,
  ancho integer check (ancho > 0),
  alto integer check (alto > 0),
  duracion_s numeric(8, 2) check (duracion_s >= 0),
  peso_bytes bigint check (peso_bytes >= 0),
  orden integer not null default 0,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  -- Accesibilidad: fotos e ilustraciones necesitan al menos el texto alternativo en español.
  constraint medios_texto_alternativo_obligatorio check (
    tipo not in ('foto', 'foto_historica', 'ilustracion')
    or length(trim(coalesce(texto_alternativo ->> 'es', ''))) > 0
  )
);

create index medios_punto_id_idx on public.medios (punto_id);

alter table public.zonas
  add constraint zonas_ilustracion_id_fkey
    foreign key (ilustracion_id) references public.medios (id) on delete set null,
  add constraint zonas_contorno_id_fkey
    foreign key (contorno_id) references public.medios (id) on delete set null;

-- ---------------------------------------------------------------------------
-- fichas: una por punto y por idioma
-- ---------------------------------------------------------------------------

create table public.fichas (
  id uuid primary key default gen_random_uuid(),
  punto_id uuid not null references public.puntos (id) on delete cascade,
  idioma public.idioma not null,
  titulo text not null,
  que_ves text,
  historia text,
  dato_santi text,
  transcripcion text,
  audio_id uuid references public.medios (id) on delete set null,
  estado public.estado_contenido not null default 'borrador',
  revisado_por uuid references public.perfiles (id) on delete set null,
  revisado_en timestamptz,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  constraint fichas_un_idioma_por_punto unique (punto_id, idioma)
);

-- Registra quién y cuándo aprobó (o devolvió) una ficha.
create function public.registrar_revision_de_ficha()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.estado is distinct from old.estado and new.estado in ('aprobado', 'borrador') then
    new.revisado_por := auth.uid();
    new.revisado_en := now();
  end if;
  return new;
end;
$$;

create trigger registrar_revision
  before update of estado on public.fichas
  for each row execute function public.registrar_revision_de_ficha();

-- ---------------------------------------------------------------------------
-- fuentes y su relación con los puntos
-- ---------------------------------------------------------------------------

create table public.fuentes (
  id uuid primary key default gen_random_uuid(),
  cita text not null,
  url text,
  tipo text not null check (tipo in ('archivo', 'libro', 'entrevista', 'sitio_web')),
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.punto_fuentes (
  punto_id uuid not null references public.puntos (id) on delete cascade,
  fuente_id uuid not null references public.fuentes (id) on delete restrict,
  nivel_confianza public.nivel_confianza not null,
  nota text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  primary key (punto_id, fuente_id)
);

create index punto_fuentes_fuente_id_idx on public.punto_fuentes (fuente_id);

-- ---------------------------------------------------------------------------
-- Triggers de actualizado_en
-- ---------------------------------------------------------------------------

create trigger fijar_actualizado_en before update on public.perfiles
  for each row execute function public.fijar_actualizado_en();
create trigger fijar_actualizado_en before update on public.zonas
  for each row execute function public.fijar_actualizado_en();
create trigger fijar_actualizado_en before update on public.puntos
  for each row execute function public.fijar_actualizado_en();
create trigger fijar_actualizado_en before update on public.medios
  for each row execute function public.fijar_actualizado_en();
create trigger fijar_actualizado_en before update on public.fichas
  for each row execute function public.fijar_actualizado_en();
create trigger fijar_actualizado_en before update on public.fuentes
  for each row execute function public.fijar_actualizado_en();
create trigger fijar_actualizado_en before update on public.punto_fuentes
  for each row execute function public.fijar_actualizado_en();
