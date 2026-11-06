import { beforeEach, describe, expect, it, vi } from 'vitest'

let respuesta: { data: unknown; error: { message: string } | null }

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: async () => respuesta,
    }),
  },
}))

const { fichasPorIdioma, listarPuntosGestor } = await import('@/datos/gestor')

function fila(id: string, orden: number, zona: string, zonaOrden: number, fichas: unknown[] = []) {
  return { id, slug: id, orden, zonas: { slug: zona, orden: zonaOrden }, fichas }
}

describe('datos del gestor', () => {
  beforeEach(() => {
    respuesta = { data: [], error: null }
  })

  it('reparte las fichas por idioma e ignora kaqchikel mientras no se edite en el gestor', () => {
    expect(
      fichasPorIdioma([
        { id: 'f1', idioma: 'es', estado: 'aprobado', titulo: 'Portada' },
        { id: 'f2', idioma: 'cak', estado: 'borrador', titulo: 'x' },
      ]),
    ).toEqual({ es: { id: 'f1', estado: 'aprobado', titulo: 'Portada' }, en: null })
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

  it('lanza un error claro si la consulta falla', async () => {
    respuesta = { data: null, error: { message: 'sin permiso' } }
    await expect(listarPuntosGestor()).rejects.toThrow(
      'No se pudieron leer los puntos: sin permiso',
    )
  })
})
