-- Las claves de i18next pueden llevar guiones: los nombres de las zonas usan su slug
-- (p. ej. 'zonas.fachada-principal'). La regla de 20261113000001 no los aceptaba y la semilla fallaba.

alter table public.textos_interfaz drop constraint textos_interfaz_clave_check;

alter table public.textos_interfaz
  add constraint textos_interfaz_clave_check
  check (clave ~ '^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*$');
