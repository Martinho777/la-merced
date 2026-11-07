import { beforeEach, describe, expect, it, vi } from 'vitest'

const llamadas: { metodo: string; args: unknown[] }[] = []
let errorInsert: { message: string } | null

function tabla() {
  const c: Record<string, unknown> = {}
  for (const metodo of ['insert', 'update', 'delete', 'eq', 'select']) {
    c[metodo] = (...args: unknown[]) => {
      llamadas.push({ metodo: `medios.${metodo}`, args })
      return c
    }
  }
  c.single = async () => {
    const fila = llamadas.find((l) => l.metodo === 'medios.insert')?.args[0] as object
    return errorInsert
      ? { data: null, error: errorInsert }
      : { data: { id: 'm1', orden: 0, ...fila }, error: null }
  }
  c.then = (resolver: (v: unknown) => unknown) => resolver({ error: null })
  return c
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => tabla(),
    storage: {
      from: () => ({
        upload: async (...args: unknown[]) => {
          llamadas.push({ metodo: 'storage.upload', args })
          return { error: null }
        },
        remove: async (...args: unknown[]) => {
          llamadas.push({ metodo: 'storage.remove', args })
          return { error: null }
        },
        getPublicUrl: (ruta: string) => ({ data: { publicUrl: `https://cdn/${ruta}` } }),
      }),
    },
  },
}))

const { borrarFoto, columnasDe, rutaNueva, subirFoto } = await import('@/datos/fotos')

const datos = {
  textoAlternativoEs: ' Portada de piedra ',
  textoAlternativoEn: '',
  credito: 'Archivo X',
  fechaOriginal: ' ',
  derechos: '',
}
const imagen = {
  archivo: new Blob(['x'], { type: 'image/webp' }),
  tipoMime: 'image/webp' as const,
  ancho: 2000,
  alto: 1500,
}

describe('fotos del gestor', () => {
  beforeEach(() => {
    llamadas.length = 0
    errorInsert = null
  })

  it('guarda el texto alternativo por idioma y deja vacíos los datos opcionales', () => {
    expect(columnasDe(datos)).toEqual({
      texto_alternativo: { es: 'Portada de piedra' },
      credito: 'Archivo X',
      fecha_original: null,
      derechos: null,
    })
    expect(columnasDe({ ...datos, textoAlternativoEn: 'Stone portal' }).texto_alternativo).toEqual({
      es: 'Portada de piedra',
      en: 'Stone portal',
    })
  })

  it('arma rutas únicas dentro de fotos/', () => {
    expect(rutaNueva('punto-1', 'foto', 'image/webp', 5)).toBe('fotos/punto-1-detalle-5.webp')
    expect(rutaNueva('punto-1', 'foto_historica', 'image/jpeg', 5)).toBe(
      'fotos/punto-1-historica-5.jpg',
    )
  })

  it('sube el archivo y registra la foto con sus medidas', async () => {
    const foto = await subirFoto({ id: 'p1', slug: 'punto-1' }, 'foto', imagen, datos, 0)
    expect(llamadas[0]?.metodo).toBe('storage.upload')
    expect(llamadas.find((l) => l.metodo === 'medios.insert')?.args[0]).toMatchObject({
      tipo: 'foto',
      punto_id: 'p1',
      ancho: 2000,
      alto: 1500,
    })
    expect(foto.url).toMatch(/^https:\/\/cdn\/fotos\/punto-1-detalle-\d+\.webp$/)
  })

  it('si el registro falla, borra el archivo subido', async () => {
    errorInsert = { message: 'violates check constraint' }
    await expect(
      subirFoto({ id: 'p1', slug: 'punto-1' }, 'foto_historica', imagen, datos, 1),
    ).rejects.toThrow('No se pudo registrar la foto')
    expect(llamadas.map((l) => l.metodo)).toContain('storage.remove')
  })

  it('no sube una foto sin texto alternativo en español', async () => {
    await expect(
      subirFoto({ id: 'p1', slug: 'p' }, 'foto', imagen, { ...datos, textoAlternativoEs: ' ' }, 0),
    ).rejects.toThrow('texto alternativo')
    expect(llamadas).toHaveLength(0)
  })

  it('borrar quita el registro y el archivo', async () => {
    await borrarFoto({ id: 'm1', ruta: 'fotos/a.webp' })
    expect(llamadas).toContainEqual({ metodo: 'medios.eq', args: ['id', 'm1'] })
    expect(llamadas).toContainEqual({ metodo: 'storage.remove', args: [['fotos/a.webp']] })
  })
})
