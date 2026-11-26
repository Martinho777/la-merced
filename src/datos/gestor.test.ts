import { beforeEach, describe, expect, it, vi } from 'vitest'

let columnasPedidas = ''
let respuesta: { data: unknown; error: { message: string } | null }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: async (columnas: string) => {
        columnasPedidas = columnas
        return respuesta
      },
    }),
  },
}))

const { fichasPorIdioma, listarPuntosGestor } = await import('@/datos/gestor')

function fila(
  id: string,
  orden: number,
  zona: string,
  zonaOrden: number,
  fichas: unknown[] = [],
  extra: Record<string, unknown> = {},
) {
  return {
    id,
    slug: id,
    orden,
    pos_x: null,
    pos_y: null,
    es_esencial: false,
    zonas: { id: `id-${zona}`, slug: zona, orden: zonaOrden },
    fichas,
    ...extra,
  }
}

describe('datos del gestor', () => {
  beforeEach(() => {
    respuesta = { data: [], error: null }
  })

  it('reparte las fichas por idioma, kaqchikel incluido, y deja null el que falta', () => {
    expect(
      fichasPorIdioma([
        { id: 'f1', idioma: 'es', estado: 'aprobado', titulo: 'Portada' },
        { id: 'f2', idioma: 'cak', estado: 'revision', titulo: 'x' },
      ]),
    ).toEqual({
      es: { id: 'f1', estado: 'aprobado', titulo: 'Portada' },
      en: null,
      cak: { id: 'f2', estado: 'revision', titulo: 'x' },
    })
  })

  it('ordena por zona y luego por número de punto', async () => {
    respuesta = {
      data: [
        fila('interior-1', 1, 'interior', 3),
        fila('principal-2', 2, 'fachada-principal', 1),
        fila('principal-1', 1, 'fachada-principal', 1),
      ],
      error: null,
    }
    const puntos = await listarPuntosGestor()
    expect(puntos.map((p) => p.id)).toEqual(['principal-1', 'principal-2', 'interior-1'])
  })

  it('entrega lo que el editor de ubicaciones necesita de cada punto', async () => {
    respuesta = {
      data: [
        fila('principal-1', 4, 'fachada-principal', 1, [], {
          pos_x: 0.25,
          pos_y: 0.75,
          es_esencial: true,
        }),
      ],
      error: null,
    }
    const [punto] = await listarPuntosGestor()
    expect(punto).toMatchObject({
      id: 'principal-1',
      slug: 'principal-1',
      orden: 4,
      zona: { id: 'id-fachada-principal', slug: 'fachada-principal', orden: 1 },
      pos_x: 0.25,
      pos_y: 0.75,
      es_esencial: true,
      fichas: { es: null, en: null, cak: null },
    })
    for (const columna of ['pos_x', 'pos_y', 'es_esencial', 'zonas!inner(id,']) {
      expect(columnasPedidas).toContain(columna)
    }
  })

  it('conserva los puntos sin posición, con las coordenadas en null (sin inventar valores)', async () => {
    respuesta = {
      data: [
        fila('sin-ubicar', 1, 'interior', 3),
        fila('en-origen', 2, 'interior', 3, [], { pos_x: 0, pos_y: 0 }),
      ],
      error: null,
    }
    const puntos = await listarPuntosGestor()
    expect(puntos).toHaveLength(2)
    expect(puntos[0]).toMatchObject({ id: 'sin-ubicar', pos_x: null, pos_y: null })
    // 0 es una posición válida (esquina), distinta de "sin ubicar".
    expect(puntos[1]).toMatchObject({ id: 'en-origen', pos_x: 0, pos_y: 0 })
  })

  it('sigue entregando lo que ya usa la lista del gestor (zona, orden y fichas)', async () => {
    respuesta = {
      data: [
        fila('principal-1', 1, 'fachada-principal', 1, [
          { id: 'f1', idioma: 'es', estado: 'aprobado', titulo: 'Portada' },
        ]),
      ],
      error: null,
    }
    const [punto] = await listarPuntosGestor()
    expect(punto?.zona.slug).toBe('fachada-principal')
    expect(punto?.fichas.es).toEqual({ id: 'f1', estado: 'aprobado', titulo: 'Portada' })
    expect(punto?.fichas.en).toBeNull()
  })

  it('lanza un error claro si la consulta falla', async () => {
    respuesta = { data: null, error: { message: 'sin permiso' } }
    await expect(listarPuntosGestor()).rejects.toThrow(
      'No se pudieron leer los puntos: sin permiso',
    )
  })
})
