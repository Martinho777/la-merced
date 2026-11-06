// Lo que necesitan el mapa, la confirmación y la ficha de una zona: la zona y sus puntos, con los de
// demostración mientras falten puntos reales. Se guarda durante la sesión para que pasar de una
// pantalla a otra no repita las consultas ni parpadee.

import { PUNTOS_DEMO } from '@/datos/puntos-demo'
import { obtenerPuntosDeZona, type PuntoConFicha } from '@/datos/puntos'
import { obtenerZona, type ZonaConContorno } from '@/datos/zonas'
import type { Idioma } from '@/lib/preferencias'

/** Con menos puntos reales que estos se completa con la demostración (el alcance pide 10 a 12). */
export const MINIMO_PUNTOS_REALES = 10

export type Recorrido = {
  zona: ZonaConContorno
  puntos: PuntoConFicha[]
}

/**
 * Los puntos reales mandan. Si no alcanzan el mínimo, se agregan los de demostración cuyo `orden` no
 * esté ocupado por un punto real. La cantidad sale de los datos: nada depende de que sean 12.
 */
export function completarConDemo<T extends { orden: number }>(
  reales: readonly T[],
  demo: readonly T[],
  minimo = MINIMO_PUNTOS_REALES,
): T[] {
  if (reales.length >= minimo) return [...reales]
  const ocupados = new Set(reales.map((p) => p.orden))
  return [...reales, ...demo.filter((p) => !ocupados.has(p.orden))].sort(
    (a, b) => a.orden - b.orden,
  )
}

const pedidos = new Map<string, Promise<Recorrido | null>>()
const resueltos = new Map<string, Recorrido | null>()
const claveDe = (zona: string, idioma: Idioma) => `${zona}:${idioma}`

/** El recorrido si ya se cargó en esta sesión (para mostrarlo sin esperar). Undefined si no. */
export function recorridoCargado(zona: string, idioma: Idioma): Recorrido | null | undefined {
  return resueltos.get(claveDe(zona, idioma))
}

/** La zona con sus puntos, o null si la zona no existe. Un fallo no queda guardado: se puede reintentar. */
export function obtenerRecorrido(slugZona: string, idioma: Idioma): Promise<Recorrido | null> {
  const clave = claveDe(slugZona, idioma)
  const pedido = pedidos.get(clave)
  if (pedido) return pedido

  const nuevo = Promise.all([obtenerZona(slugZona), obtenerPuntosDeZona(slugZona, idioma)])
    .then(([zona, reales]) => {
      const recorrido = zona
        ? { zona, puntos: completarConDemo(reales, PUNTOS_DEMO[slugZona] ?? []) }
        : null
      resueltos.set(clave, recorrido)
      return recorrido
    })
    .catch((error: unknown) => {
      pedidos.delete(clave)
      throw error
    })
  pedidos.set(clave, nuevo)
  return nuevo
}
