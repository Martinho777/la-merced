import { describe, expect, it } from 'vitest'
import {
  construirInstantanea,
  esInstantanea,
  resumirInstantanea,
  serializarInstantanea,
  sha256,
  urlsDeMedios,
  type DatosPublicos,
  type FilaFichaPublica,
  type FilaPuntoPublico,
} from '@/publicacion/instantanea'

const aUrl = (ruta: string) => `https://medios.test/${ruta}`

const ficha = (idioma: string, estado: string, extra: Partial<FilaFichaPublica> = {}) => ({
  idioma,
  estado,
  titulo: `Portada ${idioma}`,
  que_ves: 'Qué ves',
  historia: 'Historia',
  dato_santi: null,
  transcripcion: `Transcripción ${idioma}`,
  audio_id: null,
  ...extra,
})

const medio = (id: string, tipo: string, idioma: string | null = null, orden = 0) => ({
  id,
  tipo,
  ruta: `${tipo === 'audio' ? 'audios' : 'fotos'}/${id}`,
  idioma,
  orden,
  credito: tipo === 'audio' ? null : 'Archivo X',
  fecha_original: '1920',
  derechos: 'Autorizada',
  duracion_s: tipo === 'audio' ? 42 : null,
  texto_alternativo: { es: 'Foto', en: 'Photo', fr: 'ignorado' },
})

const punto = (slug: string, orden: number, extra: Partial<FilaPuntoPublico> = {}) => ({
  id: `id-${slug}`,
  slug,
  orden,
  es_esencial: true,
  pos_x: 0.5,
  pos_y: 0.5,
  tiene_3d: false,
  zona: 'fachada-principal',
  fichas: [],
  medios: [],
  fuentes: [],
  ...extra,
})

const datos = (puntos: FilaPuntoPublico[]): DatosPublicos => ({
  zonas: [
    {
      slug: 'fachada-principal',
      orden: 1,
      disponible: true,
      usa_camara: true,
      contorno: { ruta: 'ilustraciones/contorno.svg' },
      ilustracion: null,
    },
  ],
  puntos,
  textos: [
    { clave: 'bienvenida.titulo', idioma: 'es', texto: '¡Hola!' },
    { clave: 'bienvenida.titulo', idioma: 'xx', texto: 'ignorado' },
  ],
})

const construir = (d: DatosPublicos) =>
  construirInstantanea(d, { version: 3, generadoEn: '2026-11-25T12:00:00.000Z', aUrl })

describe('instantánea de publicación', () => {
  it('solo incluye fichas aprobadas, en los tres idiomas, con su transcripción', () => {
    const inst = construir(
      datos([
        punto('portada', 1, {
          fichas: [ficha('es', 'aprobado'), ficha('cak', 'aprobado'), ficha('en', 'revision')],
        }),
      ]),
    )
    const [p] = inst.puntos
    expect(p?.fichas.map((f) => f.idioma)).toEqual(['es', 'cak'])
    expect(p?.fichas[1]?.transcripcion).toBe('Transcripción cak')
    expect(JSON.stringify(inst)).not.toContain('Portada en')
  })

  it('un borrador o una ficha en revisión nunca aparece, aunque la base la devolviera', () => {
    const inst = construir(
      datos([punto('a', 1, { fichas: [ficha('es', 'borrador'), ficha('en', 'revision')] })]),
    )
    expect(inst.puntos[0]?.fichas).toEqual([])
    expect(resumirInstantanea(inst).fichas).toBe(0)
  })

  it('sin ficha aprobada, el punto sale en el mapa pero sin fotos ni fuentes', () => {
    const inst = construir(
      datos([
        punto('a', 1, {
          fichas: [ficha('es', 'revision')],
          medios: [medio('f1', 'foto'), medio('h1', 'foto_historica')],
          fuentes: [{ nivel_confianza: 'documentado', nota: null, cita: 'Libro', url: null }],
        }),
      ]),
    )
    expect(inst.puntos[0]).toMatchObject({ slug: 'a', foto: null, archivo: [], fuentes: [] })
  })

  it('el audio solo se incluye si es el de la ficha y de su mismo idioma', () => {
    const inst = construir(
      datos([
        punto('a', 1, {
          fichas: [
            ficha('es', 'aprobado', { audio_id: 'au-es' }),
            ficha('en', 'aprobado', { audio_id: 'au-es' }), // apunta a un audio en español
          ],
          medios: [medio('au-es', 'audio', 'es'), medio('au-en', 'audio', 'en')],
        }),
      ]),
    )
    const [es, en] = inst.puntos[0]?.fichas ?? []
    expect(es?.audio).toEqual({ url: 'https://medios.test/audios/au-es', duracionS: 42 })
    expect(en?.audio).toBeNull()
    expect(urlsDeMedios(inst)).not.toContain('https://medios.test/audios/au-en')
  })

  it('incluye fotos con créditos, fuentes ordenadas por confianza y textos válidos', () => {
    const inst = construir(
      datos([
        punto('a', 1, {
          fichas: [ficha('es', 'aprobado')],
          medios: [
            medio('h2', 'foto_historica', null, 2),
            medio('f1', 'foto'),
            medio('h1', 'foto_historica', null, 1),
          ],
          fuentes: [
            { nivel_confianza: 'probable', nota: ' ', cita: 'B', url: '' },
            { nivel_confianza: 'documentado', nota: 'Nota', cita: 'A', url: 'https://a' },
          ],
        }),
      ]),
    )
    const [p] = inst.puntos
    expect(p?.foto).toMatchObject({
      credito: 'Archivo X',
      textoAlternativo: { es: 'Foto', en: 'Photo' },
    })
    expect(p?.archivo.map((r) => r.id)).toEqual(['h1', 'h2'])
    expect(p?.fuentes).toEqual([
      { cita: 'A', url: 'https://a', nivel: 'documentado', nota: 'Nota' },
      { cita: 'B', url: null, nivel: 'probable', nota: null },
    ])
    expect(inst.textos).toEqual([{ clave: 'bienvenida.titulo', idioma: 'es', texto: '¡Hola!' }])
    expect(inst.zonas[0]).toMatchObject({
      totalPuntos: 1,
      urlContorno: 'https://medios.test/ilustraciones/contorno.svg',
    })
  })

  it('no incluye datos privados: ni estados, ni procedencia, ni quién revisó', () => {
    const fila = { ...ficha('es', 'aprobado'), revisado_por: 'u1', procedencia: { archivo: 'x' } }
    const texto = serializarInstantanea(construir(datos([punto('a', 1, { fichas: [fila] })])))
    expect(texto).not.toMatch(/revisado_por|procedencia|"estado"|u1/)
  })

  it('es determinista: los mismos datos dan el mismo texto y la misma huella', async () => {
    const d = datos([punto('b', 2, { fichas: [ficha('es', 'aprobado')] }), punto('a', 1)])
    const uno = serializarInstantanea(construir(d))
    const dos = serializarInstantanea(construir(structuredClone(d)))
    expect(uno).toBe(dos)
    expect(await sha256(uno)).toBe(await sha256(dos))
    expect(JSON.parse(uno).puntos.map((p: { slug: string }) => p.slug)).toEqual(['a', 'b'])
  })

  it('calcula SHA-256 en hexadecimal', async () => {
    expect(await sha256('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
  })

  it('reconoce una instantánea válida y rechaza otra cosa', () => {
    expect(esInstantanea(construir(datos([])))).toBe(true)
    expect(esInstantanea('<!doctype html>')).toBe(false)
    expect(esInstantanea({ formato: 2, version: 1 })).toBe(false)
  })
})
