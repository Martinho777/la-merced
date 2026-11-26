import { supabase } from '@/lib/supabase'
import { urlPublica } from '@/lib/storage'
import { conRespaldo, zonaDesdeInstantanea, zonasDesdeInstantanea } from '@/datos/respaldo'
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
  /** URL pública de la ilustración de la zona (el mapa), o null si todavía no tiene. */
  urlIlustracion: string | null
}

/**
 * Todas las zonas en orden, para el selector (las no disponibles se muestran como "próximamente").
 * Si la base falla o tarda, salen de la última publicación (src/datos/respaldo.ts).
 */
export function obtenerZonas(): Promise<ResumenZona[]> {
  return conRespaldo(zonasDeLaBase, zonasDesdeInstantanea)
}

async function zonasDeLaBase(senal: AbortSignal): Promise<ResumenZona[]> {
  const { data, error } = await supabase
    .from('zonas')
    .select(
      `slug, orden, disponible,
       puntos(count),
       ilustracion:medios!zonas_ilustracion_id_fkey(ruta, texto_alternativo)`,
    )
    .order('orden', { ascending: true })
    .abortSignal(senal)

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

/** Una zona con lo que necesitan la cámara y el mapa. Null si el slug no existe. Con respaldo. */
export function obtenerZona(slug: string): Promise<ZonaConContorno | null> {
  return conRespaldo(
    (senal) => zonaDeLaBase(slug, senal),
    (instantanea) => zonaDesdeInstantanea(instantanea, slug),
  )
}

async function zonaDeLaBase(slug: string, senal: AbortSignal): Promise<ZonaConContorno | null> {
  const { data, error } = await supabase
    .from('zonas')
    .select(
      `slug, usa_camara,
       contorno:medios!zonas_contorno_id_fkey(ruta),
       ilustracion:medios!zonas_ilustracion_id_fkey(ruta)`,
    )
    .eq('slug', slug)
    .abortSignal(senal)
    .maybeSingle()

  if (error) throw new Error(`No se pudo leer la zona "${slug}": ${error.message}`)
  if (!data) return null

  return {
    slug: data.slug,
    usa_camara: data.usa_camara,
    urlContorno: data.contorno ? urlPublica(data.contorno.ruta) : null,
    urlIlustracion: data.ilustracion ? urlPublica(data.ilustracion.ruta) : null,
  }
}
