// Ubicación y clasificación de los puntos en el gestor: dónde está cada uno sobre la ilustración
// (pos_x y pos_y, de 0 a 1) y si es esencial u opcional. No toca el orden ni ningún otro campo.
// Las reglas de acceso (RLS) dejan editar puntos al editor, al revisor y al admin.

import { supabase } from '@/lib/supabase'
import type { PuntoGestor } from '@/datos/gestor'

/** Lo que el editor de ubicaciones puede cambiar de un punto. */
export type UbicacionPunto = Pick<PuntoGestor, 'pos_x' | 'pos_y' | 'es_esencial'>

/** Cambio parcial: solo se escriben los campos presentes. */
export type CambioUbicacion = Partial<UbicacionPunto>

/** La base guarda las posiciones con 5 decimales (numeric(6,5)). */
const DECIMALES = 1e5

const redondear = (n: number) => Math.round(n * DECIMALES) / DECIMALES

function validarCoordenada(nombre: 'pos_x' | 'pos_y', valor: number | null): number | null {
  if (valor === null) return null
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor < 0 || valor > 1) {
    throw new Error(`${nombre} debe ser un número entre 0 y 1, o null.`)
  }
  return redondear(valor)
}

/**
 * Valida un cambio y devuelve lo que se escribe en la base, o lanza un `Error` en español.
 * - `pos_x` y `pos_y`: números finitos de 0 a 1 (el 0 y el 1 valen) o `null` para quitar la
 *   ubicación; siempre juntos, porque el mapa solo muestra puntos con las dos.
 * - `es_esencial`: booleano.
 * - Un cambio sin campos no es válido.
 */
export function validarCambioUbicacion(cambio: CambioUbicacion): CambioUbicacion {
  const limpio: CambioUbicacion = {}

  const traePosX = cambio.pos_x !== undefined
  const traePosY = cambio.pos_y !== undefined
  if (traePosX !== traePosY) {
    throw new Error('La posición se guarda con pos_x y pos_y juntas.')
  }
  if (traePosX && traePosY) {
    limpio.pos_x = validarCoordenada('pos_x', cambio.pos_x ?? null)
    limpio.pos_y = validarCoordenada('pos_y', cambio.pos_y ?? null)
    // Una posición a medias dejaría el punto invisible en el mapa del visitante.
    if ((limpio.pos_x === null) !== (limpio.pos_y === null)) {
      throw new Error('pos_x y pos_y deben ser ambas números o ambas null.')
    }
  }

  if (cambio.es_esencial !== undefined) {
    if (typeof cambio.es_esencial !== 'boolean') {
      throw new Error('es_esencial debe ser verdadero o falso.')
    }
    limpio.es_esencial = cambio.es_esencial
  }

  if (Object.keys(limpio).length === 0) throw new Error('No hay cambios que guardar.')
  return limpio
}

/**
 * Guarda la ubicación y/o clasificación de un punto. Solo escribe los campos del `cambio` (nunca
 * el orden ni otros) y devuelve el valor que quedó en la base. Lanza un `Error` si el cambio no es
 * válido, si la base falla o si el punto no existe o las reglas de acceso no dejan editarlo.
 */
export async function guardarUbicacionPunto(
  idPunto: string,
  cambio: CambioUbicacion,
): Promise<UbicacionPunto> {
  const campos = validarCambioUbicacion(cambio)

  const { data, error } = await supabase
    .from('puntos')
    .update(campos)
    .eq('id', idPunto)
    .select('pos_x, pos_y, es_esencial')
    .maybeSingle()

  if (error) throw new Error(`No se pudo guardar la ubicación del punto: ${error.message}`)
  // Sin permiso, la base no da error: simplemente no actualiza ninguna fila.
  if (!data) throw new Error('No se encontró el punto o no tienes permiso para editarlo.')
  return { pos_x: data.pos_x, pos_y: data.pos_y, es_esencial: data.es_esencial }
}

/**
 * Qué campos de `nueva` difieren de `original` (comparando las posiciones al redondeo de la base).
 * Devuelve un objeto vacío si no cambió nada.
 */
