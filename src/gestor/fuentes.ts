import type { TonoInsignia } from '@/componentes/Insignia'
import type { DatosFuente, Fuente, FuentePunto, NivelConfianza } from '@/datos/fuentes'

export const FUENTE_VACIA: DatosFuente = { cita: '', tipo: 'archivo', url: '' }

/** Tono de la insignia de cada nivel de confianza. */
export const TONO_NIVEL: Record<NivelConfianza, TonoInsignia> = {
  documentado: 'exito',
  probable: 'info',
  especulativo: 'advertencia',
}

/** Fuentes registradas que todavía no están vinculadas al punto. */
export function fuentesDisponibles(
  todas: readonly Fuente[],
  vinculadas: readonly FuentePunto[],
): Fuente[] {
  const usadas = new Set(vinculadas.map((v) => v.fuente.id))
  return todas.filter((f) => !usadas.has(f.id))
}
