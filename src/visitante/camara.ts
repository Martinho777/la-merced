// Flujo de la cámara (bloque 3): rutas con la zona elegida, qué pantalla sigue tras cargar la zona y
// la solicitud de getUserMedia. Va aparte de las pantallas para poder probarlo sin DOM.

import type { ZonaConContorno } from '@/datos/zonas'

/** Parámetro de búsqueda con el slug de la zona elegida (`/camara?zona=fachada-principal`). */
export const PARAM_ZONA = 'zona'

type RutaDeZona = '/camara' | '/alineacion' | '/mapa'

/** Ruta de una pantalla del recorrido con la zona elegida. */
export function rutaConZona(ruta: RutaDeZona, slug: string): string {
  return `${ruta}?${new URLSearchParams({ [PARAM_ZONA]: slug }).toString()}`
}

/** Slug de la zona en los parámetros de búsqueda, o null si falta. */
export function zonaDeBusqueda(parametros: URLSearchParams): string | null {
  return parametros.get(PARAM_ZONA) || null
}

export type SiguientePaso = 'zonas' | 'mapa' | 'camara'

/**
 * Qué hacer con la zona cargada: si no existe, volver a elegir zona; si no usa cámara, ir directo
 * al mapa (sin explicación ni permiso); si la usa, seguir con la cámara.
 */
export function siguientePaso(zona: Pick<ZonaConContorno, 'usa_camara'> | null): SiguientePaso {
  if (!zona) return 'zonas'
  return zona.usa_camara ? 'camara' : 'mapa'
}

/** Estado de navegación que deja el botón "Activar cámara" al ir a /alineacion. */
export type EstadoAlineacion = { activada: true }

export function vieneDeActivar(estado: unknown): boolean {
  return (
    typeof estado === 'object' &&
    estado !== null &&
    (estado as Partial<EstadoAlineacion>).activada === true
  )
}

// --- Solicitud de la cámara ---

/**
 * Video de la cámara trasera, sin audio. `ideal` (no `exact`): si el dispositivo solo tiene cámara
 * frontal o no informa hacia dónde mira, se usa la que haya en lugar de fallar.
 */
export const RESTRICCIONES_CAMARA: MediaStreamConstraints = {
  audio: false,
  video: { facingMode: { ideal: 'environment' } },
}

/** Segundo intento si el navegador rechaza las restricciones: cualquier cámara. */
const RESTRICCIONES_RESPALDO: MediaStreamConstraints = { audio: false, video: true }

export type MotivoErrorCamara =
  | 'denegado'
  | 'sin-camara'
  | 'ocupada'
  | 'no-compatible'
  | 'inseguro'
  | 'reproduccion'
  | 'interrumpida'
  | 'desconocido'

export type ResultadoCamara =
  | { tipo: 'lista'; stream: MediaStream }
  | { tipo: 'error'; motivo: MotivoErrorCamara }
  | { tipo: 'cancelada' }

/** Lo mínimo del navegador que se usa; en las pruebas se pasa uno falso. */
export type EntornoCamara = {
  isSecureContext: boolean
  mediaDevices?: Pick<MediaDevices, 'getUserMedia'>
}

export type SolicitudCamara = {
  /** Nunca se rechaza: los errores llegan como `{ tipo: 'error' }`. */
  resultado: Promise<ResultadoCamara>
  /** Detiene la cámara si ya se obtuvo, o en cuanto llegue si la solicitud sigue pendiente. */
  cancelar: () => void
}

function entornoDelNavegador(): EntornoCamara {
  if (typeof window === 'undefined') return { isSecureContext: false }
  return { isSecureContext: window.isSecureContext, mediaDevices: navigator.mediaDevices }
}

function nombreDeError(error: unknown): string {
  return typeof error === 'object' && error !== null && 'name' in error
    ? String((error as { name: unknown }).name)
    : ''
}

/** Traduce el error de getUserMedia a un motivo que la pantalla sabe explicar. */
export function motivoDeError(error: unknown): MotivoErrorCamara {
  switch (nombreDeError(error)) {
    // SecurityError: la política del sitio o del navegador bloquea la cámara; para el visitante
    // equivale a un permiso negado.
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'denegado'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
    case 'ConstraintNotSatisfiedError':
      return 'sin-camara'
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'ocupada'
    case 'NotSupportedError':
    case 'TypeError':
      return 'no-compatible'
    default:
      return 'desconocido'
  }
}

/** Detiene todas las pistas del stream (apaga la luz de la cámara). */
export function detenerStream(stream: MediaStream): void {
  for (const pista of stream.getTracks()) pista.stop()
}

/**
 * Pide la cámara. Si se cancela antes de que el navegador responda (la persona salió de la
 * pantalla), el stream que llegue tarde se detiene en el acto.
 */
export function solicitarCamara(entorno: EntornoCamara = entornoDelNavegador()): SolicitudCamara {
  let cancelada = false
  let obtenido: MediaStream | null = null

  async function pedir(): Promise<ResultadoCamara> {
    // Fuera de HTTPS/localhost, navigator.mediaDevices ni siquiera existe.
    if (!entorno.isSecureContext) return { tipo: 'error', motivo: 'inseguro' }
    const getUserMedia = entorno.mediaDevices?.getUserMedia?.bind(entorno.mediaDevices)
    if (!getUserMedia) return { tipo: 'error', motivo: 'no-compatible' }

    let stream: MediaStream
    try {
      stream = await getUserMedia(RESTRICCIONES_CAMARA)
    } catch (error) {
      if (cancelada) return { tipo: 'cancelada' }
      if (nombreDeError(error) !== 'OverconstrainedError') {
        return { tipo: 'error', motivo: motivoDeError(error) }
      }
      try {
        stream = await getUserMedia(RESTRICCIONES_RESPALDO)
      } catch (errorRespaldo) {
        if (cancelada) return { tipo: 'cancelada' }
        return { tipo: 'error', motivo: motivoDeError(errorRespaldo) }
      }
    }

    if (cancelada) {
      detenerStream(stream)
      return { tipo: 'cancelada' }
    }
    obtenido = stream
    return { tipo: 'lista', stream }
  }

  const resultado = pedir().catch((error: unknown): ResultadoCamara => ({
    tipo: 'error',
    motivo: motivoDeError(error),
  }))

  return {
    resultado,
    cancelar() {
      cancelada = true
      if (obtenido) {
        detenerStream(obtenido)
        obtenido = null
      }
    },
  }
}
