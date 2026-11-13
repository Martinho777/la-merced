import type { DatosFuente, Fuente, FuentePunto } from '@/datos/fuentes'

export const FUENTE_VACIA: DatosFuente = { cita: '', tipo: 'archivo', url: '' }

/** Fuentes registradas que todavía no están vinculadas al punto. */
export function fuentesDisponibles(
  todas: readonly Fuente[],
  vinculadas: readonly FuentePunto[],
): Fuente[] {
  const usadas = new Set(vinculadas.map((v) => v.fuente.id))
  return todas.filter((f) => !usadas.has(f.id))
}
