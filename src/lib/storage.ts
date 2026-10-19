import { supabase } from '@/lib/supabase'

export const BUCKET_MEDIOS = 'medios'

/** URL pública de un archivo del bucket, a partir de su ruta (p. ej. `fotos/punto-01.webp`). */
export function urlPublica(ruta: string): string {
  return supabase.storage.from(BUCKET_MEDIOS).getPublicUrl(ruta).data.publicUrl
}
