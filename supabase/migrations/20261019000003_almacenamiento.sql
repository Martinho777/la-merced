-- Bucket público "medios" con carpetas fotos/, audios/, ilustraciones/ y modelos/.
-- Lectura pública por URL; subir, reemplazar y borrar solo para editor, revisor y admin.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medios',
  'medios',
  true,
  52428800, -- 50 MB, el máximo por archivo del plan gratuito
  array[
    'image/jpeg',
    'image/webp',
    'image/svg+xml',
    'audio/mpeg',
    'audio/mp4',
    'audio/x-m4a',
    'model/gltf-binary'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Solo se aceptan archivos dentro de las cuatro carpetas.
create function public.es_carpeta_de_medios(nombre text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select (storage.foldername(nombre))[1] in ('fotos', 'audios', 'ilustraciones', 'modelos');
$$;

-- Listar el bucket (el gestor lo necesita). Descargar por URL pública no requiere política.
create policy "personal lista medios" on storage.objects
  for select to authenticated
  using (bucket_id = 'medios' and (select public.es_personal()));

create policy "personal sube medios" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'medios'
    and public.es_carpeta_de_medios(name)
    and (select public.es_personal())
  );

create policy "personal reemplaza medios" on storage.objects
  for update to authenticated
  using (bucket_id = 'medios' and (select public.es_personal()))
  with check (
    bucket_id = 'medios'
    and public.es_carpeta_de_medios(name)
    and (select public.es_personal())
  );

create policy "personal borra medios del bucket" on storage.objects
  for delete to authenticated
  using (bucket_id = 'medios' and (select public.es_personal()));
