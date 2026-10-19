import { supabase } from '@/lib/supabase'
import { urlPublica } from '@/lib/storage'
import type { Tables } from '@/lib/tipos-db'

export type ResumenZona = Pick<Tables<'zonas'>, 'slug' | 'orden' | 'disponible'>

export type ZonaConContorno = Pick<Tables<'zonas'>, 'slug' | 'usa_camara'> & {
  /** URL pública del contorno de alineación, o null si la zona no tiene. */
  urlContorno: string | null
}

/** Todas las zonas en orden, para el selector (las no disponibles se muestran como "próximamente"). */
export async function obtenerZonas(): Promise<ResumenZona[]> {
  const { data, error } = await supabase
    .from('zonas')
    .select('slug, orden, disponible')
    .order('orden', { ascending: true })

  if (error) throw new Error(`No se pudieron leer las zonas: ${error.message}`)
  return data
}

/** Una zona con lo que necesita la pantalla de cámara. Null si el slug no existe. */
export async function obtenerZona(slug: string): Promise<ZonaConContorno | null> {
  const { data, error } = await supabase
    .from('zonas')
    .select('slug, usa_camara, contorno:medios!zonas_contorno_id_fkey(ruta)')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw new Error(`No se pudo leer la zona "${slug}": ${error.message}`)
  if (!data) return null

  return {
    slug: data.slug,
    usa_camara: data.usa_camara,
    urlContorno: data.contorno ? urlPublica(data.contorno.ruta) : null,
  }
}
