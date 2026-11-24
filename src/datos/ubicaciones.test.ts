import { beforeEach, describe, expect, it, vi } from 'vitest'

// Registra lo que se manda a Supabase. Cada punto puede responder con un error o con "no hay fila"
// (lo que pasa cuando las reglas de acceso no dejan editar).
type Llamada = { tabla: string; campos: Record<string, unknown>; id: unknown }
const llamadas: Llamada[] = []
let fallas: Record<string, { message: string }> = {}
let sinFila = new Set<string>()

function consulta(tabla: string) {
  const llamada: Llamada = { tabla, campos: {}, id: undefined }
  const c = {
    update: (campos: Record<string, unknown>) => {
      llamada.campos = campos
      return c
    },
    eq: (_columna: string, id: unknown) => {
      llamada.id = id
      return c
    },
    select: () => c,
    maybeSingle: async () => {
      llamadas.push(llamada)
      const id = String(llamada.id)
      const error = fallas[id]
      if (error) return { data: null, error }
      if (sinFila.has(id)) return { data: null, error: null }
      // La base devuelve la fila resultante: lo escrito sobre un punto que estaba en (0.1, 0.2).
      return {
        data: { pos_x: 0.1, pos_y: 0.2, es_esencial: false, ...llamada.campos },
        error: null,
      }
    },
  }
  return c
}

vi.mock('@/lib/supabase', () => ({ supabase: { from: (tabla: string) => consulta(tabla) } }))

const { diferenciaUbicacion, guardarUbicacionPunto, guardarUbicaciones, validarCambioUbicacion } =
  await import('@/datos/ubicaciones')

const original = { pos_x: 0.1, pos_y: 0.2, es_esencial: false }

describe('guardar la ubicación de un punto', () => {
  beforeEach(() => {
    llamadas.length = 0
    fallas = {}
    sinFila = new Set()
  })

  it('guarda las coordenadas del punto indicado y devuelve lo que quedó en la base', async () => {
    const guardada = await guardarUbicacionPunto('p1', { pos_x: 0.25, pos_y: 0.75 })
    expect(llamadas).toEqual([{ tabla: 'puntos', campos: { pos_x: 0.25, pos_y: 0.75 }, id: 'p1' }])
    expect(guardada).toEqual({ pos_x: 0.25, pos_y: 0.75, es_esencial: false })
  })

  it('guarda es_esencial sin tocar la posición', async () => {
    const guardada = await guardarUbicacionPunto('p1', { es_esencial: true })
    expect(llamadas[0]?.campos).toEqual({ es_esencial: true })
    expect(guardada.es_esencial).toBe(true)
  })

  it('acepta 0 y 1 como coordenadas válidas', async () => {
    await guardarUbicacionPunto('p1', { pos_x: 0, pos_y: 0 })
    await guardarUbicacionPunto('p2', { pos_x: 1, pos_y: 1 })
    expect(llamadas[0]?.campos).toEqual({ pos_x: 0, pos_y: 0 })
    expect(llamadas[1]?.campos).toEqual({ pos_x: 1, pos_y: 1 })
  })

  it('guarda null para quitar la ubicación', async () => {
    await guardarUbicacionPunto('p1', { pos_x: null, pos_y: null })
    expect(llamadas[0]?.campos).toEqual({ pos_x: null, pos_y: null })
  })

  it('redondea la posición a los 5 decimales que guarda la base', async () => {
    await guardarUbicacionPunto('p1', { pos_x: 0.123456789, pos_y: 0.5 })
    expect(llamadas[0]?.campos).toEqual({ pos_x: 0.12346, pos_y: 0.5 })
  })

  it('nunca escribe el orden ni otros campos, aunque lleguen en el objeto', async () => {
    const conExtras = { pos_x: 0.3, pos_y: 0.4, orden: 9, zona_id: 'z' } as never
    await guardarUbicacionPunto('p1', conExtras)
    expect(Object.keys(llamadas[0]?.campos ?? {}).sort()).toEqual(['pos_x', 'pos_y'])
  })

  it('rechaza coordenadas fuera de 0–1 sin llamar a la base', async () => {
    for (const valor of [-0.01, 1.01, 5, -1]) {
      await expect(guardarUbicacionPunto('p1', { pos_x: valor, pos_y: 0.5 })).rejects.toThrow(
        'pos_x debe ser un número entre 0 y 1',
      )
      await expect(guardarUbicacionPunto('p1', { pos_x: 0.5, pos_y: valor })).rejects.toThrow(
        'pos_y debe ser un número entre 0 y 1',
      )
    }
    expect(llamadas).toHaveLength(0)
  })

  it('rechaza NaN e infinito sin llamar a la base', async () => {
    for (const valor of [Number.NaN, Infinity, -Infinity]) {
      await expect(guardarUbicacionPunto('p1', { pos_x: valor, pos_y: 0.5 })).rejects.toThrow(
        'entre 0 y 1',
      )
    }
    expect(llamadas).toHaveLength(0)
  })

  it('rechaza valores que no son números ni booleanos', async () => {
    await expect(
      guardarUbicacionPunto('p1', { pos_x: '0.5', pos_y: 0.5 } as never),
    ).rejects.toThrow('entre 0 y 1')
    await expect(guardarUbicacionPunto('p1', { es_esencial: 'si' } as never)).rejects.toThrow(
      'es_esencial debe ser verdadero o falso',
    )
    expect(llamadas).toHaveLength(0)
  })

  it('exige pos_x y pos_y juntas y ambas con valor o ambas null', async () => {
    await expect(guardarUbicacionPunto('p1', { pos_x: 0.5 })).rejects.toThrow('juntas')
    await expect(guardarUbicacionPunto('p1', { pos_x: 0.5, pos_y: null })).rejects.toThrow('ambas')
    await expect(guardarUbicacionPunto('p1', {})).rejects.toThrow('No hay cambios')
    expect(llamadas).toHaveLength(0)
  })

  it('lanza un error claro si la base falla', async () => {
    fallas = { p1: { message: 'sin conexión' } }
    await expect(guardarUbicacionPunto('p1', { es_esencial: true })).rejects.toThrow(
      'No se pudo guardar la ubicación del punto: sin conexión',
    )
  })

  it('avisa si no se actualizó ninguna fila (punto inexistente o sin permiso)', async () => {
    sinFila = new Set(['p1'])
    await expect(guardarUbicacionPunto('p1', { es_esencial: true })).rejects.toThrow(
      'No se encontró el punto o no tienes permiso para editarlo.',
    )
  })

  it('validarCambioUbicacion devuelve solo los campos válidos', () => {
    expect(validarCambioUbicacion({ pos_x: 0, pos_y: 1, es_esencial: true })).toEqual({
      pos_x: 0,
      pos_y: 1,
      es_esencial: true,
    })
  })
})