export function diferenciaUbicacion(
  original: UbicacionPunto,
  nueva: UbicacionPunto,
): CambioUbicacion {
  const cambio: CambioUbicacion = {}
  const mismaCoordenada = (a: number | null, b: number | null) =>
    a === null || b === null ? a === b : Math.abs(redondear(a) - redondear(b)) < 1 / DECIMALES / 2
  if (
    !mismaCoordenada(original.pos_x, nueva.pos_x) ||
    !mismaCoordenada(original.pos_y, nueva.pos_y)
  ) {
    cambio.pos_x = nueva.pos_x
    cambio.pos_y = nueva.pos_y
  }
  if (original.es_esencial !== nueva.es_esencial) cambio.es_esencial = nueva.es_esencial
  return cambio
}

/** Un punto editado: lo que se leyó de la base y lo que quedó en el editor. */
export type PuntoEditado = { id: string; original: UbicacionPunto; nueva: UbicacionPunto }

export type ResultadoGuardado = {
  /** Puntos que se guardaron, con el valor que quedó en la base. */
  guardados: { id: string; ubicacion: UbicacionPunto }[]
  /** Puntos que no se guardaron, con el motivo. El resto del lote no se revierte. */
  fallidos: { id: string; mensaje: string }[]
  /** Puntos sin diferencias: no se mandó nada a la base. */
  sinCambios: string[]
}

/**
 * Guarda los puntos editados, uno por uno. NO es atómico: cada punto es una operación aparte, así
 * que unos pueden guardarse y otros fallar; el resultado dice cuáles. Los puntos sin diferencias
 * no se mandan, y de los demás solo se escriben los campos que cambiaron. Nunca lanza por un punto:
 * los errores quedan en `fallidos`.
 */
export async function guardarUbicaciones(
  editados: readonly PuntoEditado[],
): Promise<ResultadoGuardado> {
  const resultado: ResultadoGuardado = { guardados: [], fallidos: [], sinCambios: [] }

  const pendientes = editados.flatMap((punto) => {
    const cambio = diferenciaUbicacion(punto.original, punto.nueva)
    if (Object.keys(cambio).length === 0) {
      resultado.sinCambios.push(punto.id)
      return []
    }
    return [{ id: punto.id, cambio }]
  })

  type Guardado = ResultadoGuardado['guardados'][number]
  type Fallido = ResultadoGuardado['fallidos'][number]

  const intentos = await Promise.all(
    pendientes.map(async ({ id, cambio }): Promise<Guardado | Fallido> => {
      try {
        return { id, ubicacion: await guardarUbicacionPunto(id, cambio) }
      } catch (e) {
        return { id, mensaje: e instanceof Error ? e.message : 'Error desconocido.' }
      }
    }),
  )

  for (const intento of intentos) {
    if ('ubicacion' in intento) resultado.guardados.push(intento)
    else resultado.fallidos.push(intento)
  }
  return resultado
}

/** Un punto nuevo que el editor ubicó y todavía no existe en la base. */
export type PuntoNuevo = {
  zonaId: string
  zonaSlug: string
  pos_x: number
  pos_y: number
  es_esencial: boolean
}

/** Identificador corto y legible para la URL del punto: zona y un sufijo al azar (único). */
export function slugNuevo(zonaSlug: string, azar: string = crypto.randomUUID()): string {
  return `${zonaSlug}-${azar.replace(/-/g, '').slice(0, 8)}`
}

/**
 * Crea un punto al final de la ruta de su zona, ya ubicado. Sin ficha: se escribe después en «Escribir
 * los puntos». Lanza un `Error` si la base lo rechaza (p. ej. sin permiso). Devuelve su id.
 */
export async function crearPunto(nuevo: PuntoNuevo): Promise<string> {
  const { pos_x, pos_y } = validarCambioUbicacion({ pos_x: nuevo.pos_x, pos_y: nuevo.pos_y })

  const { data: ultimo, error: errorOrden } = await supabase
    .from('puntos')
    .select('orden')
    .eq('zona_id', nuevo.zonaId)
    .order('orden', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (errorOrden) throw new Error(`No se pudo crear el punto: ${errorOrden.message}`)

  const { data, error } = await supabase
    .from('puntos')
    .insert({
      zona_id: nuevo.zonaId,
      slug: slugNuevo(nuevo.zonaSlug),
      orden: (ultimo?.orden ?? 0) + 1,
      pos_x: pos_x ?? null,
      pos_y: pos_y ?? null,
      es_esencial: nuevo.es_esencial,
    })
    .select('id')
    .single()

  if (error) throw new Error(`No se pudo crear el punto: ${error.message}`)
  return data.id
}
