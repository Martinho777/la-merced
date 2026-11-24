// «Guardar cambios» del editor de ubicaciones: junta las dos clases de cambio que tiene el borrador.
//  - Posiciones y clasificación: un punto por operación (`guardarUbicaciones`), sin atomicidad.
//  - Orden: una zona por operación (`reordenarPuntos`), atómica dentro de la zona.
// Entre unas y otras NO hay atomicidad: el resultado dice qué se guardó y qué no, y lo que falló sigue
// pendiente en el borrador para poder reintentarlo.

import type { PuntoGestor } from '@/datos/gestor'
import { guardarUbicaciones, type ResultadoGuardado } from '@/datos/ubicaciones'
import {
  aplicarOrden,
  guardarOrden,
  zonasConOrdenPendiente,
  type OrdenBorrador,
  type ResultadoOrden,
} from '@/gestor/orden'
import {
  aplicarResultado,
  editadosParaGuardar,
  type Borrador,
  type TipoResultado,
} from '@/gestor/ubicacion'

export type ResultadoCambios = { ubicaciones: ResultadoGuardado; orden: ResultadoOrden }

/** Si hay algo que guardar: posiciones, clasificación u orden. */
export function hayCambios(
  puntos: readonly PuntoGestor[],
  borrador: Borrador,
  orden: OrdenBorrador,
): boolean {
  return (
    editadosParaGuardar(puntos, borrador).length > 0 ||
    zonasConOrdenPendiente(puntos, orden).length > 0
  )
}

/**
 * Guarda lo pendiente: posiciones y clasificación por un lado, orden por otro, sin llamar a la base para
 * lo que no cambió. Nunca lanza por un punto o una zona: los errores quedan en el resultado.
 */
export async function guardarCambios(
  puntos: readonly PuntoGestor[],
  borrador: Borrador,
  orden: OrdenBorrador,
): Promise<ResultadoCambios> {
  const editados = editadosParaGuardar(puntos, borrador)
  const [ubicaciones, ordenGuardado] = await Promise.all([
    editados.length > 0
      ? guardarUbicaciones(editados)
      : Promise.resolve<ResultadoGuardado>({ guardados: [], fallidos: [], sinCambios: [] }),
    guardarOrden(puntos, orden),
  ])
  return { ubicaciones, orden: ordenGuardado }
}

/** Lo guardado pasa a ser lo "confirmado"; lo que falló conserva su borrador y sigue pendiente. */
export function aplicarCambios(
  puntos: readonly PuntoGestor[],
  borrador: Borrador,
  orden: OrdenBorrador,
  resultado: ResultadoCambios,
): { puntos: PuntoGestor[]; borrador: Borrador; orden: OrdenBorrador } {
  const conUbicaciones = aplicarResultado(puntos, borrador, resultado.ubicaciones)
  const conOrden = aplicarOrden(conUbicaciones.puntos, orden, resultado.orden)
  return { puntos: conOrden.puntos, borrador: conUbicaciones.borrador, orden: conOrden.orden }
}

/** Cómo contarle el resultado al usuario, contando cada punto y cada zona como una operación. */
export function tipoDeCambios(resultado: ResultadoCambios): TipoResultado {
  const { ubicaciones, orden } = resultado
  const guardadas = ubicaciones.guardados.length + orden.guardadas.length
  const fallidas = ubicaciones.fallidos.length + orden.fallidas.length
  if (fallidas === 0) return guardadas > 0 ? 'exito' : 'sinCambios'
  return guardadas > 0 ? 'parcial' : 'error'
}
