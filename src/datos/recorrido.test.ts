import { beforeEach, describe, expect, it, vi } from 'vitest'

const obtenerZona = vi.fn()
const obtenerPuntosDeZona = vi.fn()

vi.mock('@/datos/zonas', () => ({ obtenerZona }))
vi.mock('@/datos/puntos', () => ({ obtenerPuntosDeZona }))

const { completarConDemo, obtenerRecorrido, recorridoCargado } = await import('@/datos/recorrido')
const { PUNTOS_DEMO } = await import('@/datos/puntos-demo')

const punto = (orden: number, origen = 'real') => ({ orden, origen })
const demo = [1, 2, 3, 4].map((orden) => punto(orden, 'demo'))

describe('completarConDemo', () => {
  it('con suficientes puntos reales no usa la demostración', () => {
    const reales = [punto(1), punto(2)]
    expect(completarConDemo(reales, demo, 2)).toEqual(reales)
  })

  it('completa respetando los reales y sin repetir su orden', () => {
    const resultado = completarConDemo([punto(2)], demo, 3)
    expect(resultado.map((p) => [p.orden, p.origen])).toEqual([
      [1, 'demo'],
      [2, 'real'],
      [3, 'demo'],
      [4, 'demo'],
    ])
  })

  it('sin demostración para la zona se queda con lo que haya', () => {
    expect(completarConDemo([punto(1)], [], 3)).toEqual([punto(1)])
  })
})

describe('datos de demostración', () => {
  const puntos = PUNTOS_DEMO['fachada-principal'] ?? []

  it('son 12 con identificadores únicos y coordenadas normalizadas', () => {
    expect(puntos).toHaveLength(12)
    expect(new Set(puntos.map((p) => p.slug)).size).toBe(12)
    for (const p of puntos) {
      expect(p.pos_x).toBeGreaterThanOrEqual(0)
      expect(p.pos_x).toBeLessThanOrEqual(1)
      expect(p.pos_y).toBeGreaterThanOrEqual(0)
      expect(p.pos_y).toBeLessThanOrEqual(1)
    }
  })
})

describe('obtenerRecorrido', () => {
  beforeEach(() => {
    obtenerZona.mockReset()
    obtenerPuntosDeZona.mockReset()
  })

  it('una zona que no existe da null', async () => {
    obtenerZona.mockResolvedValue(null)
    obtenerPuntosDeZona.mockResolvedValue([])
    await expect(obtenerRecorrido('no-existe', 'es')).resolves.toBeNull()
  })

  it('guarda el resultado de la sesión: no repite las consultas', async () => {
    obtenerZona.mockResolvedValue({ slug: 'guardada' })
    obtenerPuntosDeZona.mockResolvedValue([])
    await obtenerRecorrido('guardada', 'es')
    await obtenerRecorrido('guardada', 'es')
    expect(obtenerZona).toHaveBeenCalledTimes(1)
    expect(recorridoCargado('guardada', 'es')?.zona.slug).toBe('guardada')
    expect(recorridoCargado('guardada', 'en')).toBeUndefined()
  })

  it('un fallo no queda guardado: reintentar vuelve a consultar', async () => {
    obtenerZona.mockRejectedValueOnce(new Error('sin conexión'))
    obtenerPuntosDeZona.mockResolvedValue([])
    await expect(obtenerRecorrido('con-fallo', 'es')).rejects.toThrow('sin conexión')
    obtenerZona.mockResolvedValue({ slug: 'con-fallo' })
    await expect(obtenerRecorrido('con-fallo', 'es')).resolves.toMatchObject({
      zona: { slug: 'con-fallo' },
    })
  })
})
