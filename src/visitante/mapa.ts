// Reglas del mapa de una zona (pantalla 7), aparte de la pantalla para poder probarlas sin DOM.

import type { PuntoConFicha } from '@/datos/puntos'
import type { Ruta } from '@/lib/preferencias'

export type EstadoPunto = 'esencial' | 'opcional' | 'visitado'

type PuntoDelMapa = Pick<PuntoConFicha, 'slug' | 'orden' | 'es_esencial' | 'pos_x' | 'pos_y'>

/** Puntos que cuentan para la ruta: la esencial solo los esenciales; la recomendada y la libre, todos. */
export function puntosDeRuta<T extends PuntoDelMapa>(puntos: readonly T[], ruta: Ruta): T[] {
  const enOrden = [...puntos].sort((a, b) => a.orden - b.orden)
  return ruta === 'esencial' ? enOrden.filter((p) => p.es_esencial) : enOrden
}

/** Solo se dibujan los puntos con posición sobre la ilustración. */
export function puntosConPosicion<T extends PuntoDelMapa>(
  puntos: readonly T[],
): (T & { pos_x: number; pos_y: number })[] {
  return puntos.filter(
    (p): p is T & { pos_x: number; pos_y: number } => p.pos_x !== null && p.pos_y !== null,
  )
}

export function estadoDePunto(punto: PuntoDelMapa, visitados: ReadonlySet<string>): EstadoPunto {
  if (visitados.has(punto.slug)) return 'visitado'
  return punto.es_esencial ? 'esencial' : 'opcional'
}

/** El siguiente punto de la ruta sin visitar. La ruta libre no tiene "siguiente". */
export function siguientePunto<T extends PuntoDelMapa>(
  puntos: readonly T[],
  ruta: Ruta,
  visitados: ReadonlySet<string>,
): T | null {
  if (ruta === 'libre') return null
  return puntosDeRuta(puntos, ruta).find((p) => !visitados.has(p.slug)) ?? null
}

export function progreso(
  puntos: readonly PuntoDelMapa[],
  ruta: Ruta,
  visitados: ReadonlySet<string>,
): { visitados: number; total: number } {
  const deRuta = puntosDeRuta(puntos, ruta)
  return { visitados: deRuta.filter((p) => visitados.has(p.slug)).length, total: deRuta.length }
}

// --- Navegación ---

/** Parámetro de búsqueda con el identificador del punto (`/punto?zona=…&punto=…`). */
export const PARAM_PUNTO = 'punto'

const consultaDePunto = (slugZona: string, slugPunto: string) =>
  new URLSearchParams({ zona: slugZona, [PARAM_PUNTO]: slugPunto }).toString()

/** Ruta de la ficha de un punto. */
export function rutaDePunto(slugZona: string, slugPunto: string): string {
  return `/punto?${consultaDePunto(slugZona, slugPunto)}`
}

/** Ruta de la confirmación de un punto ("¡Ese es!"), el paso entre el mapa y la ficha. */
export function rutaDeConfirmacion(slugZona: string, slugPunto: string): string {
  return `/confirmacion?${consultaDePunto(slugZona, slugPunto)}`
}

/**
 * Puntos anterior y siguiente en el orden de la ruta. Si el punto está fuera de la ruta (un opcional
 * tocado en la ruta esencial), se usa el orden de todos los puntos para que no quede sin salida.
 */
export function vecinosEnRuta<T extends PuntoDelMapa>(
  puntos: readonly T[],
  ruta: Ruta,
  slug: string,
): { anterior: T | null; siguiente: T | null } {
  const deRuta = puntosDeRuta(puntos, ruta)
  const lista = deRuta.some((p) => p.slug === slug) ? deRuta : puntosDeRuta(puntos, 'libre')
  const indice = lista.findIndex((p) => p.slug === slug)
  if (indice < 0) return { anterior: null, siguiente: null }
  return { anterior: lista[indice - 1] ?? null, siguiente: lista[indice + 1] ?? null }
}

/** Número del punto como lo muestra su identificador ("05" en "Detalle 05"). */
export function numeroDeDetalle(orden: number): string {
  return String(orden).padStart(2, '0')
}
