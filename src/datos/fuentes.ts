// Fuentes de un punto en el gestor. Una fuente (libro, archivo, entrevista, sitio web) se reutiliza
// entre puntos; lo que es propio de cada punto es el vínculo, con su nivel de confianza y una nota.

import { supabase } from '@/lib/supabase'
import type { Enums } from '@/lib/tipos-db'

export type NivelConfianza = Enums<'nivel_confianza'>

/** Tipos de fuente que admite la base (check de la tabla fuentes). */
export const TIPOS_FUENTE = ['archivo', 'libro', 'entrevista', 'sitio_web'] as const
export type TipoFuente = (typeof TIPOS_FUENTE)[number]

export const NIVELES_CONFIANZA = [
  'documentado',
  'probable',
  'especulativo',
] as const satisfies readonly NivelConfianza[]

export type DatosFuente = { cita: string; tipo: TipoFuente; url: string }
export type Fuente = DatosFuente & { id: string }

/** Una fuente vinculada a un punto. */
export type FuentePunto = { fuente: Fuente; nivel: NivelConfianza; nota: string }

type FilaFuente = { id: string; cita: string; tipo: string; url: string | null }

export function esTipoFuente(tipo: string): tipo is TipoFuente {
  return (TIPOS_FUENTE as readonly string[]).includes(tipo)
}

function fuente(fila: FilaFuente): Fuente {
  return {
    id: fila.id,
    cita: fila.cita,
    tipo: esTipoFuente(fila.tipo) ? fila.tipo : 'archivo',
    url: fila.url ?? '',
  }
}

/** Columnas de la tabla fuentes; un enlace vacío se guarda como null. */
export function columnasFuente(datos: DatosFuente) {
  return { cita: datos.cita.trim(), tipo: datos.tipo, url: datos.url.trim() || null }
}

const COLUMNAS_FUENTE = 'id, cita, tipo, url'

/** Fuentes vinculadas al punto, ordenadas por cita. */
export async function listarFuentesPunto(idPunto: string): Promise<FuentePunto[]> {
  const { data, error } = await supabase
    .from('punto_fuentes')
    .select(`nivel_confianza, nota, fuentes!inner(${COLUMNAS_FUENTE})`)
    .eq('punto_id', idPunto)

  if (error) throw new Error(`No se pudieron leer las fuentes del punto: ${error.message}`)
  return data
    .map((fila) => ({
      fuente: fuente(fila.fuentes),
      nivel: fila.nivel_confianza,
      nota: fila.nota ?? '',
    }))
    .sort((a, b) => a.fuente.cita.localeCompare(b.fuente.cita, 'es'))
}

/** Todas las fuentes registradas, para reutilizarlas en otro punto. */
export async function listarFuentes(): Promise<Fuente[]> {
  const { data, error } = await supabase.from('fuentes').select(COLUMNAS_FUENTE).order('cita')
  if (error) throw new Error(`No se pudieron leer las fuentes: ${error.message}`)
  return data.map(fuente)
}

/** Registra una fuente nueva. */
export async function crearFuente(datos: DatosFuente): Promise<Fuente> {
  if (!datos.cita.trim()) throw new Error('La fuente necesita una cita.')
  const { data, error } = await supabase
    .from('fuentes')
    .insert(columnasFuente(datos))
    .select(COLUMNAS_FUENTE)
    .single()
  if (error) throw new Error(`No se pudo crear la fuente: ${error.message}`)
  return fuente(data)
}

/** Corrige los datos de una fuente. Cambia en todos los puntos que la usan. */
export async function actualizarFuente(id: string, datos: DatosFuente): Promise<Fuente> {
  if (!datos.cita.trim()) throw new Error('La fuente necesita una cita.')
  const { data, error } = await supabase
    .from('fuentes')
    .update(columnasFuente(datos))
    .eq('id', id)
    .select(COLUMNAS_FUENTE)
    .single()
  if (error) throw new Error(`No se pudo guardar la fuente: ${error.message}`)
  return fuente(data)
}

/** Vincula una fuente al punto con su nivel de confianza. */
export async function vincularFuente(
  idPunto: string,
  idFuente: string,
  nivel: NivelConfianza,
  nota: string,
): Promise<void> {
  const { error } = await supabase.from('punto_fuentes').insert({
    punto_id: idPunto,
    fuente_id: idFuente,
    nivel_confianza: nivel,
    nota: nota.trim() || null,
  })
  if (error) throw new Error(`No se pudo vincular la fuente: ${error.message}`)
}

/** Cambia el nivel de confianza o la nota de una fuente en este punto. */
export async function actualizarVinculo(
  idPunto: string,
  idFuente: string,
  nivel: NivelConfianza,
  nota: string,
): Promise<void> {
  const { error } = await supabase
    .from('punto_fuentes')
    .update({ nivel_confianza: nivel, nota: nota.trim() || null })
    .eq('punto_id', idPunto)
    .eq('fuente_id', idFuente)
  if (error) throw new Error(`No se pudo guardar el nivel de confianza: ${error.message}`)
}

/** Quita la fuente de este punto. La fuente sigue registrada para otros puntos. */
export async function desvincularFuente(idPunto: string, idFuente: string): Promise<void> {
  const { error } = await supabase
    .from('punto_fuentes')
    .delete()
    .eq('punto_id', idPunto)
    .eq('fuente_id', idFuente)
  if (error) throw new Error(`No se pudo quitar la fuente: ${error.message}`)
}
