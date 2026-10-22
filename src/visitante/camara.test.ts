import { describe, expect, it, vi } from 'vitest'
import {
  motivoDeError,
  RESTRICCIONES_CAMARA,
  rutaConZona,
  siguientePaso,
  solicitarCamara,
  vieneDeActivar,
  zonaDeBusqueda,
  type EntornoCamara,
} from '@/visitante/camara'

// Stream falso: registra cuántas pistas se detuvieron.
function streamFalso() {
  const pistas = [{ stop: vi.fn() }, { stop: vi.fn() }]
  const stream = { getTracks: () => pistas } as unknown as MediaStream
  return { stream, detenidas: () => pistas.filter((p) => p.stop.mock.calls.length > 0).length }
}

function errorNombrado(name: string) {
  return Object.assign(new Error(name), { name })
}

/** getUserMedia que no responde hasta que la prueba lo decide. */
function solicitudPendiente() {
  let responder!: (stream: MediaStream) => void
  let fallar!: (error: unknown) => void
  const getUserMedia = vi.fn(
    () =>
      new Promise<MediaStream>((resolver, rechazar) => {
        responder = resolver
        fallar = rechazar
      }),
  )
  const entorno: EntornoCamara = { isSecureContext: true, mediaDevices: { getUserMedia } }
  return {
    entorno,
    getUserMedia,
    responder: (s: MediaStream) => responder(s),
    fallar: (e: unknown) => fallar(e),
  }
}

describe('rutas del recorrido con la zona', () => {
  it('lleva el slug en ?zona= y lo vuelve a leer', () => {
    expect(rutaConZona('/mapa', 'fachada-principal')).toBe('/mapa?zona=fachada-principal')
    expect(zonaDeBusqueda(new URLSearchParams('zona=interior'))).toBe('interior')
    expect(zonaDeBusqueda(new URLSearchParams(''))).toBeNull()
    expect(zonaDeBusqueda(new URLSearchParams('zona='))).toBeNull()
  })

  it('las zonas sin cámara van directo al mapa y las que no existen, a elegir zona', () => {
    expect(siguientePaso({ usa_camara: true })).toBe('camara')
    expect(siguientePaso({ usa_camara: false })).toBe('mapa')
    expect(siguientePaso(null)).toBe('zonas')
  })

  it('solo /alineacion abierta desde "Activar cámara" puede pedir el permiso', () => {
    expect(vieneDeActivar({ activada: true })).toBe(true)
    expect(vieneDeActivar(null)).toBe(false)
    expect(vieneDeActivar(undefined)).toBe(false)
    expect(vieneDeActivar({ activada: 'si' })).toBe(false)
  })
})

describe('solicitarCamara', () => {
  it('pide video de la cámara trasera sin audio y sin exigirla', async () => {
    const { stream } = streamFalso()
    const getUserMedia = vi.fn(() => Promise.resolve(stream))
    const { resultado } = solicitarCamara({ isSecureContext: true, mediaDevices: { getUserMedia } })

    await expect(resultado).resolves.toEqual({ tipo: 'lista', stream })
    expect(getUserMedia).toHaveBeenCalledTimes(1)
    expect(getUserMedia).toHaveBeenCalledWith(RESTRICCIONES_CAMARA)
    expect(RESTRICCIONES_CAMARA).toEqual({
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    })
  })

  it('sin contexto seguro no llama a getUserMedia', async () => {
    const getUserMedia = vi.fn()
    const { resultado } = solicitarCamara({
      isSecureContext: false,
      mediaDevices: { getUserMedia },
    })
    await expect(resultado).resolves.toEqual({ tipo: 'error', motivo: 'inseguro' })
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it('sin mediaDevices el navegador no es compatible', async () => {
    const { resultado } = solicitarCamara({ isSecureContext: true })
    await expect(resultado).resolves.toEqual({ tipo: 'error', motivo: 'no-compatible' })
  })

  it('un permiso negado es "denegado" (la pantalla sigue al mapa)', async () => {
    const getUserMedia = vi.fn(() => Promise.reject(errorNombrado('NotAllowedError')))
    const { resultado } = solicitarCamara({ isSecureContext: true, mediaDevices: { getUserMedia } })
    await expect(resultado).resolves.toEqual({ tipo: 'error', motivo: 'denegado' })
  })

  it('si las restricciones no se cumplen, reintenta con cualquier cámara', async () => {
    const { stream } = streamFalso()
    const getUserMedia = vi
      .fn()
      .mockRejectedValueOnce(errorNombrado('OverconstrainedError'))
      .mockResolvedValueOnce(stream)
    const { resultado } = solicitarCamara({ isSecureContext: true, mediaDevices: { getUserMedia } })

    await expect(resultado).resolves.toEqual({ tipo: 'lista', stream })
    expect(getUserMedia).toHaveBeenLastCalledWith({ audio: false, video: true })
  })

  it('una respuesta que llega después de salir detiene la cámara en el acto', async () => {
    const { stream, detenidas } = streamFalso()
    const pendiente = solicitudPendiente()
    const solicitud = solicitarCamara(pendiente.entorno)

    solicitud.cancelar()
    pendiente.responder(stream)

    await expect(solicitud.resultado).resolves.toEqual({ tipo: 'cancelada' })
    expect(detenidas()).toBe(2)
  })

  it('cancelar con la cámara ya abierta detiene todas las pistas', async () => {
    const { stream, detenidas } = streamFalso()
    const solicitud = solicitarCamara({
      isSecureContext: true,
      mediaDevices: { getUserMedia: () => Promise.resolve(stream) },
    })
    await solicitud.resultado
    expect(detenidas()).toBe(0)

    solicitud.cancelar()
    expect(detenidas()).toBe(2)
  })

  it('un error que llega después de salir no se informa', async () => {
    const pendiente = solicitudPendiente()
    const solicitud = solicitarCamara(pendiente.entorno)
    solicitud.cancelar()
    pendiente.fallar(errorNombrado('NotReadableError'))
    await expect(solicitud.resultado).resolves.toEqual({ tipo: 'cancelada' })
  })
})

describe('motivoDeError', () => {
  it('distingue permiso, cámara inexistente, ocupada y no compatible', () => {
    expect(motivoDeError(errorNombrado('NotAllowedError'))).toBe('denegado')
    expect(motivoDeError(errorNombrado('SecurityError'))).toBe('denegado')
    expect(motivoDeError(errorNombrado('NotFoundError'))).toBe('sin-camara')
    expect(motivoDeError(errorNombrado('NotReadableError'))).toBe('ocupada')
    expect(motivoDeError(errorNombrado('AbortError'))).toBe('ocupada')
    expect(motivoDeError(new TypeError('x'))).toBe('no-compatible')
    expect(motivoDeError('raro')).toBe('desconocido')
  })
})
