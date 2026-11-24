// Lógica del orden de los puntos en el editor de ubicaciones, aparte de la pantalla para probarla sin DOM:
// el borrador local del orden de cada zona, qué cambió y cómo guardarlo con la función de la base
// `reordenar_puntos` (vía `reordenarPuntos`). Igual que posiciones y clasificación, el orden vive en el
// borrador hasta «Guardar cambios».
//
// El borrador de una zona es solo la lista de ids de sus puntos en el orden deseado. No se renumera nada:
// la función de la base reparte entre los puntos, según su posición en la lista, los MISMOS valores de
// `orden` que la zona ya tenía (con sus huecos). `ordenProyectado` repite esa regla únicamente para
// MOSTRAR el número que quedará; lo que se guarda es la lista de ids, y tras guardar manda lo que
// respondió la base.

import type { PuntoGestor } from '@/datos/gestor'
import { reordenarPuntos, type PuntoOrdenado } from '@/datos/reordenar'

/** Orden deseado de cada zona (por id de zona): los ids de sus puntos reales, de primero a último. */
export type OrdenBorrador = Readonly<Record<string, readonly string[]>>

const porOrden = (a: PuntoGestor, b: PuntoGestor) => a.orden - b.orden

/** Orden igual a lo guardado en la base. También es "descartar cambios". */
export function crearOrden(puntos: readonly PuntoGestor[]): OrdenBorrador {
  const porZona = new Map<string, PuntoGestor[]>()
  for (const punto of puntos) {
    porZona.set(punto.zona.id, [...(porZona.get(punto.zona.id) ?? []), punto])
  }
  return Object.fromEntries(
    [...porZona].map(([zonaId, lista]) => [zonaId, lista.sort(porOrden).map((p) => p.id)]),
  )
}

/** Ids de los puntos de una zona como están guardados, en su orden guardado. */
const idsGuardados = (puntos: readonly PuntoGestor[], zonaId: string) =>
  puntos
    .filter((punto) => punto.zona.id === zonaId)
    .sort(porOrden)
    .map((punto) => punto.id)

/** Posición (desde 0) de un punto en el borrador de su zona, o -1 si no está. */
export const posicionEnOrden = (orden: OrdenBorrador, zonaId: string, idPunto: string): number =>
  orden[zonaId]?.indexOf(idPunto) ?? -1

/** Si el punto puede subir (`-1`) o bajar (`1`) un lugar: no puede el primero hacia arriba ni el último hacia abajo. */
export function puedeMover(
  orden: OrdenBorrador,
  zonaId: string,
  idPunto: string,
  sentido: -1 | 1,
): boolean {
  const ids = orden[zonaId]
  const i = posicionEnOrden(orden, zonaId, idPunto)
  return ids !== undefined && i >= 0 && i + sentido >= 0 && i + sentido < ids.length
}

/** Sube (`-1`) o baja (`1`) un punto un lugar dentro de su zona. En un límite o con un id desconocido, no cambia. */
export function moverPunto(
  orden: OrdenBorrador,
  zonaId: string,
  idPunto: string,
  sentido: -1 | 1,
): OrdenBorrador {
  const ids = orden[zonaId]
  if (!ids || !puedeMover(orden, zonaId, idPunto, sentido)) return orden
  const i = ids.indexOf(idPunto)
  const nuevos = [...ids]
  const otro = nuevos[i + sentido]
  if (otro === undefined) return orden
  nuevos[i + sentido] = idPunto
  nuevos[i] = otro
  return { ...orden, [zonaId]: nuevos }
}

/** Ids de las zonas cuyo orden en el borrador difiere del guardado. */
export function zonasConOrdenPendiente(
  puntos: readonly PuntoGestor[],
  orden: OrdenBorrador,
): string[] {
  return Object.entries(orden)
    .filter(([zonaId, ids]) => {
      const guardados = idsGuardados(puntos, zonaId)
      return guardados.length > 0 && ids.some((id, i) => id !== guardados[i])
    })
    .map(([zonaId]) => zonaId)
}

/**
 * Los puntos de una zona en el orden del borrador. Si el borrador no conoce la zona o un punto,
 * se usa el orden guardado: nunca se pierde un punto de la lista.
 */
export function puntosDeZonaEnOrden(
  puntos: readonly PuntoGestor[],
  orden: OrdenBorrador,
  zonaId: string | null,
): PuntoGestor[] {
  if (zonaId === null) return []
  const deLaZona = puntos.filter((punto) => punto.zona.id === zonaId).sort(porOrden)
  const ids = orden[zonaId]
  if (!ids || ids.length !== deLaZona.length) return deLaZona
  const porId = new Map(deLaZona.map((punto) => [punto.id, punto]))
  const enOrden = ids.flatMap((id) => porId.get(id) ?? [])
  return enOrden.length === deLaZona.length ? enOrden : deLaZona
}

