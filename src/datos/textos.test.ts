import { beforeEach, describe, expect, it, vi } from 'vitest'

let respuesta: { data: unknown; error: { message: string } | null }
const llamadas: unknown[][] = []

// Consulta encadenable: anota cada llamada y, al esperarla, devuelve `respuesta`.
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (tabla: string) => {
      llamadas.push(['from', tabla])
      const consulta = {
        select: (columnas: string) => (llamadas.push(['select', columnas]), consulta),
        upsert: (fila: unknown, opciones: unknown) => (
          llamadas.push(['upsert', fila, opciones]),
          consulta
        ),
        delete: () => (llamadas.push(['delete']), consulta),
        eq: (columna: string, valor: unknown) => (llamadas.push(['eq', columna, valor]), consulta),
        abortSignal: () => consulta,
        then: (resolver: (r: typeof respuesta) => unknown) =>
          Promise.resolve(respuesta).then(resolver),
      }
      return consulta
    },
  },
}))

const { guardarTextoInterfaz, leerTextosInterfaz, restaurarTextoInterfaz } =
  await import('@/datos/textos')

beforeEach(() => {
  llamadas.length = 0
})

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

describe('guardarTextoInterfaz', () => {
  it('crea o reemplaza la fila de esa clave e idioma', async () => {
    respuesta = { data: null, error: null }
    const fila = { clave: 'idioma.titulo', idioma: 'cak' as const, texto: 'Texto del equipo' }

    await guardarTextoInterfaz(fila)

    expect(llamadas).toContainEqual(['from', 'textos_interfaz'])
    expect(llamadas).toContainEqual(['upsert', fila, { onConflict: 'clave,idioma' }])
  })

  it('lanza un error claro si la base lo rechaza (p. ej. sin rol admin)', async () => {
    respuesta = { data: null, error: { message: 'violates row-level security' } }
    await expect(
      guardarTextoInterfaz({ clave: 'idioma.titulo', idioma: 'es', texto: 'Hola' }),
    ).rejects.toThrow('No se pudo guardar el texto: violates row-level security')
  })
})

describe('restaurarTextoInterfaz', () => {
  it('borra solo la fila de esa clave e idioma', async () => {
    respuesta = { data: [{ clave: 'zona.titulo' }], error: null }

    await restaurarTextoInterfaz('zona.titulo', 'en')

    expect(llamadas).toContainEqual(['delete'])
    expect(llamadas).toContainEqual(['eq', 'clave', 'zona.titulo'])
    expect(llamadas).toContainEqual(['eq', 'idioma', 'en'])
  })

  it('avisa si la base no borró nada (sin permiso)', async () => {
    respuesta = { data: [], error: null }
    await expect(restaurarTextoInterfaz('zona.titulo', 'en')).rejects.toThrow(
      'No se pudo restaurar el texto: la base no lo borró',
    )
  })

  it('lanza un error claro si la base falla', async () => {
    respuesta = { data: null, error: { message: 'sin conexión' } }
    await expect(restaurarTextoInterfaz('zona.titulo', 'en')).rejects.toThrow(
      'No se pudo restaurar el texto: sin conexión',
    )
  })
})
