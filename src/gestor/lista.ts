import type { TonoInsignia } from '@/componentes/Insignia'
import type { EstadoFicha, PuntoGestor } from '@/datos/gestor'

/** Tono de la insignia de cada estado de ficha (Badge de docs/diseno/componentes.md). */
export const TONO_ESTADO: Record<EstadoFicha | 'falta', TonoInsignia> = {
  falta: 'neutral',
  borrador: 'info',
  revision: 'advertencia',
  aprobado: 'exito',
}

/** Agrupa los puntos por zona, respetando el orden en que llegan. */
export function agruparPorZona(puntos: readonly PuntoGestor[]): [string, PuntoGestor[]][] {
  const grupos = new Map<string, PuntoGestor[]>()
  for (const punto of puntos) {
    grupos.set(punto.zona.slug, [...(grupos.get(punto.zona.slug) ?? []), punto])
  }
  return [...grupos.entries()]
}
