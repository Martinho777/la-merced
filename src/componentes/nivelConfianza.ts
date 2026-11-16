// Niveles de confianza de una fuente (documentado, probable, especulativo): el tono de su insignia y
// el orden en que se muestran. Lo comparten la ficha del visitante y el gestor.

import type { TonoInsignia } from '@/componentes/Insignia'
import type { Enums } from '@/lib/tipos-db'

export type NivelConfianza = Enums<'nivel_confianza'>

/** Tono de la insignia de cada nivel de confianza. */
export const TONO_NIVEL: Record<NivelConfianza, TonoInsignia> = {
  documentado: 'exito',
  probable: 'info',
  especulativo: 'advertencia',
}

/** De más a menos confianza. */
export const ORDEN_NIVEL: readonly NivelConfianza[] = ['documentado', 'probable', 'especulativo']
