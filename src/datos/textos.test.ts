import { describe, expect, it, vi } from 'vitest'

let respuesta: { data: unknown; error: { message: string } | null }
const llamadas: unknown[][] = []

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (tabla: string) => {
      llamadas.push(['from', tabla])
      const consulta = {
        select: (columnas: string) => (llamadas.push(['select', columnas]), consulta),
        abortSignal: () => Promise.resolve(respuesta),
      }
      return consulta
    },
  },
}))

const { leerTextosInterfaz } = await import('@/datos/textos')

describe('leerTextosInterfaz', () => {
  it('lee clave, idioma y texto de textos_interfaz', async () => {
    respuesta = {
      data: [{ clave: 'comun.continuar', idioma: 'es', texto: 'Seguir' }],
      error: null,
    }

    await expect(leerTextosInterfaz()).resolves.toEqual([
      { clave: 'comun.continuar', idioma: 'es', texto: 'Seguir' },
    ])
    expect(llamadas).toContainEqual(['from', 'textos_interfaz'])
    expect(llamadas).toContainEqual(['select', 'clave, idioma, texto'])
  })

  it('lanza un error claro si la base falla', async () => {
    respuesta = { data: null, error: { message: 'sin conexión' } }
    await expect(leerTextosInterfaz()).rejects.toThrow(
      'No se pudieron leer los textos de la interfaz: sin conexión',
    )
  })
})
