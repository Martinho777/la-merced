import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PuntoGestor } from '@/datos/gestor'

// Sin Supabase real: solo se comprueba qué se manda a `reordenarPuntos` y qué se hace con la respuesta.
const reordenarPuntos = vi.fn()
vi.mock('@/datos/reordenar', () => ({
  reordenarPuntos: (...args: unknown[]) => reordenarPuntos(...args),
}))

const {
  aplicarOrden,
  crearOrden,
  guardarOrden,
  moverPunto,
  ordenProyectado,
  posicionEnOrden,
  puedeMover,
  puntosConOrdenCambiado,
  puntosDeZonaEnOrden,
  zonasConOrdenPendiente,
} = await import('@/gestor/orden')

function punto(id: string, zona: string, orden: number, extra: Partial<PuntoGestor> = {}) {
  return {
    id,
    slug: id,
    orden,
    zona: { id: `z-${zona}`, slug: zona, orden: zona === 'fachada' ? 1 : 2 },
    pos_x: null,
    pos_y: null,
    es_esencial: false,
    fichas: { es: null, en: null },
    ...extra,
  } satisfies PuntoGestor
}

// Fachada con huecos en `orden` (1, 3, 4); interior con 2, 5. Interior tiene un punto sin ubicación.
const puntos = [
  punto('a', 'fachada', 1, { pos_x: 0.2, pos_y: 0.4 }),
  punto('b', 'fachada', 3),
  punto('c', 'fachada', 4),
  punto('d', 'interior', 2),
  punto('e', 'interior', 5, { pos_x: 0.1, pos_y: 0.1 }),
]

describe('borrador de orden', () => {
  it('parte de lo guardado: ids de cada zona por su orden, aunque lleguen desordenados', () => {
    const desordenados = [puntos[2], puntos[0], puntos[1], puntos[4], puntos[3]].filter(
      (p) => p !== undefined,
    )
    expect(crearOrden(desordenados)).toEqual({
      'z-fachada': ['a', 'b', 'c'],
      'z-interior': ['d', 'e'],
    })
  })

  it('sin tocar nada no hay zonas pendientes ni números cambiados', () => {
    const orden = crearOrden(puntos)
    expect(zonasConOrdenPendiente(puntos, orden)).toEqual([])
    expect(puntosConOrdenCambiado(puntos, orden)).toEqual([])
  })
})

describe('subir y bajar', () => {
  it('subir un punto lo intercambia con el anterior, sin tocar lo demás ni lo guardado', () => {
    const inicial = crearOrden(puntos)
    const orden = moverPunto(inicial, 'z-fachada', 'b', -1)
    expect(orden['z-fachada']).toEqual(['b', 'a', 'c'])
    expect(orden['z-interior']).toEqual(['d', 'e'])
    expect(inicial['z-fachada']).toEqual(['a', 'b', 'c'])
    expect(puntos[1]?.orden).toBe(3)
  })

  it('bajar un punto lo intercambia con el siguiente', () => {
    const orden = moverPunto(crearOrden(puntos), 'z-fachada', 'b', 1)
    expect(orden['z-fachada']).toEqual(['a', 'c', 'b'])
  })

  it('el primero no sube y el último no baja: el borrador no cambia', () => {
    const inicial = crearOrden(puntos)
    expect(puedeMover(inicial, 'z-fachada', 'a', -1)).toBe(false)
    expect(puedeMover(inicial, 'z-fachada', 'a', 1)).toBe(true)
    expect(puedeMover(inicial, 'z-fachada', 'c', 1)).toBe(false)
    expect(puedeMover(inicial, 'z-fachada', 'c', -1)).toBe(true)
    expect(moverPunto(inicial, 'z-fachada', 'a', -1)).toBe(inicial)
    expect(moverPunto(inicial, 'z-fachada', 'c', 1)).toBe(inicial)
  })

  it('una zona con un solo punto no puede moverse en ningún sentido', () => {
    const solo = crearOrden([punto('x', 'fachada', 7)])
    expect(puedeMover(solo, 'z-fachada', 'x', -1)).toBe(false)
    expect(puedeMover(solo, 'z-fachada', 'x', 1)).toBe(false)
  })

  it('un id o una zona desconocidos no cambian nada', () => {
    const inicial = crearOrden(puntos)
    expect(moverPunto(inicial, 'z-fachada', 'zzz', 1)).toBe(inicial)
    expect(moverPunto(inicial, 'z-nada', 'a', 1)).toBe(inicial)
    expect(posicionEnOrden(inicial, 'z-fachada', 'zzz')).toBe(-1)
  })

  it('un punto sin ubicación se puede mover igual que uno ubicado', () => {
    const orden = moverPunto(crearOrden(puntos), 'z-interior', 'd', 1)
    expect(orden['z-interior']).toEqual(['e', 'd'])
  })
})

