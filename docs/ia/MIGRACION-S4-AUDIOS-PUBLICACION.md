# Migración `20261125000001_audios_procedencia_publicaciones.sql`

> **Estado: escrita, NO aplicada en ningún entorno** (decisión E). La aplica el responsable del bloque 1
> y lo anota en el PR. Hasta entonces, «Publicar», la importación y las validaciones nuevas de audio en la
> base no funcionan contra `la-merced-dev`; el resto del PR sí (Kaqchikel, transcripción, audios, faltantes
> y el respaldo en la app).

## Propósito

1. **Audios validados en la base:** el audio de una ficha debe ser un medio `audio` del mismo punto y del
   mismo idioma (trigger `validar_audio_de_ficha`), vivir en `audios/` y terminar en `.mp3` o `.m4a`
   (restricción `medios_audio_valido`). Storage acepta en `audios/` solo esas extensiones (políticas
   «personal sube/reemplaza medios», ahora con `es_archivo_de_medios_valido`).
2. **Procedencia:** columna `procedencia jsonb` en `fichas`, `medios` y `fuentes`, para la importación.
3. **Publicaciones:** tabla `publicaciones` (versión, estado, JSON exacto, SHA-256, resumen, error),
   con una sola publicación en curso a la vez (índice único parcial), historial inmutable una vez terminada
   (trigger `proteger_publicacion_terminada`), RLS solo admin, y la función
   `instantanea_para_desplegar()` que el build de Vercel lee con la clave pública.

## Impacto

- Solo agrega. No cambia ni borra filas. Las restricciones nuevas de `medios` se crean `NOT VALID`: no se
  revisan las filas existentes, solo las nuevas.
- Reemplaza dos políticas de Storage por versiones más estrictas (mismo nombre). El resto de las reglas de
  acceso no cambia.
- `instantanea_para_desplegar()` es `security definer` y devuelve solo la instantánea, que ya es contenido
  público (lo aprobado).

## Cómo se aplica

1. SQL Editor de `la-merced-dev` (o `npm run db:push` con el proyecto enlazado): ejecutar el archivo entero.
2. `npm run db:types` y commit de `src/lib/tipos-db.ts`. Después, `src/datos/publicacion.ts` puede dejar
   su cliente sin tipos.
3. `npm run db:probar-rls` para confirmar que las reglas siguen igual.
4. Comprobación rápida:
   ```sql
   select public.instantanea_para_desplegar();          -- vacío hasta la primera publicación
   select count(*) from public.publicaciones;           -- 0
   ```

## Lo que falta configurar en Vercel (no es parte de la migración)

| Variable                 | Dónde                                                                                           | Valor                                                                                   |
| ------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `VERCEL_DEPLOY_HOOK_URL` | Vercel → Settings → Environment Variables → **Production** (solo servidor, sin prefijo `VITE_`) | URL de un deploy hook de la rama `main` (Settings → Git → Deploy Hooks). Es un secreto. |

`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` ya están en Vercel y también las usa la función. Sin
`VERCEL_DEPLOY_HOOK_URL`, «Publicar» responde 503 y lo dice en pantalla; no se crea ninguna publicación.

## Cómo funciona la publicación

1. El admin presiona «Publicar». `POST /api/publicar` (función de Vercel) comprueba el token y el rol
   (403 a editor y revisor), reserva la publicación (409 si ya hay una en curso) y lee lo público con la
   clave del visitante: las reglas de acceso ya dejan fuera borradores y revisión.
2. Arma la instantánea, comprueba que cada medio referido responde por su URL pública, la guarda con su
   SHA-256 en estado «desplegando» y llama al deploy hook.
3. El build de Vercel corre `scripts/incluir-instantanea.mjs`: copia a `dist/respaldo/publicacion.json`
   exactamente el texto de esa publicación (verifica la huella). Si la base no responde, conserva la de
   producción.
4. El gestor consulta el sitio cada 10 s y solo marca «Publicada» cuando `/respaldo/publicacion.json`
   tiene la misma versión y la misma huella. A los 15 min sin verla, la marca «fallida»; producción sigue
   con la última publicada.

## Reversión

```sql
drop function if exists public.instantanea_para_desplegar();
drop table if exists public.publicaciones;
drop function if exists public.proteger_publicacion_terminada();
drop type if exists public.estado_publicacion;
alter table public.fichas drop column if exists procedencia;
alter table public.medios drop column if exists procedencia;
alter table public.fuentes drop column if exists procedencia;
drop trigger if exists validar_audio on public.fichas;
drop function if exists public.validar_audio_de_ficha();
alter table public.medios drop constraint if exists medios_audio_valido;
-- Políticas de Storage como estaban:
drop policy "personal sube medios" on storage.objects;
create policy "personal sube medios" on storage.objects for insert to authenticated
  with check (bucket_id = 'medios' and public.es_carpeta_de_medios(name) and (select public.es_personal()));
drop policy "personal reemplaza medios" on storage.objects;
create policy "personal reemplaza medios" on storage.objects for update to authenticated
  using (bucket_id = 'medios' and (select public.es_personal()))
  with check (bucket_id = 'medios' and public.es_carpeta_de_medios(name) and (select public.es_personal()));
drop function if exists public.es_archivo_de_medios_valido(text);
```
