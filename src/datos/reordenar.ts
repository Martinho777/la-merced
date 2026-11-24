// Reordenar los puntos de una zona (S4B3.4). El cambio lo hace de forma atómica la función de la base
// `reordenar_puntos` (supabase/migrations/20261123000001_reordenar_puntos.sql): o se reasignan todos los
// puntos de la zona o ninguno. Aquí se valida la lista antes de llamarla, para dar un mensaje claro sin
// ir a la red, y se evita llamarla cuando el orden no cambió.

import { supabase } from '@/lib/supabase'

export type PuntoOrdenado = { id: string; orden: number }

export type ResultadoReordenamiento = {
  /** False si la lista nueva era igual a la actual: no se llamó a la base. */
  cambio: boolean
  /** Los puntos de la zona con el orden que quedó en la base (vacío si no hubo cambio). */
  puntos: PuntoOrdenado[]
}

/**
 * Comprueba que `idsNuevos` sea exactamente el conjunto de puntos de la zona (`idsActuales`), cada uno
 * una vez, sin vacíos. Lanza un `Error` en español si no. La base repite esta comprobación: esta es
 * solo la primera barrera.
 */
export function validarReordenamiento(
  idsActuales: readonly string[],
  idsNuevos: readonly string[],
): void {
  if (idsNuevos.length === 0) throw new Error('La lista de puntos está vacía.')
  if (idsNuevos.some((id) => !id)) throw new Error('La lista de puntos contiene valores vacíos.')
  if (new Set(idsNuevos).size !== idsNuevos.length) {
    throw new Error('La lista de puntos repite algún punto.')
  }
  const actuales = new Set(idsActuales)
  const nuevos = new Set(idsNuevos)
  const sobran = idsNuevos.filter((id) => !actuales.has(id)).length
  if (sobran > 0) {
    throw new Error(`La lista incluye ${sobran} punto(s) que no pertenecen a la zona.`)
  }
  const faltan = idsActuales.filter((id) => !nuevos.has(id)).length
  if (faltan > 0) throw new Error(`La lista no incluye ${faltan} punto(s) de la zona.`)
}

type RespuestaRpc = { data: unknown; error: { message: string } | null }

// `tipos-db.ts` todavía no conoce `reordenar_puntos`: se genera con `npm run db:types` después de
// aplicar la migración. Cuando la conozca, este envoltorio se cambia por `supabase.rpc(...)` tipado.
const llamarRpc = (nombre: string, argumentos: Record<string, unknown>) =>
  (
    supabase as unknown as {
      rpc: (nombre: string, argumentos: Record<string, unknown>) => PromiseLike<RespuestaRpc>
    }
  ).rpc(nombre, argumentos)

function leerPuntos(datos: unknown): PuntoOrdenado[] {
  if (!Array.isArray(datos)) throw new Error('La base respondió algo inesperado al reordenar.')
  return datos.map((fila: unknown) => {
    const { punto_id, nuevo_orden } = (fila ?? {}) as Record<string, unknown>
    if (typeof punto_id !== 'string' || typeof nuevo_orden !== 'number') {
      throw new Error('La base respondió algo inesperado al reordenar.')
    }
    return { id: punto_id, orden: nuevo_orden }
  })
}

/**
 * Reordena los puntos de una zona. `idsNuevos` es la lista completa en el orden nuevo y `ordenActual`
 * los puntos de la zona como están ahora, en su orden actual: sirve para validar y para saber si hay
 * algo que guardar. Atómico: si lanza, no cambió ningún punto.
 */
export async function reordenarPuntos(
  idZona: string,
  idsNuevos: readonly string[],
  ordenActual: readonly string[],
): Promise<ResultadoReordenamiento> {
  validarReordenamiento(ordenActual, idsNuevos)

  // Mismo orden que ya tiene la zona: nada que escribir.
  if (idsNuevos.every((id, i) => id === ordenActual[i])) return { cambio: false, puntos: [] }

  const { data, error } = await llamarRpc('reordenar_puntos', {
    p_zona_id: idZona,
    p_ids: [...idsNuevos],
  })
  if (error) throw new Error(`No se pudieron reordenar los puntos: ${error.message}`)
  return { cambio: true, puntos: leerPuntos(data) }
}
