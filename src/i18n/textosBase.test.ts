import i18next from 'i18next'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FilaTexto } from '@/datos/textos'
import en from './en.json'
import es from './es.json'
import { anidar, cargarTextosDeLaBase, leerCopia, marcadores, textosValidos } from './textosBase'

/** Instancia propia, con los mismos JSON que la app. */
function nuevaI18n() {
  const instancia = i18next.createInstance()
  void instancia.init({
    resources: { es: { translation: es }, en: { translation: en } },
    lng: 'es',
    fallbackLng: 'es',
    initAsync: false,
  })
  return instancia
}

/** Almacén en memoria en lugar de localStorage. */
function almacenFalso(inicial: Record<string, string> = {}) {
  const datos = new Map(Object.entries(inicial))
  return {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => void datos.set(clave, valor),
    datos,
  }
}

const fila = (clave: string, idioma: FilaTexto['idioma'], texto: string): FilaTexto => ({
  clave,
  idioma,
  texto,
})

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('validación de los textos de la base', () => {
  it('compara los marcadores sin importar el orden ni los espacios', () => {
    expect(marcadores('{{a}} y {{ b }}')).toBe(marcadores('{{b}} o {{a}}'))
    expect(marcadores('sin marcadores')).toBe('')
  })

  it('acepta un texto con clave conocida y los mismos marcadores', () => {
    const textos = textosValidos([
      fila('comun.continuar', 'es', 'Seguir'),
      fila('comun.cambiarIdioma', 'en', 'Language: {{idioma}}'),
    ])
    expect(textos).toEqual({
      es: { 'comun.continuar': 'Seguir' },
      en: { 'comun.cambiarIdioma': 'Language: {{idioma}}' },
    })
  })

  it('descarta claves que la app no usa, textos vacíos y marcadores distintos', () => {
    const textos = textosValidos([
      fila('pruebaRls.texto', 'es', 'x'),
      fila('comun.continuar', 'es', '   '),
      fila('comun.cambiarIdioma', 'es', 'Idioma: {{lengua}}'),
      fila('comun.cambiarIdioma', 'cak', 'Sin marcador'),
    ])
    expect(textos).toEqual({})
  })

  it('arma el árbol que espera i18next', () => {
    expect(anidar({ 'a.b': 'x', 'a.c': 'y', d: 'z' })).toEqual({ a: { b: 'x', c: 'y' }, d: 'z' })
  })
})

describe('carga de los textos de la base', () => {
  it('pone los textos de la base encima de los JSON y deja los demás como estaban', async () => {
    const i18n = nuevaI18n()
    const almacen = almacenFalso()

    const usada = await cargarTextosDeLaBase(
      i18n,
      () =>
        Promise.resolve([
          fila('comun.continuar', 'es', 'Seguir'),
          fila('comun.continuar', 'en', 'Go on'),
        ]),
      almacen,
    )

    expect(usada).toBe(true)
    expect(i18n.t('comun.continuar')).toBe('Seguir')
    expect(i18n.t('comun.continuar', { lng: 'en' })).toBe('Go on')
    expect(i18n.t('comun.reintentar')).toBe(es.comun.reintentar)
    expect(almacen.datos.get('la-merced:textos')).toContain('Seguir')
  })

  it('con la base caída la app sigue con los textos de los JSON, sin lanzar', async () => {
    const i18n = nuevaI18n()

    const usada = await cargarTextosDeLaBase(
      i18n,
      () => Promise.reject(new Error('sin conexión')),
      almacenFalso(),
    )

    expect(usada).toBe(false)
    expect(i18n.t('comun.continuar')).toBe(es.comun.continuar)
    expect(i18n.t('comun.continuar', { lng: 'en' })).toBe(en.comun.continuar)
  })

  it('con la base caída usa la última copia guardada en el dispositivo', async () => {
    const i18n = nuevaI18n()
    const almacen = almacenFalso({
      'la-merced:textos': JSON.stringify({ es: { 'comun.continuar': 'Seguir' } }),
    })

    await cargarTextosDeLaBase(i18n, () => Promise.reject(new Error('sin conexión')), almacen)

    expect(i18n.t('comun.continuar')).toBe('Seguir')
  })

  it('una copia dañada se ignora', () => {
    expect(leerCopia(almacenFalso({ 'la-merced:textos': '{no es json' }))).toBeNull()
    expect(leerCopia(null)).toBeNull()
  })
})
