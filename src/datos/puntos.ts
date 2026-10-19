import { supabase } from '@/lib/supabase'
import type { Enums, Tables } from '@/lib/tipos-db'

type Idioma = Enums<'idioma'>

/** Si un punto no tiene ficha en el idioma pedido, se muestra la de español. */
const IDIOMA_RESPALDO: Idioma = 'es'

export type FichaVisitante = Pick<
  Tables<'fichas'>,
  'idioma' | 'titulo' | 'que_ves' | 'historia' | 'dato_santi' | 'transcripcion' | 'audio_id'
>

export type PuntoConFicha = Pick<
  Tables<'puntos'>,
  'id' | 'slug' | 'orden' | 'es_esencial' | 'pos_x' | 'pos_y' | 'tiene_3d'
> & {
  /** Ficha aprobada en el idioma pedido, o en español si no existe. Null si no hay ninguna. */
  ficha: FichaVisitante | null
}

/** Elige la ficha en el idioma pedido y, si no existe, la de español. */
export function elegirFicha(fichas: FichaVisitante[], idioma: Idioma): FichaVisitante | null {
  return (
    fichas.find((f) => f.idioma === idioma) ??
    fichas.find((f) => f.idioma === IDIOMA_RESPALDO) ??
    null
  )
}

/**
 * Puntos de una zona ordenados por `orden`, cada uno con su ficha aprobada en `idioma`
 * (con respaldo a español).
 */
export async function obtenerPuntosDeZona(
  slugZona: string,
  idioma: Idioma,
): Promise<PuntoConFicha[]> {
  const idiomas = idioma === IDIOMA_RESPALDO ? [idioma] : [idioma, IDIOMA_RESPALDO]

  const { data, error } = await supabase
    .from('puntos')
    .select(
      `id, slug, orden, es_esencial, pos_x, pos_y, tiene_3d,
       zonas!inner(slug),
       fichas(idioma, titulo, que_ves, historia, dato_santi, transcripcion, audio_id)`,
    )
    .eq('zonas.slug', slugZona)
    .eq('fichas.estado', 'aprobado')
    .in('fichas.idioma', idiomas)
    .order('orden', { ascending: true })

  if (error) throw new Error(`No se pudieron leer los puntos de "${slugZona}": ${error.message}`)

  return data.map((punto) => ({
    id: punto.id,
    slug: punto.slug,
    orden: punto.orden,
    es_esencial: punto.es_esencial,
    pos_x: punto.pos_x,
    pos_y: punto.pos_y,
    tiene_3d: punto.tiene_3d,
    ficha: elegirFicha(punto.fichas, idioma),
  }))
}
