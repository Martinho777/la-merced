import { urlPublica } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import type { Enums, Json, Tables } from '@/lib/tipos-db'

type Idioma = Enums<'idioma'>

/** Si un punto no tiene ficha en el idioma pedido, se muestra la de español. */
const IDIOMA_RESPALDO: Idioma = 'es'

export type FichaVisitante = Pick<
  Tables<'fichas'>,
  'idioma' | 'titulo' | 'que_ves' | 'historia' | 'dato_santi' | 'transcripcion' | 'audio_id'
>

/** Una imagen lista para mostrar; `url` null deja el espacio reservado y vacío. */
export type ImagenPunto = { url: string | null; textoAlternativo: string }

/** Registro del archivo histórico de un punto. */
export type RegistroArchivo = ImagenPunto & {
  id: string
  fecha: string | null
  credito: string | null
}

export type PuntoConFicha = Pick<
  Tables<'puntos'>,
  'id' | 'slug' | 'orden' | 'es_esencial' | 'pos_x' | 'pos_y' | 'tiene_3d'
> & {
  /** Ficha aprobada en el idioma pedido, o en español si no existe. Null si no hay ninguna. */
  ficha: FichaVisitante | null
  /** Foto real del punto, o null si todavía no hay. */
  foto: ImagenPunto | null
  /** Narración de la ficha, o null si todavía no hay. La duración puede no conocerse de antemano. */
  audio: { url: string; duracionS: number | null } | null
  archivo: RegistroArchivo[]
}

type MedioDePunto = Pick<
  Tables<'medios'>,
  | 'id'
  | 'tipo'
  | 'ruta'
  | 'orden'
  | 'credito'
  | 'fecha_original'
  | 'duracion_s'
  | 'texto_alternativo'
>

function textoEnIdioma(textos: Json, idioma: Idioma): string {
  if (typeof textos !== 'object' || textos === null || Array.isArray(textos)) return ''
  const texto = textos[idioma] ?? textos[IDIOMA_RESPALDO]
  return typeof texto === 'string' ? texto : ''
}

/**
 * Reparte los medios de un punto entre foto, narración y archivo. El audio es solo el que indica la
 * ficha (cada ficha tiene el suyo por idioma); `aUrl` convierte la ruta del bucket en una URL.
 */
export function mediosDePunto(
  medios: readonly MedioDePunto[],
  ficha: FichaVisitante | null,
  idioma: Idioma,
  aUrl: (ruta: string) => string,
): Pick<PuntoConFicha, 'foto' | 'audio' | 'archivo'> {
  const enOrden = [...medios].sort((a, b) => a.orden - b.orden)
  const imagen = (medio: MedioDePunto): ImagenPunto => ({
    url: aUrl(medio.ruta),
    textoAlternativo: textoEnIdioma(medio.texto_alternativo, idioma),
  })
  const foto = enOrden.find((m) => m.tipo === 'foto')
  const audio = ficha?.audio_id
    ? enOrden.find((m) => m.tipo === 'audio' && m.id === ficha.audio_id)
    : undefined

  return {
    foto: foto ? imagen(foto) : null,
    audio: audio ? { url: aUrl(audio.ruta), duracionS: audio.duracion_s } : null,
    archivo: enOrden
      .filter((m) => m.tipo === 'foto_historica')
      .map((m) => ({ ...imagen(m), id: m.id, fecha: m.fecha_original, credito: m.credito })),
  }
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
       fichas(idioma, titulo, que_ves, historia, dato_santi, transcripcion, audio_id),
       medios!medios_punto_id_fkey(id, tipo, ruta, orden, credito, fecha_original, duracion_s, texto_alternativo)`,
    )
    .eq('zonas.slug', slugZona)
    .eq('fichas.estado', 'aprobado')
    .in('fichas.idioma', idiomas)
    .order('orden', { ascending: true })

  if (error) throw new Error(`No se pudieron leer los puntos de "${slugZona}": ${error.message}`)

  return data.map((punto) => {
    const ficha = elegirFicha(punto.fichas, idioma)
    return {
      id: punto.id,
      slug: punto.slug,
      orden: punto.orden,
      es_esencial: punto.es_esencial,
      pos_x: punto.pos_x,
      pos_y: punto.pos_y,
      tiene_3d: punto.tiene_3d,
      ficha,
      ...mediosDePunto(punto.medios, ficha, idioma, urlPublica),
    }
  })
}
