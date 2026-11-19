// Lógica del editor de ubicaciones, aparte de la pantalla para probarla sin DOM: el borrador local de
// posiciones y clasificación, qué cambió, qué hacer con el resultado del guardado y cómo pasar de la
// posición del puntero a una posición sobre la ilustración.

import { ilustracionLocalDeZona } from '@/assets/zonas'
import type { PuntoGestor } from '@/datos/gestor'
import {
  diferenciaUbicacion,
  type PuntoEditado,
  type ResultadoGuardado,
  type UbicacionPunto,
} from '@/datos/ubicaciones'
import { punteroAEscena, type Vista } from '@/visitante/gestos'

/** Lo que el editor tiene ahora de cada punto (por id): lo guardado más los cambios sin guardar. */
export type Borrador = Readonly<Record<string, UbicacionPunto>>

export const ubicacionDe = (punto: PuntoGestor): UbicacionPunto => ({
  pos_x: punto.pos_x,
  pos_y: punto.pos_y,
  es_esencial: punto.es_esencial,
})

/** Borrador igual a lo guardado en la base. También es "descartar cambios". */
export function crearBorrador(puntos: readonly PuntoGestor[]): Borrador {
  return Object.fromEntries(puntos.map((punto) => [punto.id, ubicacionDe(punto)]))
}

const entre0y1 = (n: number) => Math.min(1, Math.max(0, n))

/** Pone un punto en (x, y), limitado a la ilustración. Con valores no finitos o un id desconocido, no cambia. */
export function colocarPunto(borrador: Borrador, id: string, x: number, y: number): Borrador {
  const actual = borrador[id]
  if (!actual || !Number.isFinite(x) || !Number.isFinite(y)) return borrador
  return { ...borrador, [id]: { ...actual, pos_x: entre0y1(x), pos_y: entre0y1(y) } }
}

/** Mueve un punto ya ubicado por (dx, dy), sin salirse de la ilustración. Un punto sin ubicar no se mueve. */
export function desplazarPunto(borrador: Borrador, id: string, dx: number, dy: number): Borrador {
  const actual = borrador[id]
  if (!actual || actual.pos_x === null || actual.pos_y === null) return borrador
  return colocarPunto(borrador, id, actual.pos_x + dx, actual.pos_y + dy)
}

export function clasificarPunto(borrador: Borrador, id: string, esEsencial: boolean): Borrador {
  const actual = borrador[id]
  if (!actual) return borrador
  return { ...borrador, [id]: { ...actual, es_esencial: esEsencial } }
}

/** Ids de los puntos cuyo borrador difiere de lo guardado. */
export function puntosPendientes(puntos: readonly PuntoGestor[], borrador: Borrador): string[] {
  return puntos
    .filter((punto) => {
      const editado = borrador[punto.id]
      return (
        editado !== undefined &&
        Object.keys(diferenciaUbicacion(ubicacionDe(punto), editado)).length > 0
      )
    })
    .map((punto) => punto.id)
}

/** Lo que se manda a guardar: solo los puntos con cambios pendientes. */
export function editadosParaGuardar(
  puntos: readonly PuntoGestor[],
  borrador: Borrador,
): PuntoEditado[] {
  const pendientes = new Set(puntosPendientes(puntos, borrador))
  return puntos
    .filter((punto) => pendientes.has(punto.id))
    .flatMap((punto) => {
      const nueva = borrador[punto.id]
      return nueva ? [{ id: punto.id, original: ubicacionDe(punto), nueva }] : []
    })
}

/**
 * Tras guardar: los puntos guardados pasan a ser lo "confirmado" (con el valor que dejó la base) y su
 * borrador se alinea con él. Los que fallaron conservan su borrador, y siguen pendientes.
 */
export function aplicarResultado(
  puntos: readonly PuntoGestor[],
  borrador: Borrador,
  resultado: ResultadoGuardado,
): { puntos: PuntoGestor[]; borrador: Borrador } {
  const guardados = new Map(resultado.guardados.map((g) => [g.id, g.ubicacion]))
  return {
    puntos: puntos.map((punto) => {
      const ubicacion = guardados.get(punto.id)
      return ubicacion ? { ...punto, ...ubicacion } : punto
    }),
    borrador: { ...borrador, ...Object.fromEntries(guardados) },
  }
}

export type TipoResultado = 'exito' | 'parcial' | 'error' | 'sinCambios'

/** Cómo contarle el resultado al usuario. */
export function tipoDeResultado(resultado: ResultadoGuardado): TipoResultado {
  const { guardados, fallidos } = resultado
  if (fallidos.length === 0) return guardados.length > 0 ? 'exito' : 'sinCambios'
  return guardados.length > 0 ? 'parcial' : 'error'
}

// --- Zonas ---

/** Zonas que tienen puntos, en el orden en que llegan (los puntos vienen ordenados por zona). */
export function zonasDe(puntos: readonly PuntoGestor[]): string[] {
  return [...new Set(puntos.map((punto) => punto.zona.slug))]
}

export function puntosDeZona(puntos: readonly PuntoGestor[], zona: string | null): PuntoGestor[] {
  return puntos.filter((punto) => punto.zona.slug === zona)
}

/** La zona preferida si existe; si no, la primera. Null si no hay zonas. */
export function zonaElegida(zonas: readonly string[], preferida: string | null): string | null {
  return preferida !== null && zonas.includes(preferida) ? preferida : (zonas[0] ?? null)
}

/**
 * Ilustración de una zona: la de la base si tiene, y si no la local. Es la misma regla de
 * `PantallaMapa` (el mapa del visitante).
 */
export function ilustracionDeZona(
  urlDeLaBase: string | null | undefined,
  slug: string,
): { src: string; srcSet: string | undefined } | null {
  return urlDeLaBase ? { src: urlDeLaBase, srcSet: undefined } : ilustracionLocalDeZona(slug)
}

// --- Puntero ---

/** El editor muestra la ilustración entera: escala 1 y sin desplazamiento. */
export const VISTA_COMPLETA: Vista = { escala: 1, x: 0, y: 0 }

/**
 * Posición (0 a 1) sobre la ilustración de un punto del puntero, dado el rectángulo de la ilustración
 * en pantalla (`getBoundingClientRect`) y la posición del puntero (`clientX`, `clientY`). Fuera de la
 * ilustración se limita al borde. Null si el rectángulo no tiene tamaño.
 */
export function posicionDelPuntero(
  caja: { left: number; top: number; width: number; height: number },
  cliente: { x: number; y: number },
): { x: number; y: number } | null {
  return punteroAEscena(
    VISTA_COMPLETA,
    { ancho: caja.width, alto: caja.height },
    { x: cliente.x - caja.left, y: cliente.y - caja.top },
  )
}
