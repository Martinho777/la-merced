import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PuntoGestor } from '@/datos/gestor'

// Sin Supabase real: se simulan las dos operaciones de la base (ubicaciones por punto y orden por zona)
// para comprobar cómo se combinan sus resultados. El mock de `@/datos/ubicaciones` conserva el resto del
// módulo real (p. ej. `diferenciaUbicacion`), y para cargarlo hace falta el cliente de Supabase, que lanza
// si faltan las variables de entorno (como en la CI): por eso también se sustituye `@/lib/supabase`.
const guardarUbicaciones = vi.fn()
const reordenarPuntos = vi.fn()
vi.mock('@/lib/supabase', () => ({ supabase: {} }))
vi.mock('@/datos/ubicaciones', async (original) => ({
  ...(await original<typeof import('@/datos/ubicaciones')>()),
  guardarUbicaciones: (...args: unknown[]) => guardarUbicaciones(...args),
}))
vi.mock('@/datos/reordenar', () => ({
  reordenarPuntos: (...args: unknown[]) => reordenarPuntos(...args),
}))

const { aplicarCambios, guardarCambios, hayCambios, tipoDeCambios } =
  await import('@/gestor/guardado')
const { crearOrden, moverPunto, zonasConOrdenPendiente } = await import('@/gestor/orden')
const { colocarPunto, crearBorrador, puntosPendientes } = await import('@/gestor/ubicacion')

function punto(id: string, orden: number, extra: Partial<PuntoGestor> = {}): PuntoGestor {
  return {
    id,
    slug: id,
    orden,
    zona: { id: 'z-1', slug: 'fachada', orden: 1 },
    pos_x: null,
    pos_y: null,
    es_esencial: false,
    fichas: { es: null, en: null },
    ...extra,
  }
}

// `c` no tiene ubicación: se puede reordenar igual.
const puntos = [
  punto('a', 1, { pos_x: 0.2, pos_y: 0.4 }),
  punto('b', 2, { pos_x: 0.5, pos_y: 0.5 }),
  punto('c', 3),
]

const ordenBase = crearOrden(puntos)
const borradorBase = crearBorrador(puntos)
const sinUbicaciones = { guardados: [], fallidos: [], sinCambios: [] }

beforeEach(() => {
  guardarUbicaciones.mockReset()
  reordenarPuntos.mockReset()
})

describe('hay algo que guardar', () => {
  it('no, sin cambios', () => {
    expect(hayCambios(puntos, borradorBase, ordenBase)).toBe(false)
  })

  it('sí, solo con cambio de orden', () => {
    expect(hayCambios(puntos, borradorBase, moverPunto(ordenBase, 'z-1', 'c', -1))).toBe(true)
  })

  it('sí, solo con cambio de posición', () => {
    expect(hayCambios(puntos, colocarPunto(borradorBase, 'a', 0.9, 0.9), ordenBase)).toBe(true)
  })
})

