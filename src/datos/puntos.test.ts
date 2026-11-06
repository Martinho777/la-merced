import { beforeEach, describe, expect, it, vi } from 'vitest'

// Cliente simulado: registra cada llamada del constructor de consultas y resuelve con `respuesta`.
const llamadas: { metodo: string; args: unknown[] }[] = []
let respuesta: { data: unknown; error: { message: string } | null }

function constructorDeConsulta() {
  const consulta: Record<string, unknown> = {}
  for (const metodo of ['select', 'eq', 'in', 'order']) {
    consulta[metodo] = (...args: unknown[]) => {
      llamadas.push({ metodo, args })
      return consulta
    }
  }
  consulta.then = (resolver: (valor: typeof respuesta) => unknown) => resolver(respuesta)
  return consulta
}

vi.mock('@/lib/storage', () => ({ urlPublica: (ruta: string) => `https://medios/${ruta}` }))
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (tabla: string) => {
      llamadas.push({ metodo: 'from', args: [tabla] })
      return constructorDeConsulta()
    },
  },
}))

const { mediosDePunto, obtenerPuntosDeZona } = await import('@/datos/puntos')

function ficha(idioma: 'es' | 'cak' | 'en', titulo: string) {
  return {
    idioma,
    titulo,
    que_ves: null,
    historia: null,
    dato_santi: null,
    transcripcion: null,
    audio_id: null,
  }
}

function punto(orden: number, fichas: ReturnType<typeof ficha>[]) {
  return {
    id: `id-${orden}`,
    slug: `punto-${orden}`,
    orden,
    es_esencial: false,
    pos_x: 0.5,
    pos_y: 0.5,
    tiene_3d: false,
    zonas: { slug: 'fachada-principal' },
    fichas,
    medios: [],
  }
}

function medio(id: string, tipo: 'foto' | 'foto_historica' | 'audio', orden = 1) {
  return {
    id,
    tipo,
    ruta: `${tipo}/${id}`,
    orden,
    credito: null,
    fecha_original: null,
    duracion_s: null,
    texto_alternativo: { es: `Texto de ${id}` },
  }
}

describe('mediosDePunto', () => {
  const aUrl = (ruta: string) => `/${ruta}`

  it('sin medios deja todo vacío', () => {
    expect(mediosDePunto([], null, 'es', aUrl)).toEqual({ foto: null, audio: null, archivo: [] })
  })

  it('reparte foto y archivo en orden, con texto alternativo por idioma', () => {
    const medios = mediosDePunto(
      [medio('h2', 'foto_historica', 2), medio('h1', 'foto_historica', 1), medio('f', 'foto')],
      null,
      'en',
      aUrl,
    )
    expect(medios.foto).toEqual({ url: '/foto/f', textoAlternativo: 'Texto de f' })
    expect(medios.archivo.map((r) => r.id)).toEqual(['h1', 'h2'])
  })

  it('el audio es solo el que indica la ficha', () => {
    const conAudio = { ...ficha('es', 'Con audio'), audio_id: 'a1' }
    const medios = [medio('a2', 'audio'), { ...medio('a1', 'audio'), duracion_s: 90 }]
    expect(mediosDePunto(medios, conAudio, 'es', aUrl).audio).toEqual({
      url: '/audio/a1',
      duracionS: 90,
    })
    expect(mediosDePunto(medios, ficha('es', 'Sin audio'), 'es', aUrl).audio).toBeNull()
  })
})

describe('obtenerPuntosDeZona', () => {
  beforeEach(() => {
    llamadas.length = 0
  })

  it('devuelve los puntos en el orden que entrega la base, pidiéndolos ordenados por orden', async () => {
    respuesta = {
      data: [punto(1, [ficha('es', 'Uno')]), punto(2, [ficha('es', 'Dos')])],
      error: null,
    }

    const puntos = await obtenerPuntosDeZona('fachada-principal', 'es')

    expect(puntos.map((p) => p.orden)).toEqual([1, 2])
    expect(puntos[0]).not.toHaveProperty('zonas')
    expect(puntos[0]).not.toHaveProperty('fichas')
    expect(llamadas).toContainEqual({ metodo: 'from', args: ['puntos'] })
    expect(llamadas).toContainEqual({ metodo: 'order', args: ['orden', { ascending: true }] })
    expect(llamadas).toContainEqual({ metodo: 'eq', args: ['zonas.slug', 'fachada-principal'] })
    expect(llamadas).toContainEqual({ metodo: 'eq', args: ['fichas.estado', 'aprobado'] })
  })

  it('usa la ficha del idioma pedido cuando existe', async () => {
    respuesta = {
      data: [punto(1, [ficha('es', 'Portada'), ficha('en', 'Portal')])],
      error: null,
    }

    const [primero] = await obtenerPuntosDeZona('fachada-principal', 'en')

    expect(primero?.ficha?.titulo).toBe('Portal')
    expect(llamadas).toContainEqual({ metodo: 'in', args: ['fichas.idioma', ['en', 'es']] })
  })

  it('cae a español cuando no hay ficha en el idioma pedido', async () => {
    respuesta = { data: [punto(1, [ficha('es', 'Portada')])], error: null }

    const [primero] = await obtenerPuntosDeZona('fachada-principal', 'cak')

    expect(primero?.ficha?.idioma).toBe('es')
    expect(primero?.ficha?.titulo).toBe('Portada')
  })

  it('deja la ficha en null si el punto no tiene ninguna aprobada', async () => {
    respuesta = { data: [punto(1, [])], error: null }

    const [primero] = await obtenerPuntosDeZona('fachada-principal', 'en')

    expect(primero?.ficha).toBeNull()
  })

  it('lanza un error claro si la consulta falla', async () => {
    respuesta = { data: null, error: { message: 'sin conexión' } }

    await expect(obtenerPuntosDeZona('fachada-principal', 'es')).rejects.toThrow(
      'No se pudieron leer los puntos de "fachada-principal": sin conexión',
    )
  })
})
