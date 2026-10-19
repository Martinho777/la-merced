-- Datos semilla: las tres zonas, un punto de prueba con su ficha en español (aprobada),
-- una fuente con nivel documentado y el contorno provisional de la fachada principal.
-- Es idempotente: se puede correr varias veces sin duplicar filas.
--
-- El archivo del contorno se sube aparte (ver README):
--   supabase/contorno-provisional.svg
--   -> medios/ilustraciones/fachada-principal-contorno-provisional.svg

-- Zonas. Los nombres visibles van en src/i18n/, no aquí.
insert into public.zonas (id, slug, orden, disponible, usa_camara) values
  ('00000000-0000-4000-a000-000000000001', 'fachada-principal', 1, true, true),
  ('00000000-0000-4000-a000-000000000002', 'fachada-secundaria', 2, false, true),
  ('00000000-0000-4000-a000-000000000003', 'interior', 3, false, false)
on conflict (id) do nothing;

-- Contorno provisional de la fachada principal (lo reemplaza el definitivo en el Sprint 3).
insert into public.medios (id, tipo, ruta, texto_alternativo, credito) values
  (
    '00000000-0000-4000-c000-000000000001',
    'ilustracion',
    'ilustraciones/fachada-principal-contorno-provisional.svg',
    '{"es": "Contorno provisional de la fachada principal de La Merced", "en": "Provisional outline of the main façade of La Merced"}',
    'Equipo Guía La Merced (provisional)'
  )
on conflict (id) do nothing;

update public.zonas
set contorno_id = '00000000-0000-4000-c000-000000000001'
where slug = 'fachada-principal' and contorno_id is null;

-- Punto de prueba en la fachada principal.
insert into public.puntos (id, zona_id, slug, orden, es_esencial, pos_x, pos_y) values
  (
    '00000000-0000-4000-b000-000000000001',
    '00000000-0000-4000-a000-000000000001',
    'punto-de-prueba',
    1,
    true,
    0.5,
    0.5
  )
on conflict (id) do nothing;

-- Su ficha en español, ya aprobada para que el visitante la vea.
insert into public.fichas (punto_id, idioma, titulo, que_ves, historia, dato_santi, estado) values
  (
    '00000000-0000-4000-b000-000000000001',
    'es',
    'Punto de prueba',
    'Este texto viene de la base de datos en Supabase. Si lo ves en la app publicada, la conexión funciona de punta a punta.',
    'Ficha de prueba del Sprint 2. Se reemplaza por las fichas reales del equipo de investigación.',
    '¡Hola! Soy Santi y todavía estoy aprendiendo la historia de La Merced.',
    'aprobado'
  )
on conflict (punto_id, idioma) do nothing;

-- Una fuente de prueba con nivel documentado.
insert into public.fuentes (id, cita, url, tipo) values
  (
    '00000000-0000-4000-d000-000000000001',
    'Fuente de prueba (reemplazar por una referencia real)',
    null,
    'archivo'
  )
on conflict (id) do nothing;

insert into public.punto_fuentes (punto_id, fuente_id, nivel_confianza, nota) values
  (
    '00000000-0000-4000-b000-000000000001',
    '00000000-0000-4000-d000-000000000001',
    'documentado',
    'Dato de prueba'
  )
on conflict (punto_id, fuente_id) do nothing;