describe('guardar los cambios', () => {
  it('sin cambios no llama a la base', async () => {
    const resultado = await guardarCambios(puntos, borradorBase, ordenBase)
    expect(guardarUbicaciones).not.toHaveBeenCalled()
    expect(reordenarPuntos).not.toHaveBeenCalled()
    expect(tipoDeCambios(resultado)).toBe('sinCambios')
  })

  it('solo orden: no llama a guardar ubicaciones y manda la lista completa de la zona', async () => {
    reordenarPuntos.mockResolvedValue({
      cambio: true,
      puntos: [
        { id: 'c', orden: 1 },
        { id: 'a', orden: 2 },
        { id: 'b', orden: 3 },
      ],
    })
    const orden = moverPunto(moverPunto(ordenBase, 'z-1', 'c', -1), 'z-1', 'c', -1)
    const resultado = await guardarCambios(puntos, borradorBase, orden)
    expect(guardarUbicaciones).not.toHaveBeenCalled()
    expect(reordenarPuntos).toHaveBeenCalledWith('z-1', ['c', 'a', 'b'], ['a', 'b', 'c'])
    expect(tipoDeCambios(resultado)).toBe('exito')
  })

  it('solo posición: no llama a la función de orden', async () => {
    guardarUbicaciones.mockResolvedValue({
      guardados: [{ id: 'a', ubicacion: { pos_x: 0.9, pos_y: 0.9, es_esencial: false } }],
      fallidos: [],
      sinCambios: [],
    })
    const resultado = await guardarCambios(
      puntos,
      colocarPunto(borradorBase, 'a', 0.9, 0.9),
      ordenBase,
    )
    expect(guardarUbicaciones).toHaveBeenCalledTimes(1)
    expect(reordenarPuntos).not.toHaveBeenCalled()
    expect(tipoDeCambios(resultado)).toBe('exito')
  })

  it('guardado exitoso de posiciones y orden: nada queda pendiente', async () => {
    guardarUbicaciones.mockResolvedValue({
      guardados: [{ id: 'c', ubicacion: { pos_x: 0.3, pos_y: 0.3, es_esencial: false } }],
      fallidos: [],
      sinCambios: [],
    })
    reordenarPuntos.mockResolvedValue({
      cambio: true,
      puntos: [
        { id: 'a', orden: 1 },
        { id: 'c', orden: 2 },
        { id: 'b', orden: 3 },
      ],
    })
    const borrador = colocarPunto(borradorBase, 'c', 0.3, 0.3)
    const orden = moverPunto(ordenBase, 'z-1', 'c', -1)
    const resultado = await guardarCambios(puntos, borrador, orden)
    const siguiente = aplicarCambios(puntos, borrador, orden, resultado)
    expect(tipoDeCambios(resultado)).toBe('exito')
    expect(puntosPendientes(siguiente.puntos, siguiente.borrador)).toEqual([])
    expect(zonasConOrdenPendiente(siguiente.puntos, siguiente.orden)).toEqual([])
    expect(hayCambios(siguiente.puntos, siguiente.borrador, siguiente.orden)).toBe(false)
    expect(siguiente.puntos.map((p) => [p.id, p.orden])).toEqual([
      ['a', 1],
      ['c', 2],
      ['b', 3],
    ])
  })

  it('error de la RPC: es un fallo total, y el orden queda pendiente para reintentar', async () => {
    reordenarPuntos.mockRejectedValue(new Error('No se pudieron reordenar los puntos: x'))
    const orden = moverPunto(ordenBase, 'z-1', 'c', -1)
    const resultado = await guardarCambios(puntos, borradorBase, orden)
    const siguiente = aplicarCambios(puntos, borradorBase, orden, resultado)
    expect(tipoDeCambios(resultado)).toBe('error')
    expect(resultado.orden.fallidas).toHaveLength(1)
    expect(siguiente.puntos).toEqual(puntos)
    expect(siguiente.orden).toBe(orden)
    expect(zonasConOrdenPendiente(siguiente.puntos, siguiente.orden)).toEqual(['z-1'])
  })

  it('fallo parcial: la posición se guarda y el orden falla; solo el orden sigue pendiente', async () => {
    guardarUbicaciones.mockResolvedValue({
      guardados: [{ id: 'a', ubicacion: { pos_x: 0.9, pos_y: 0.9, es_esencial: false } }],
      fallidos: [],
      sinCambios: [],
    })
    reordenarPuntos.mockRejectedValue(new Error('sin permiso'))
    const borrador = colocarPunto(borradorBase, 'a', 0.9, 0.9)
    const orden = moverPunto(ordenBase, 'z-1', 'c', -1)
    const resultado = await guardarCambios(puntos, borrador, orden)
    const siguiente = aplicarCambios(puntos, borrador, orden, resultado)
    expect(tipoDeCambios(resultado)).toBe('parcial')
    expect(puntosPendientes(siguiente.puntos, siguiente.borrador)).toEqual([])
    expect(siguiente.puntos.find((p) => p.id === 'a')?.pos_x).toBe(0.9)
    expect(zonasConOrdenPendiente(siguiente.puntos, siguiente.orden)).toEqual(['z-1'])
    expect(resultado.orden.fallidas).toEqual([{ zonaId: 'z-1', mensaje: 'sin permiso' }])
  })

  it('fallo parcial inverso: el orden se guarda y la posición falla; la posición sigue pendiente', async () => {
    guardarUbicaciones.mockResolvedValue({
      guardados: [],
      fallidos: [{ id: 'a', mensaje: 'sin permiso' }],
      sinCambios: [],
    })
    reordenarPuntos.mockResolvedValue({
      cambio: true,
      puntos: [
        { id: 'a', orden: 1 },
        { id: 'c', orden: 2 },
        { id: 'b', orden: 3 },
      ],
    })
    const borrador = colocarPunto(borradorBase, 'a', 0.9, 0.9)
    const orden = moverPunto(ordenBase, 'z-1', 'c', -1)
    const resultado = await guardarCambios(puntos, borrador, orden)
    const siguiente = aplicarCambios(puntos, borrador, orden, resultado)
    expect(tipoDeCambios(resultado)).toBe('parcial')
    expect(zonasConOrdenPendiente(siguiente.puntos, siguiente.orden)).toEqual([])
    expect(puntosPendientes(siguiente.puntos, siguiente.borrador)).toEqual(['a'])
    expect(siguiente.borrador['a']?.pos_x).toBe(0.9)
  })

  it('reintentar tras un fallo manda otra vez solo lo que quedó pendiente', async () => {
    reordenarPuntos.mockRejectedValueOnce(new Error('falló'))
    const orden = moverPunto(ordenBase, 'z-1', 'c', -1)
    const primero = await guardarCambios(puntos, borradorBase, orden)
    const tras = aplicarCambios(puntos, borradorBase, orden, primero)

    reordenarPuntos.mockResolvedValueOnce({
      cambio: true,
      puntos: [
        { id: 'a', orden: 1 },
        { id: 'c', orden: 2 },
        { id: 'b', orden: 3 },
      ],
    })
    const segundo = await guardarCambios(tras.puntos, tras.borrador, tras.orden)
    expect(reordenarPuntos).toHaveBeenCalledTimes(2)
    expect(reordenarPuntos).toHaveBeenLastCalledWith('z-1', ['a', 'c', 'b'], ['a', 'b', 'c'])
    expect(guardarUbicaciones).not.toHaveBeenCalled()
    expect(tipoDeCambios(segundo)).toBe('exito')
  })

  it('el orden de un punto sin ubicación no depende de su posición en la ilustración', async () => {
    reordenarPuntos.mockResolvedValue({ cambio: true, puntos: [] })
    await guardarCambios(puntos, borradorBase, moverPunto(ordenBase, 'z-1', 'c', -1))
    expect(guardarUbicaciones).not.toHaveBeenCalled()
    expect(reordenarPuntos.mock.calls[0]?.[1]).toContain('c')
  })
})

describe('resumen del resultado', () => {
  const orden = { guardadas: [{ zonaId: 'z', puntos: [] }], fallidas: [] }

  it('éxito, parcial y error cuentan puntos y zonas como operaciones', () => {
    expect(tipoDeCambios({ ubicaciones: sinUbicaciones, orden })).toBe('exito')
    expect(
      tipoDeCambios({
        ubicaciones: { ...sinUbicaciones, fallidos: [{ id: 'a', mensaje: 'x' }] },
        orden,
      }),
    ).toBe('parcial')
    expect(
      tipoDeCambios({
        ubicaciones: { ...sinUbicaciones, fallidos: [{ id: 'a', mensaje: 'x' }] },
        orden: { guardadas: [], fallidas: [{ zonaId: 'z', mensaje: 'x' }] },
      }),
    ).toBe('error')
  })
})
