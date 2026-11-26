import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { contar, importar, validarManifiesto, type Puertos } from '@/importacion/importar'

const MANIFIESTO = {
  entrega: { origen: 'URL', fecha: '2026-11-23' },
  fichas: [
    {
      numero: 7,
      zona: 'fachada-principal',
      esencial: true,
      idiomas: {
        es: { titulo: 'Nombre ES', que_ves: 'Qué ves', transcripcion: 'Texto exacto' },
        cak: { titulo: 'Nombre CAK' },
      },
      foto: { archivo: 'fotos/07.jpg', texto_alternativo: { es: 'Alt' }, credito: 'Autor' },
      fotos_historicas: [{ archivo: 'fotos/07-historica-1.jpg', texto_alternativo: { es: 'Alt' } }],
      fuentes: [{ cita: 'Actas del cabildo', tipo: 'archivo', nivel: 'documentado' }],
      audios: { es: 'audios/07-es.mp3' },
    },
  ],
}

const ARCHIVOS: Record<string, Uint8Array> = {
  'fotos/07.jpg': new Uint8Array([1, 2, 3]),
  'fotos/07-historica-1.jpg': new Uint8Array([4, 5, 6]),
  'audios/07-es.mp3': new Uint8Array([7, 8, 9]),
}

/** Una base en memoria que imita las tablas y el bucket. */
function base() {
  const puntos: { id: string; zonaId: string; orden: number; slug: string }[] = []
  const fichas: {
    id: string
    puntoId: string
    idioma: string
    estado: string
    audioId: string | null
  }[] = []
  const medios: { id: string; ruta: string; tipo: string; idioma: string | null }[] = []
  const fuentes: { id: string; cita: string }[] = []
  const vinculos = new Set<string>()
  const archivos = new Set<string>()
  let n = 0
  const id = () => `id-${++n}`
  const puertos: Puertos = {
    leerArchivo: async (ruta) => ARCHIVOS[ruta] ?? null,
    sha256: async (bytes) => createHash('sha256').update(bytes).digest('hex'),
    prepararFoto: async (bytes) => ({
      bytes,
      tipoMime: 'image/webp',
      extension: 'webp',
      ancho: 10,
      alto: 10,
    }),
    buscarZona: async (slug) => (slug === 'fachada-principal' ? { id: 'zona-1' } : null),
    buscarPunto: async (zonaId, orden) =>
      puntos.find((p) => p.zonaId === zonaId && p.orden === orden) ?? null,
    crearPunto: async ({ zonaId, orden, slug }) => {
      const p = { id: id(), zonaId, orden, slug }
      puntos.push(p)
      return p
    },
    buscarFicha: async (puntoId, idioma) =>
      fichas.find((f) => f.puntoId === puntoId && f.idioma === idioma) ?? null,
    crearFicha: async ({ puntoId, idioma, estado, audioId }) => {
      const f = { id: id(), puntoId, idioma, estado, audioId }
      fichas.push(f)
      return f
    },
    buscarMedioPorRuta: async (ruta) => medios.find((m) => m.ruta === ruta) ?? null,
    subirArchivo: async (ruta) => {
      if (archivos.has(ruta)) throw new Error('el archivo ya existe')
      archivos.add(ruta)
    },
    crearMedio: async ({ tipo, ruta, idioma }) => {
      const m = { id: id(), ruta, tipo, idioma }
      medios.push(m)
      return m
    },
    buscarFuente: async (cita) => fuentes.find((f) => f.cita === cita) ?? null,
    crearFuente: async ({ cita }) => {
      const f = { id: id(), cita }
      fuentes.push(f)
      return f
    },
    vincularFuente: async (puntoId, fuenteId) => {
      const clave = `${puntoId}:${fuenteId}`
      if (vinculos.has(clave)) return false
      vinculos.add(clave)
      return true
    },
  }
  return { puertos, puntos, fichas, medios, fuentes, archivos }
}

