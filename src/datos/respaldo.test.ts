import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  conRespaldo,
  leerInstantanea,
  origenDatos,
  puntosDesdeInstantanea,
  reiniciarRespaldo,
  zonaDesdeInstantanea,
  zonasDesdeInstantanea,
} from '@/datos/respaldo'
import { construirInstantanea, type Instantanea } from '@/publicacion/instantanea'

const INSTANTANEA: Instantanea = construirInstantanea(
  {
    zonas: [
      {
        slug: 'fachada-principal',
        orden: 1,
        disponible: true,
        usa_camara: true,
        contorno: null,
        ilustracion: { ruta: 'ilustraciones/f.webp', texto_alternativo: { es: 'Fachada' } },
      },
    ],
    puntos: [
      {
        id: 'p1',
        slug: 'portada',
        orden: 1,
        es_esencial: true,
        pos_x: 0.4,
        pos_y: 0.6,
        tiene_3d: false,
        zona: 'fachada-principal',
        fichas: [
          {
            idioma: 'es',
            estado: 'aprobado',
            titulo: 'Portada',
            que_ves: 'La portada',
            historia: null,
            dato_santi: 'Dato',
            transcripcion: 'Hola',
            audio_id: 'a1',
          },
        ],
        medios: [
          {
            id: 'a1',
            tipo: 'audio',
            ruta: 'audios/portada-es.mp3',
            idioma: 'es',
            orden: 0,
            credito: null,
            fecha_original: null,
            derechos: null,
            duracion_s: 30,
            texto_alternativo: {},
          },
        ],
        fuentes: [{ nivel_confianza: 'documentado', nota: null, cita: 'Libro', url: null }],
      },
    ],
    textos: [],
  },
  { version: 4, generadoEn: '2026-11-25T00:00:00.000Z', aUrl: (r) => `https://m/${r}` },
)

const leer = () => Promise.resolve(INSTANTANEA)

describe('respaldo estático', () => {
  beforeEach(() => reiniciarRespaldo())

  it('si la base responde, usa la base', async () => {
    const r = await conRespaldo(
      async () => 'base',
      () => 'respaldo',
      { leer },
    )
    expect(r).toBe('base')
    expect(origenDatos()).toBe('base')
  })

  it('si la base falla (caída simulada), usa la instantánea', async () => {
    const r = await conRespaldo(
      async () => {
        throw new Error('fetch failed')
      },
      (i) => `respaldo v${i.version}`,
      { leer },
    )
    expect(r).toBe('respaldo v4')
    expect(origenDatos()).toBe('respaldo')
  })

  it('si la base no responde a tiempo, cancela la consulta y usa la instantánea', async () => {
    let cancelada = false
    const r = await conRespaldo(
      (senal) =>
        new Promise<string>(() => {
          senal.addEventListener('abort', () => (cancelada = true))
        }),
      () => 'respaldo',
      { leer, espera: 20 },
    )
    expect(r).toBe('respaldo')
    expect(cancelada).toBe(true)
  })

  it('si tampoco hay respaldo, lanza el error de la base', async () => {
    await expect(
      conRespaldo(
        async () => {
          throw new Error('la base falló')
        },
        () => 'x',
        { leer: () => Promise.reject(new Error('sin archivo')) },
      ),
    ).rejects.toThrow('la base falló')
  })

  it('lee /respaldo/publicacion.json sin consultar la base y rechaza HTML', async () => {
    const llamar = vi.fn(async () => Response.json(INSTANTANEA))
    expect((await leerInstantanea(llamar as unknown as typeof fetch)).version).toBe(4)
    expect(llamar).toHaveBeenCalledWith('/respaldo/publicacion.json', { cache: 'no-cache' })

    reiniciarRespaldo()
    const html = vi.fn(async () => new Response('<!doctype html>', { status: 200 }))
    await expect(leerInstantanea(html as unknown as typeof fetch)).rejects.toThrow(
      'No hay respaldo estático',
    )
  })

  it('convierte la instantánea en lo que esperan las pantallas', () => {
    expect(zonasDesdeInstantanea(INSTANTANEA)[0]).toMatchObject({
      slug: 'fachada-principal',
      totalPuntos: 1,
      ilustracion: { url: 'https://m/ilustraciones/f.webp' },
    })
    expect(zonaDesdeInstantanea(INSTANTANEA, 'interior')).toBeNull()
    const [punto] = puntosDesdeInstantanea(INSTANTANEA, 'fachada-principal', 'cak')
    // Sin ficha en kaqchikel: español, como hace la base.
    expect(punto?.ficha).toMatchObject({ idioma: 'es', titulo: 'Portada', transcripcion: 'Hola' })
    expect(punto?.audio).toEqual({ url: 'https://m/audios/portada-es.mp3', duracionS: 30 })
    expect(punto?.fuentes).toEqual([{ cita: 'Libro', url: null, nivel: 'documentado', nota: null }])
  })
})
