// Vista y punto seleccionado del mapa durante la sesión, por zona, para encontrarlos igual al volver
// de otra pantalla. Solo en memoria: al recargar el mapa arranca en la vista inicial. Lo que sí se
// guarda en el teléfono es el progreso (ver `progreso.ts`).

import type { Lienzo, Vista } from '@/visitante/gestos'

/** Punto seleccionado. Seleccionarlo no lo completa: el progreso va aparte. */
export type Seleccion = { slug: string; x: number; y: number }

type SesionMapa = {
  vista: { valor: Vista; lienzo: Lienzo } | null
  seleccion: Seleccion | null
}

const sesiones = new Map<string, SesionMapa>()

export function leerSesionMapa(zona: string): SesionMapa {
  return sesiones.get(zona) ?? { vista: null, seleccion: null }
}

export function recordarVista(zona: string, valor: Vista, lienzo: Lienzo): void {
  sesiones.set(zona, { ...leerSesionMapa(zona), vista: { valor, lienzo } })
}

export function recordarSeleccion(zona: string, seleccion: Seleccion): void {
  sesiones.set(zona, { ...leerSesionMapa(zona), seleccion })
}

/** El punto abierto en la confirmación o la ficha pasa a ser el seleccionado al volver al mapa. */
export function recordarPuntoAbierto(
  zona: string,
  punto: { slug: string; pos_x: number | null; pos_y: number | null },
): void {
  if (punto.pos_x === null || punto.pos_y === null) return
  recordarSeleccion(zona, { slug: punto.slug, x: punto.pos_x, y: punto.pos_y })
}
