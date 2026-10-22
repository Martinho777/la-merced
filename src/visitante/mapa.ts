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

/** Ruta de la pantalla de un punto (por ahora "En construcción"). */
export function rutaDePunto(slugZona: string, slugPunto: string): string {
  return `/punto?${new URLSearchParams({ zona: slugZona, punto: slugPunto }).toString()}`
}
