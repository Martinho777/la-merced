import { describe, expect, it } from 'vitest'
import { esVistaPrevia, leerMensaje, PARAM_VISTA_PREVIA } from '@/i18n/vistaPrevia'

/** Ventana falsa: dentro de un iframe (padre distinto) o no, con una búsqueda en la URL. */
function ventana(busqueda: string, enIframe: boolean) {
  const propia = { location: { search: busqueda } } as unknown as Window & { parent: Window }
  propia.parent = enIframe ? ({} as Window) : propia
  return propia
}

describe('esVistaPrevia', () => {
  it('solo dentro de un iframe y con el parámetro', () => {
    expect(esVistaPrevia(ventana(`?${PARAM_VISTA_PREVIA}`, true))).toBe(true)
    expect(esVistaPrevia(ventana(`?zona=a&${PARAM_VISTA_PREVIA}=`, true))).toBe(true)
    expect(esVistaPrevia(ventana(`?${PARAM_VISTA_PREVIA}`, false))).toBe(false)
    expect(esVistaPrevia(ventana('', true))).toBe(false)
    expect(esVistaPrevia(undefined)).toBe(false)
  })
})

describe('leerMensaje', () => {
  it('acepta un mensaje de textos bien formado', () => {
    expect(
      leerMensaje({
        tipo: 'textos',
        idioma: 'en',
        textos: { 'zona.titulo': 'Pick' },
        resaltar: 'Pick',
      }),
    ).toEqual({ tipo: 'textos', idioma: 'en', textos: { 'zona.titulo': 'Pick' }, resaltar: 'Pick' })
  })

  it('descarta textos que no son cadenas y un resaltado vacío', () => {
    expect(
      leerMensaje({ tipo: 'textos', idioma: 'es', textos: { a: 'x', b: 3 }, resaltar: ' ' }),
    ).toEqual({ tipo: 'textos', idioma: 'es', textos: { a: 'x' }, resaltar: null })
  })

  it('rechaza lo que no es un mensaje del editor', () => {
    expect(leerMensaje(null)).toBeNull()
    expect(leerMensaje('textos')).toBeNull()
    expect(leerMensaje({ tipo: 'otro', idioma: 'es', textos: {} })).toBeNull()
    expect(leerMensaje({ tipo: 'textos', idioma: 'fr', textos: {} })).toBeNull()
    expect(leerMensaje({ tipo: 'textos', idioma: 'es', textos: null })).toBeNull()
  })
})