/**
 * Número de `orden` que tendrá cada punto si se guarda el borrador (id → orden). Es la misma regla de
 * la función de la base: los valores que la zona ya tiene, repartidos por posición. Solo para mostrar.
 */
export function ordenProyectado(
  puntos: readonly PuntoGestor[],
  orden: OrdenBorrador,
): Record<string, number> {
  const proyectado: Record<string, number> = {}
  for (const zonaId of new Set(puntos.map((punto) => punto.zona.id))) {
    const valores = puntos
      .filter((punto) => punto.zona.id === zonaId)
      .map((punto) => punto.orden)
      .sort((a, b) => a - b)
    puntosDeZonaEnOrden(puntos, orden, zonaId).forEach((punto, i) => {
      proyectado[punto.id] = valores[i] ?? punto.orden
    })
  }
  return proyectado
}

/** Ids de los puntos cuyo número de orden cambiaría al guardar. */
export function puntosConOrdenCambiado(
  puntos: readonly PuntoGestor[],
  orden: OrdenBorrador,
): string[] {
  const proyectado = ordenProyectado(puntos, orden)
  return puntos
    .filter((punto) => (proyectado[punto.id] ?? punto.orden) !== punto.orden)
    .map((punto) => punto.id)
}

// --- Guardado ---

export type ResultadoOrden = {
  /** Zonas reordenadas, con el orden que quedó en la base para todos sus puntos. */
  guardadas: { zonaId: string; puntos: PuntoOrdenado[] }[]
  /** Zonas que no se reordenaron, con el motivo. Una zona fallida no cambió ningún punto. */
  fallidas: { zonaId: string; mensaje: string }[]
}

type Zona = ResultadoOrden['guardadas'][number]
type Fallo = ResultadoOrden['fallidas'][number]
type Intento = Zona | Fallo | null

/**
 * Reordena en la base cada zona con orden pendiente: una llamada por zona, con la lista COMPLETA de sus
 * puntos reales. Cada zona es atómica; entre zonas no hay atomicidad, así que unas pueden guardarse y
 * otras fallar. Las zonas sin cambios no se mandan. Nunca lanza: los errores quedan en `fallidas`.
 */
export async function guardarOrden(
  puntos: readonly PuntoGestor[],
  orden: OrdenBorrador,
): Promise<ResultadoOrden> {
  const intentos = await Promise.all(
    zonasConOrdenPendiente(puntos, orden).map(async (zonaId): Promise<Intento> => {
      try {
        const respuesta = await reordenarPuntos(
          zonaId,
          orden[zonaId] ?? [],
          idsGuardados(puntos, zonaId),
        )
        return respuesta.cambio ? { zonaId, puntos: respuesta.puntos } : null
      } catch (e) {
        return { zonaId, mensaje: e instanceof Error ? e.message : 'Error desconocido.' }
      }
    }),
  )

  const resultado: ResultadoOrden = { guardadas: [], fallidas: [] }
  for (const intento of intentos) {
    if (intento === null) continue
    if ('puntos' in intento) resultado.guardadas.push(intento)
    else resultado.fallidas.push(intento)
  }
  return resultado
}

/**
 * Tras guardar: las zonas reordenadas toman el orden que dejó la base (puntos y borrador alineados). Las
 * zonas que fallaron conservan su borrador y siguen pendientes. La lista queda ordenada por zona y número.
 */
export function aplicarOrden(
  puntos: readonly PuntoGestor[],
  orden: OrdenBorrador,
  resultado: ResultadoOrden,
): { puntos: PuntoGestor[]; orden: OrdenBorrador } {
  if (resultado.guardadas.length === 0) return { puntos: [...puntos], orden }
  const nuevos = new Map(
    resultado.guardadas.flatMap((zona) => zona.puntos.map((p) => [p.id, p.orden] as const)),
  )
  const siguiente = puntos
    .map((punto) => {
      const nuevo = nuevos.get(punto.id)
      return nuevo === undefined ? punto : { ...punto, orden: nuevo }
    })
    .sort((a, b) => a.zona.orden - b.zona.orden || a.orden - b.orden)
  const deLasGuardadas = crearOrden(siguiente)
  return {
    puntos: siguiente,
    orden: {
      ...orden,
      ...Object.fromEntries(
        resultado.guardadas.flatMap(({ zonaId }) => {
          const ids = deLasGuardadas[zonaId]
          return ids ? [[zonaId, ids] as const] : []
        }),
      ),
    },
  }
}
