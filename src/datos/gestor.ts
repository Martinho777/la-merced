// Consultas del gestor de fichas. Las reglas de acceso (RLS) dejan al personal leer las fichas en
// cualquier estado; el visitante solo ve las aprobadas (eso lo maneja src/datos/puntos.ts).

import { supabase } from '@/lib/supabase'
import type { Enums } from '@/lib/tipos-db'

export type IdiomaFicha = Enums<'idioma'>
export type EstadoFicha = Enums<'estado_contenido'>

/**
 * Idiomas que el gestor deja editar. Kaqchikel se agrega aquí cuando llegue el material del equipo
 * de investigación (decisión del equipo, nov. 2026); la base ya lo admite.
 */
export const IDIOMAS_GESTOR = ['es', 'en'] as const satisfies readonly IdiomaFicha[]

export type ResumenFicha = { id: string; estado: EstadoFicha; titulo: string }

export type PuntoGestor = {
  id: string
  slug: string
  orden: number
  zona: { slug: string; orden: number }
  /** Ficha de cada idioma del gestor, o null si todavía no existe. */
  fichas: Record<(typeof IDIOMAS_GESTOR)[number], ResumenFicha | null>
}

type FilaFicha = { id: string; idioma: IdiomaFicha; estado: EstadoFicha; titulo: string }

/** Reparte las fichas de un punto por idioma (solo los idiomas del gestor). */
export function fichasPorIdioma(fichas: readonly FilaFicha[]): PuntoGestor['fichas'] {
  const resumen = (idioma: IdiomaFicha): ResumenFicha | null => {
    const ficha = fichas.find((f) => f.idioma === idioma)
    return ficha ? { id: ficha.id, estado: ficha.estado, titulo: ficha.titulo } : null
  }
  return { es: resumen('es'), en: resumen('en') }
}

/** Todos los puntos, ordenados por zona y por número, con el estado de sus fichas. */
export async function listarPuntosGestor(): Promise<PuntoGestor[]> {
  const { data, error } = await supabase
    .from('puntos')
    .select('id, slug, orden, zonas!inner(slug, orden), fichas(id, idioma, estado, titulo)')

  if (error) throw new Error(`No se pudieron leer los puntos: ${error.message}`)

  return data
    .map((punto) => ({
      id: punto.id,
      slug: punto.slug,
      orden: punto.orden,
      zona: { slug: punto.zonas.slug, orden: punto.zonas.orden },
      fichas: fichasPorIdioma(punto.fichas),
    }))
    .sort((a, b) => a.zona.orden - b.zona.orden || a.orden - b.orden)
}

export type CamposFicha = {
  titulo: string
  que_ves: string
  historia: string
  dato_santi: string
}

export type FichaGestor = CamposFicha & { id: string; estado: EstadoFicha }

export type DetallePunto = {
  id: string
  slug: string
  orden: number
  zona: string
  fichas: Record<(typeof IDIOMAS_GESTOR)[number], FichaGestor | null>
}

type FilaFichaCompleta = {
  id: string
  idioma: IdiomaFicha
  estado: EstadoFicha
  titulo: string
  que_ves: string | null
  historia: string | null
  dato_santi: string | null
}

function fichaGestor(fila: FilaFichaCompleta): FichaGestor {
  return {
    id: fila.id,
    estado: fila.estado,
    titulo: fila.titulo,
    que_ves: fila.que_ves ?? '',
    historia: fila.historia ?? '',
    dato_santi: fila.dato_santi ?? '',
  }
}

const COLUMNAS_FICHA = 'id, idioma, estado, titulo, que_ves, historia, dato_santi'

/** Un punto con sus fichas completas en los idiomas del gestor. Null si no existe. */
export async function obtenerPuntoGestor(idPunto: string): Promise<DetallePunto | null> {
  const { data, error } = await supabase
    .from('puntos')
    .select(`id, slug, orden, zonas!inner(slug), fichas(${COLUMNAS_FICHA})`)
    .eq('id', idPunto)
    .maybeSingle()

  if (error) throw new Error(`No se pudo leer el punto: ${error.message}`)
  if (!data) return null

  const deIdioma = (idioma: IdiomaFicha) => {
    const fila = data.fichas.find((f) => f.idioma === idioma)
    return fila ? fichaGestor(fila) : null
  }

  return {
    id: data.id,
    slug: data.slug,
    orden: data.orden,
    zona: data.zonas.slug,
    fichas: { es: deIdioma('es'), en: deIdioma('en') },
  }
}

/** Quita espacios sobrantes; un campo opcional vacío se guarda como null. */
export function limpiarCampos(campos: CamposFicha) {
  const opcional = (texto: string) => texto.trim() || null
  return {
    titulo: campos.titulo.trim(),
    que_ves: opcional(campos.que_ves),
    historia: opcional(campos.historia),
    dato_santi: opcional(campos.dato_santi),
  }
}

/**
 * Estado con que se guarda una ficha editada: una ficha publicada (aprobada) vuelve a revisión,
 * porque todo cambio a contenido publicado pasa otra vez por un revisor (regla del README).
 */
export function estadoAlGuardar(actual: EstadoFicha): EstadoFicha {
  return actual === 'aprobado' ? 'revision' : actual
}

/** Crea la ficha del idioma (en borrador) o guarda los cambios de la que ya existe. */
export async function guardarFicha(
  idPunto: string,
  idioma: IdiomaFicha,
  campos: CamposFicha,
  existente: FichaGestor | null,
): Promise<FichaGestor> {
  const limpios = limpiarCampos(campos)
  if (!limpios.titulo) throw new Error('La ficha necesita un nombre.')

  const consulta = existente
    ? supabase
        .from('fichas')
        .update({ ...limpios, estado: estadoAlGuardar(existente.estado) })
        .eq('id', existente.id)
    : supabase.from('fichas').insert({ ...limpios, punto_id: idPunto, idioma, estado: 'borrador' })

  const { data, error } = await consulta.select(COLUMNAS_FICHA).single()
  if (error) throw new Error(`No se pudo guardar la ficha: ${error.message}`)
  return fichaGestor(data)
}
