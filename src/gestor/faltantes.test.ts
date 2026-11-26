import { describe, expect, it } from 'vitest'
import {
  aCsv,
  aMarkdown,
  faltantesDePunto,
  largoDispar,
  type FichaReporte,
  type PuntoReporte,
} from '@/gestor/faltantes'

const ficha = (
  idioma: FichaReporte['idioma'],
  extra: Partial<FichaReporte> = {},
): FichaReporte => ({
  idioma,
  estado: 'aprobado',
  titulo: 'Portada principal',
  que_ves: 'La portada.',
  historia: 'Historia.',
  dato_santi: 'Dato.',
  transcripcion: 'Texto.',
  audio: { idioma },
  ...extra,
})

const punto = (extra: Partial<PuntoReporte> = {}): PuntoReporte => ({
  id: 'p1',
  slug: 'portada',
  orden: 7,
  zona: 'fachada-principal',
  fichas: [ficha('es'), ficha('en'), ficha('cak')],
  fotos: [
    {
      tipo: 'foto',
      ruta: 'fotos/07.webp',
      textoAlternativo: { es: 'Portada', en: 'Portal', cak: 'x' },
      credito: 'Autor',
      fecha: null,
      derechos: null,
    },
  ],
  fuentes: [{ cita: 'Libro de actas', url: null, tipo: 'libro', nivel: 'documentado' }],
  ...extra,
})

const campos = (filas: ReturnType<typeof faltantesDePunto>) =>
  filas.map((f) => `${f.idioma}:${f.campo}`)

describe('reporte de faltantes', () => {
  it('una ficha completa solo pide la revisión lingüística del kaqchikel', () => {
    const filas = faltantesDePunto(punto())
    expect(campos(filas)).toEqual(['cak:Revisión lingüística'])
    expect(filas[0]).toMatchObject({
      numero: '07',
      titulo: 'Portada principal',
      gravedad: 'revision',
    })
  })

  it('señala traducciones, narraciones y transcripciones que faltan, por idioma', () => {
    const filas = faltantesDePunto(
      punto({
        fichas: [
          ficha('es', { audio: { idioma: 'es' }, transcripcion: null }),
          ficha('en', { audio: null, transcripcion: 'Texto' }),
        ],
      }),
    )
    expect(campos(filas)).toEqual(
      expect.arrayContaining([
        'es:Transcripción',
        'en:Narración (07-en.mp3)',
        'en:Narración',
        'cak:Ficha',
        'cak:Narración (07-cak.mp3)',
      ]),
    )
    expect(filas.find((f) => f.idioma === 'cak' && f.campo === 'Ficha')?.problema).toBe(
      'Falta la traducción al kaqchikel',
    )
  })

  it('detecta un audio de otro idioma', () => {
    const filas = faltantesDePunto(punto({ fichas: [ficha('es', { audio: { idioma: 'en' } })] }))
    expect(filas).toContainEqual(
      expect.objectContaining({ idioma: 'es', problema: 'El audio no es de este idioma' }),
    )
  })

  it('pide foto, fuentes y créditos de las fotos históricas', () => {
    const filas = faltantesDePunto(
      punto({
        fotos: [
          {
            tipo: 'foto_historica',
            ruta: 'h',
            textoAlternativo: { es: 'x' },
            credito: null,
            fecha: null,
            derechos: null,
          },
        ],
        fuentes: [],
      }),
    )
    expect(campos(filas)).toEqual(
      expect.arrayContaining([
        'todos:Foto del punto (07.jpg)',
        'todos:Crédito de 07-historica-1',
        'todos:Fecha de 07-historica-1',
        'todos:Permiso de 07-historica-1',
        'todos:Fuentes',
      ]),
    )
  })

  it('marca contenido de prueba, fichas sin aprobar y textos de largo muy distinto', () => {
    const largo = 'a'.repeat(200)
    const filas = faltantesDePunto(
      punto({
        fichas: [
          ficha('es', { titulo: 'Punto de prueba', historia: largo, estado: 'revision' }),
          ficha('en', { historia: 'short' }),
        ],
        fuentes: [{ cita: 'Fuente de prueba', url: null, tipo: 'archivo', nivel: 'documentado' }],
      }),
    )
    expect(filas.map((f) => f.problema)).toEqual(
      expect.arrayContaining([
        'Contenido de prueba, no material de la URL',
        'En revisión',
        'Es una fuente de prueba',
        'El largo difiere mucho del español: puede faltar o sobrar contenido',
      ]),
    )
  })

  it('compara largos solo cuando hay texto suficiente', () => {
    expect(largoDispar('corto', 'x')).toBe(false)
    expect(largoDispar('a'.repeat(100), 'a'.repeat(90))).toBe(false)
    expect(largoDispar('a'.repeat(100), 'a'.repeat(20))).toBe(true)
  })

  it('exporta CSV con BOM, comillas escapadas y una fila por faltante', () => {
    const filas = faltantesDePunto(punto({ fuentes: [] }))
    const csv = aCsv(filas)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv.split('\r\n')[0]).toBe(
      String.fromCharCode(0xfeff) +
        'Ficha,Título,Idioma,Campo o archivo,Problema,Acción requerida,Prioridad',
    )
    expect(csv.trim().split('\r\n')).toHaveLength(filas.length + 1)
    expect(aCsv([{ ...filas[0]!, problema: 'Dice "hola", y más' }])).toContain(
      '"Dice ""hola"", y más"',
    )
  })

  it('exporta Markdown con una tabla', () => {
    const md = aMarkdown(faltantesDePunto(punto()), '2026-11-25')
    expect(md).toContain('| Ficha | Título | Idioma |')
    expect(md).toContain('| 07 | Portada principal | cak | Revisión lingüística |')
  })
})
