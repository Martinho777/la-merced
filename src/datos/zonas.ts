import { supabase } from '@/lib/supabase'
import { urlPublica } from '@/lib/storage'
import type { Enums, Tables } from '@/lib/tipos-db'

type Idioma = Enums<'idioma'>

export type ResumenZona = Pick<Tables<'zonas'>, 'slug' | 'orden' | 'disponible'> & {
  /** Cuántos puntos tiene la zona en la base. */
  totalPuntos: number
  /** Ilustración de la zona para el selector, o null si todavía no tiene. */
  ilustracion: { url: string; textoAlternativo: Partial<Record<Idioma, string>> } | null
}

export type ZonaConContorno = Pick<Tables<'zonas'>, 'slug' | 'usa_camara'> & {
  /** URL pública del contorno de alineación, o null si la zona no tiene. */
  urlContorno: string | null
}

/** Todas las zonas en orden, para el selector (las no disponibles se muestran como "próximamente"). */
export async function obtenerZonas(): Promise<ResumenZona[]> {
  const { data, error } = await supabase
    .from('zonas')
    .select(
      `slug, orden, disponible,
       puntos(count),
       ilustracion:medios!zonas_ilustracion_id_fkey(ruta, texto_alternativo)`,
    )
    .order('orden', { ascending: true })

  if (error) throw new Error(`No se pudieron leer las zonas: ${error.message}`)

  return data.map((zona) => ({
    slug: zona.slug,
    orden: zona.orden,
    disponible: zona.disponible,
    totalPuntos: zona.puntos[0]?.count ?? 0,
    ilustracion: zona.ilustracion
      ? {
          url: urlPublica(zona.ilustracion.ruta),
          textoAlternativo: zona.ilustracion.texto_alternativo as Partial<Record<Idioma, string>>,
        }
      : null,
  }))
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