describe('validar el manifiesto de una entrega', () => {
  it('acepta una ficha bien formada', () => {
    const v = validarManifiesto(MANIFIESTO)
    expect(v.errores).toEqual([])
    expect(v.fichas).toHaveLength(1)
    expect(v.rechazadas).toEqual([])
  })

  it('rechaza la ficha mal formada sin detener las demás', () => {
    const v = validarManifiesto({
      ...MANIFIESTO,
      fichas: [
        ...MANIFIESTO.fichas,
        { numero: 0, zona: 'patio', idiomas: { fr: { titulo: 'x' } }, audios: { en: 'a.wav' } },
        {
          numero: 8,
          zona: 'fachada-principal',
          idiomas: { es: { titulo: 'Ocho' } },
          foto: { archivo: 'x.gif', texto_alternativo: {} },
          fuentes: [{ cita: 'C', tipo: 'blog', nivel: 'seguro' }],
          audios: { en: 'audios/08-en.mp3' },
        },
      ],
    })
    expect(v.fichas).toHaveLength(1)
    expect(v.rechazadas.map((r) => r.numero)).toEqual([0, 8])
    const errores = v.rechazadas.flatMap((r) => r.errores).join('\n')
    expect(errores).toMatch(/numero: entero/)
    expect(errores).toMatch(/zona: una de/)
    expect(errores).toMatch(/idioma desconocido/)
    expect(errores).toMatch(/MP3 o M4A/)
    expect(errores).toMatch(/formato no admitido \(x.gif\)/)
    expect(errores).toMatch(/texto_alternativo.es: es obligatorio/)
    expect(errores).toMatch(/nivel: uno de/)
    expect(errores).toMatch(/hay audio pero no ficha en ese idioma/)
  })

  it('exige saber de qué entrega viene y no admite números repetidos', () => {
    const v = validarManifiesto({ fichas: [MANIFIESTO.fichas[0], MANIFIESTO.fichas[0]] })
    expect(v.errores[0]).toMatch(/entrega/)
    expect(v.rechazadas[0]?.errores[0]).toMatch(/se repite/)
  })
})

describe('importar una entrega', () => {
  it('crea el punto, las fichas de los idiomas entregados en revisión, fotos, audio y fuente', async () => {
    const b = base()
    const resumen = await importar(validarManifiesto(MANIFIESTO), b.puertos)
    expect(resumen.errores).toEqual([])
    expect(contar(resumen)).toEqual({
      punto: { importados: 1, omitidos: 0, errores: 0 },
      ficha: { importados: 2, omitidos: 0, errores: 0 },
      foto: { importados: 2, omitidos: 0, errores: 0 },
      audio: { importados: 1, omitidos: 0, errores: 0 },
      fuente: { importados: 1, omitidos: 0, errores: 0 },
    })
    // Solo es y cak: el inglés no se entregó y no se inventa.
    expect(b.fichas.map((f) => [f.idioma, f.estado])).toEqual([
      ['es', 'revision'],
      ['cak', 'revision'],
    ])
    const audio = b.medios.find((m) => m.tipo === 'audio')
    expect(audio?.ruta).toMatch(/^audios\/fachada-principal-07-es-[0-9a-f]{16}\.mp3$/)
    expect(b.fichas.find((f) => f.idioma === 'es')?.audioId).toBe(audio?.id)
    expect(b.fichas.find((f) => f.idioma === 'cak')?.audioId).toBeNull()
  })

  it('repetirla no duplica fichas, archivos ni fuentes', async () => {
    const b = base()
    const validado = validarManifiesto(MANIFIESTO)
    await importar(validado, b.puertos)
    const antes = {
      puntos: b.puntos.length,
      fichas: b.fichas.length,
      medios: b.medios.length,
      archivos: b.archivos.size,
      fuentes: b.fuentes.length,
    }
    const segunda = await importar(validado, b.puertos)
    expect(segunda.importados).toEqual([])
    expect(segunda.errores).toEqual([])
    expect(segunda.omitidos.length).toBeGreaterThan(0)
    expect({
      puntos: b.puntos.length,
      fichas: b.fichas.length,
      medios: b.medios.length,
      archivos: b.archivos.size,
      fuentes: b.fuentes.length,
    }).toEqual(antes)
  })

  it('simular no escribe nada', async () => {
    const b = base()
    const resumen = await importar(validarManifiesto(MANIFIESTO), b.puertos, { simular: true })
    expect(resumen.importados.length).toBeGreaterThan(0)
    expect([b.puntos, b.fichas, b.medios, b.fuentes].every((t) => t.length === 0)).toBe(true)
    expect(b.archivos.size).toBe(0)
  })

  it('un archivo que falta se omite y se informa; lo demás se importa', async () => {
    const b = base()
    const sinAudio = structuredClone(MANIFIESTO)
    sinAudio.fichas[0]!.audios = { es: 'audios/no-existe.mp3' }
    const resumen = await importar(validarManifiesto(sinAudio), b.puertos)
    expect(resumen.omitidos).toContainEqual(
      expect.objectContaining({ tipo: 'audio', motivo: 'el archivo no está en la entrega' }),
    )
    expect(b.fichas).toHaveLength(2)
  })
})