describe('detección de cambios de orden', () => {
  it('mover marca solo la zona afectada', () => {
    const orden = moverPunto(crearOrden(puntos), 'z-fachada', 'b', -1)
    expect(zonasConOrdenPendiente(puntos, orden)).toEqual(['z-fachada'])
  })

  it('mover varias zonas marca todas', () => {
    let orden = moverPunto(crearOrden(puntos), 'z-fachada', 'b', -1)
    orden = moverPunto(orden, 'z-interior', 'd', 1)
    expect(zonasConOrdenPendiente(puntos, orden).sort()).toEqual(['z-fachada', 'z-interior'])
  })

  it('subir y volver a bajar deja la zona sin cambios', () => {
    let orden = moverPunto(crearOrden(puntos), 'z-fachada', 'b', -1)
    orden = moverPunto(orden, 'z-fachada', 'b', 1)
    expect(zonasConOrdenPendiente(puntos, orden)).toEqual([])
  })

  it('los puntos de la zona se listan en el orden del borrador', () => {
    const orden = moverPunto(crearOrden(puntos), 'z-fachada', 'c', -1)
    expect(puntosDeZonaEnOrden(puntos, orden, 'z-fachada').map((p) => p.id)).toEqual([
      'a',
      'c',
      'b',
    ])
    expect(puntosDeZonaEnOrden(puntos, orden, null)).toEqual([])
  })

  it('si el borrador no conoce la zona, se usa el orden guardado y no se pierde ningún punto', () => {
    expect(puntosDeZonaEnOrden(puntos, {}, 'z-fachada').map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('número de orden que quedaría (solo para mostrar)', () => {
  it('conserva los valores existentes, huecos incluidos, repartidos por posición', () => {
    const orden = moverPunto(crearOrden(puntos), 'z-fachada', 'c', -1) // a, c, b
    expect(ordenProyectado(puntos, orden)).toMatchObject({ a: 1, c: 3, b: 4, d: 2, e: 5 })
  })

  it('solo los puntos cuyo número cambia se marcan como orden modificado', () => {
    const orden = moverPunto(crearOrden(puntos), 'z-fachada', 'c', -1)
    expect(puntosConOrdenCambiado(puntos, orden).sort()).toEqual(['b', 'c'])
  })
})

describe('guardar el orden', () => {
  beforeEach(() => {
    reordenarPuntos.mockReset()
  })

  it('sin cambios no llama a la base', async () => {
    const resultado = await guardarOrden(puntos, crearOrden(puntos))
    expect(reordenarPuntos).not.toHaveBeenCalled()
    expect(resultado).toEqual({ guardadas: [], fallidas: [] })
  })

  it('manda la lista completa de la zona, en el orden nuevo, junto con el orden guardado', async () => {
    reordenarPuntos.mockResolvedValue({
      cambio: true,
      puntos: [
        { id: 'b', orden: 1 },
        { id: 'a', orden: 3 },
        { id: 'c', orden: 4 },
      ],
    })
    const orden = moverPunto(crearOrden(puntos), 'z-fachada', 'b', -1)
    const resultado = await guardarOrden(puntos, orden)
    expect(reordenarPuntos).toHaveBeenCalledTimes(1)
    expect(reordenarPuntos).toHaveBeenCalledWith('z-fachada', ['b', 'a', 'c'], ['a', 'b', 'c'])
    expect(resultado.guardadas).toHaveLength(1)
    expect(resultado.fallidas).toEqual([])
  })

  it('reordena varias zonas con una llamada por zona, y solo las que cambiaron', async () => {
    reordenarPuntos.mockResolvedValue({ cambio: true, puntos: [] })
    let orden = moverPunto(crearOrden(puntos), 'z-fachada', 'a', 1)
    orden = moverPunto(orden, 'z-interior', 'e', -1)
    const resultado = await guardarOrden(puntos, orden)
    expect(reordenarPuntos).toHaveBeenCalledTimes(2)
    expect(reordenarPuntos).toHaveBeenCalledWith('z-fachada', ['b', 'a', 'c'], ['a', 'b', 'c'])
    expect(reordenarPuntos).toHaveBeenCalledWith('z-interior', ['e', 'd'], ['d', 'e'])
    expect(resultado.guardadas.map((z) => z.zonaId).sort()).toEqual(['z-fachada', 'z-interior'])
  })

  it('un error de la base queda como zona fallida y no lanza', async () => {
    reordenarPuntos.mockRejectedValue(new Error('No se pudieron reordenar los puntos: x'))
    const orden = moverPunto(crearOrden(puntos), 'z-fachada', 'a', 1)
    const resultado = await guardarOrden(puntos, orden)
    expect(resultado.guardadas).toEqual([])
    expect(resultado.fallidas).toEqual([
      { zonaId: 'z-fachada', mensaje: 'No se pudieron reordenar los puntos: x' },
    ])
  })

  it('con varias zonas, una puede guardarse y otra fallar', async () => {
    reordenarPuntos.mockImplementation((zonaId: string) =>
      zonaId === 'z-fachada'
        ? Promise.resolve({ cambio: true, puntos: [] })
        : Promise.reject(new Error('sin permiso')),
    )
    let orden = moverPunto(crearOrden(puntos), 'z-fachada', 'a', 1)
    orden = moverPunto(orden, 'z-interior', 'e', -1)
    const resultado = await guardarOrden(puntos, orden)
    expect(resultado.guardadas.map((z) => z.zonaId)).toEqual(['z-fachada'])
    expect(resultado.fallidas).toEqual([{ zonaId: 'z-interior', mensaje: 'sin permiso' }])
  })
})

describe('aplicar el resultado del orden', () => {
  const orden = moverPunto(crearOrden(puntos), 'z-fachada', 'b', -1) // b, a, c

  it('la zona guardada toma los números de la base, sin pendientes y con la lista reordenada', () => {
    const siguiente = aplicarOrden(puntos, orden, {
      guardadas: [
        {
          zonaId: 'z-fachada',
          puntos: [
            { id: 'b', orden: 1 },
            { id: 'a', orden: 3 },
            { id: 'c', orden: 4 },
          ],
        },
      ],
      fallidas: [],
    })
    expect(
      siguiente.puntos.filter((p) => p.zona.slug === 'fachada').map((p) => [p.id, p.orden]),
    ).toEqual([
      ['b', 1],
      ['a', 3],
      ['c', 4],
    ])
    expect(siguiente.orden['z-fachada']).toEqual(['b', 'a', 'c'])
    expect(zonasConOrdenPendiente(siguiente.puntos, siguiente.orden)).toEqual([])
    // Lo ajeno no se toca.
    expect(siguiente.puntos.find((p) => p.id === 'd')?.orden).toBe(2)
  })

  it('una zona fallida conserva el borrador como pendiente y los puntos como estaban', () => {
    const siguiente = aplicarOrden(puntos, orden, {
      guardadas: [],
      fallidas: [{ zonaId: 'z-fachada', mensaje: 'falló' }],
    })
    expect(siguiente.puntos.map((p) => p.orden)).toEqual(puntos.map((p) => p.orden))
    expect(siguiente.orden).toBe(orden)
    expect(zonasConOrdenPendiente(siguiente.puntos, siguiente.orden)).toEqual(['z-fachada'])
  })

  it('descartar es volver a crear el borrador desde lo guardado', () => {
    expect(zonasConOrdenPendiente(puntos, crearOrden(puntos))).toEqual([])
    expect(puntosConOrdenCambiado(puntos, crearOrden(puntos))).toEqual([])
  })
})
