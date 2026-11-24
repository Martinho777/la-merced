import { beforeEach, describe, expect, it, vi } from 'vitest'

// Sin Supabase real: solo se comprueba qué se manda a la función de la base y qué se hace con lo que
// responde. Que la función reordene de verdad y sea atómica solo se prueba en PostgreSQL (ver
// docs/ia/MIGRACION-S4B3-4-REORDENAR-PUNTOS.md).
const rpc = vi.fn()
vi.mock('@/lib/supabase', () => ({ supabase: { rpc: (...args: unknown[]) => rpc(...args) } }))

const { reordenarPuntos, validarReordenamiento } = await import('@/datos/reordenar')

const actual = ['a', 'b', 'c']

describe('validar un reordenamiento', () => {
  it('acepta cualquier permutación completa de los puntos de la zona', () => {
    expect(() => validarReordenamiento(actual, ['c', 'a', 'b'])).not.toThrow()
    expect(() => validarReordenamiento(actual, actual)).not.toThrow()
  })

  it('rechaza una lista vacía', () => {
    expect(() => validarReordenamiento(actual, [])).toThrow('vacía')
  })

  it('rechaza ids repetidos', () => {
    expect(() => validarReordenamiento(actual, ['a', 'a', 'b'])).toThrow('repite')
  })

  it('rechaza ids vacíos', () => {
    expect(() => validarReordenamiento(actual, ['a', '', 'b'])).toThrow('vacíos')
  })

  it('rechaza puntos que no son de la zona', () => {
    expect(() => validarReordenamiento(actual, ['a', 'b', 'x'])).toThrow(
      '1 punto(s) que no pertenecen',
    )
  })

  it('rechaza listas a las que les falta algún punto de la zona', () => {
    expect(() => validarReordenamiento(actual, ['a', 'b'])).toThrow('no incluye 1 punto(s)')
  })

  it('rechaza una lista con de más y de menos a la vez', () => {
    expect(() => validarReordenamiento(actual, ['a', 'b', 'x', 'y'])).toThrow('2 punto(s)')
  })
})

describe('reordenar los puntos de una zona', () => {
  beforeEach(() => rpc.mockReset())

  it('llama a la función reordenar_puntos con la zona y la lista completa', async () => {
    rpc.mockResolvedValue({
      data: [
        { punto_id: 'c', nuevo_orden: 1 },
        { punto_id: 'a', nuevo_orden: 3 },
        { punto_id: 'b', nuevo_orden: 4 },
      ],
      error: null,
    })
    const resultado = await reordenarPuntos('zona-1', ['c', 'a', 'b'], actual)
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('reordenar_puntos', {
      p_zona_id: 'zona-1',
      p_ids: ['c', 'a', 'b'],
    })
    expect(resultado).toEqual({
      cambio: true,
      puntos: [
        { id: 'c', orden: 1 },
        { id: 'a', orden: 3 },
        { id: 'b', orden: 4 },
      ],
    })
  })

  it('no llama a la base si el orden no cambió', async () => {
    expect(await reordenarPuntos('zona-1', ['a', 'b', 'c'], actual)).toEqual({
      cambio: false,
      puntos: [],
    })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('no llama a la base con una lista inválida', async () => {
    await expect(reordenarPuntos('zona-1', ['a', 'a', 'b'], actual)).rejects.toThrow('repite')
    await expect(reordenarPuntos('zona-1', ['a', 'b'], actual)).rejects.toThrow('no incluye')
    await expect(reordenarPuntos('zona-1', [], actual)).rejects.toThrow('vacía')
    expect(rpc).not.toHaveBeenCalled()
  })

  it('lanza el error de la base con un mensaje claro y no devuelve resultado parcial', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'No tienes permiso para reordenar puntos.' },
    })
    await expect(reordenarPuntos('zona-1', ['c', 'a', 'b'], actual)).rejects.toThrow(
      'No se pudieron reordenar los puntos: No tienes permiso para reordenar puntos.',
    )
  })

  it('no se fía de una respuesta que no tiene la forma esperada', async () => {
    rpc.mockResolvedValue({ data: { no: 'es una lista' }, error: null })
    await expect(reordenarPuntos('zona-1', ['c', 'a', 'b'], actual)).rejects.toThrow('inesperado')
    rpc.mockResolvedValue({ data: [{ punto_id: 'c' }], error: null })
    await expect(reordenarPuntos('zona-1', ['c', 'a', 'b'], actual)).rejects.toThrow('inesperado')
  })

  it('no toca el arreglo que recibe', async () => {
    rpc.mockResolvedValue({ data: [], error: null })
    const nuevos = ['c', 'a', 'b']
    await reordenarPuntos('zona-1', nuevos, actual)
    expect(nuevos).toEqual(['c', 'a', 'b'])
    expect(actual).toEqual(['a', 'b', 'c'])
  })
})