describe('diferencia entre lo leído y lo editado', () => {
  it('sin diferencias no hay cambio', () => {
    expect(diferenciaUbicacion(original, { ...original })).toEqual({})
    // Una diferencia menor que lo que guarda la base no es un cambio.
    expect(diferenciaUbicacion(original, { ...original, pos_x: 0.1000001 })).toEqual({})
  })

  it('la posición viaja completa; es_esencial, aparte', () => {
    expect(diferenciaUbicacion(original, { ...original, pos_x: 0.5 })).toEqual({
      pos_x: 0.5,
      pos_y: 0.2,
    })
    expect(diferenciaUbicacion(original, { ...original, es_esencial: true })).toEqual({
      es_esencial: true,
    })
  })

  it('distingue ubicar un punto (de null a 0) y quitarle la ubicación', () => {
    const sinUbicar = { pos_x: null, pos_y: null, es_esencial: false }
    expect(diferenciaUbicacion(sinUbicar, { ...sinUbicar, pos_x: 0, pos_y: 0 })).toEqual({
      pos_x: 0,
      pos_y: 0,
    })
    expect(diferenciaUbicacion(original, { ...original, pos_x: null, pos_y: null })).toEqual({
      pos_x: null,
      pos_y: null,
    })
  })
})

describe('guardar varios puntos', () => {
  beforeEach(() => {
    llamadas.length = 0
    fallas = {}
    sinFila = new Set()
  })

  it('no manda a la base los puntos que no cambiaron y solo escribe lo que cambió', async () => {
    const resultado = await guardarUbicaciones([
      { id: 'quieto', original, nueva: { ...original } },
      { id: 'movido', original, nueva: { ...original, pos_x: 0.6, pos_y: 0.7 } },
      { id: 'clasificado', original, nueva: { ...original, es_esencial: true } },
    ])
    expect(resultado.sinCambios).toEqual(['quieto'])
    expect(llamadas.map((l) => [l.id, l.campos])).toEqual([
      ['movido', { pos_x: 0.6, pos_y: 0.7 }],
      ['clasificado', { es_esencial: true }],
    ])
    expect(resultado.guardados.map((g) => g.id)).toEqual(['movido', 'clasificado'])
    expect(resultado.fallidos).toEqual([])
  })

  it('con un fallo parcial informa qué se guardó y qué falló, sin revertir ni ocultar nada', async () => {
    fallas = { malo: { message: 'violación de restricción' } }
    sinFila = new Set(['sin-permiso'])
    const resultado = await guardarUbicaciones([
      { id: 'bueno', original, nueva: { ...original, es_esencial: true } },
      { id: 'malo', original, nueva: { ...original, pos_x: 0.9, pos_y: 0.9 } },
      { id: 'sin-permiso', original, nueva: { ...original, es_esencial: true } },
      { id: 'quieto', original, nueva: { ...original } },
    ])
    expect(resultado.guardados).toEqual([
      { id: 'bueno', ubicacion: { pos_x: 0.1, pos_y: 0.2, es_esencial: true } },
    ])
    expect(resultado.fallidos).toEqual([
      {
        id: 'malo',
        mensaje: 'No se pudo guardar la ubicación del punto: violación de restricción',
      },
      { id: 'sin-permiso', mensaje: 'No se encontró el punto o no tienes permiso para editarlo.' },
    ])
    expect(resultado.sinCambios).toEqual(['quieto'])
  })

  it('un punto con valores inválidos falla sin llamar a la base y no frena a los demás', async () => {
    const resultado = await guardarUbicaciones([
      { id: 'invalido', original, nueva: { ...original, pos_x: 1.5, pos_y: 0.5 } },
      { id: 'valido', original, nueva: { ...original, es_esencial: true } },
    ])
    expect(llamadas.map((l) => l.id)).toEqual(['valido'])
    expect(resultado.fallidos).toHaveLength(1)
    expect(resultado.fallidos[0]).toMatchObject({ id: 'invalido' })
    expect(resultado.fallidos[0]?.mensaje).toContain('entre 0 y 1')
    expect(resultado.guardados.map((g) => g.id)).toEqual(['valido'])
  })

  it('sin puntos editados no hace nada', async () => {
    expect(await guardarUbicaciones([])).toEqual({ guardados: [], fallidos: [], sinCambios: [] })
    expect(llamadas).toHaveLength(0)
  })
})
