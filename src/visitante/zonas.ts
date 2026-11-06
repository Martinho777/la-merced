// Reglas del selector de zonas, aparte de la pantalla para poder probarlas.

import type { ResumenZona } from '@/datos/zonas'

type ZonaElegible = Pick<ResumenZona, 'slug' | 'disponible'>

/** Zona elegida al abrir la pantalla: la primera disponible, o null si no hay ninguna. */
export function zonaInicial(zonas: readonly ZonaElegible[]): string | null {
  return zonas.find((zona) => zona.disponible)?.slug ?? null
}

/** Solo se puede elegir una zona que existe y está disponible. */
export function puedeElegirse(zonas: readonly ZonaElegible[], slug: string): boolean {
  return zonas.some((zona) => zona.slug === slug && zona.disponible)
}
