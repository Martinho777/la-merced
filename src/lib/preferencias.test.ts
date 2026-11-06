import { describe, expect, it } from 'vitest'
import {
  claveCompletados,
  guardarAyudaMapaVista,
  guardarCompletados,
  guardarIdioma,
  guardarRuta,
  leerAyudaMapaVista,
  leerCompletados,
  leerIdioma,
  leerRuta,
} from '@/lib/preferencias'

/** Storage en memoria, como el localStorage de un navegador. */
function almacenEnMemoria() {
  const datos = new Map<string, string>()
  return {
    getItem: (clave: string) => datos.get(clave) ?? null,
    setItem: (clave: string, valor: string) => void datos.set(clave, valor),
  }
}

/** Storage que lanza en cada acceso, como Safari en modo privado o con el almacenamiento lleno. */
const almacenQueFalla = {
  getItem: (): string | null => {
    throw new DOMException('Acceso denegado', 'SecurityError')
  },
  setItem: (): void => {
    throw new DOMException('Cuota excedida', 'QuotaExceededError')
  },
}

describe('preferencias', () => {
  it('guarda y restaura el idioma', () => {
    const almacen = almacenEnMemoria()
    expect(leerIdioma(almacen)).toBeNull()
    guardarIdioma('cak', almacen)
    expect(leerIdioma(almacen)).toBe('cak')
    guardarIdioma('en', almacen)
    expect(leerIdioma(almacen)).toBe('en')
  })

  it('guarda y restaura la ruta', () => {
    const almacen = almacenEnMemoria()
    expect(leerRuta(almacen)).toBeNull()
    guardarRuta('esencial', almacen)
    expect(leerRuta(almacen)).toBe('esencial')
  })

  it('ignora valores guardados que no son válidos', () => {
    const almacen = almacenEnMemoria()
    almacen.setItem('la-merced:idioma', 'fr')
    almacen.setItem('la-merced:ruta', 'rapida')
    expect(leerIdioma(almacen)).toBeNull()
    expect(leerRuta(almacen)).toBeNull()
  })

  it('si localStorage lanza, no rompe nada y devuelve null', () => {
    expect(() => guardarIdioma('en', almacenQueFalla)).not.toThrow()
    expect(() => guardarRuta('libre', almacenQueFalla)).not.toThrow()
    expect(leerIdioma(almacenQueFalla)).toBeNull()
    expect(leerRuta(almacenQueFalla)).toBeNull()
  })

  it('sin almacenamiento disponible (null) también devuelve null', () => {
    expect(() => guardarIdioma('en', null)).not.toThrow()
    expect(leerIdioma(null)).toBeNull()
    expect(leerRuta(null)).toBeNull()
  })

  it('sin window (fuera del navegador) usa los valores por defecto sin lanzar', () => {
    expect(leerIdioma()).toBeNull()
    expect(() => guardarRuta('libre')).not.toThrow()
  })
})

describe('puntos completados', () => {
  it('se guardan por zona, sin mezclarse', () => {
    const almacen = almacenEnMemoria()
    guardarCompletados('fachada-principal', ['a', 'b'], almacen)
    guardarCompletados('interior', ['c'], almacen)
    expect(leerCompletados('fachada-principal', almacen)).toEqual(['a', 'b'])
    expect(leerCompletados('interior', almacen)).toEqual(['c'])
    expect(leerCompletados('fachada-secundaria', almacen)).toEqual([])
  })

  it.each([
    ['JSON roto', '{no es json'],
    ['un número', '3'],
    ['un objeto', '{"a":1}'],
    ['null', 'null'],
  ])('con datos dañados (%s) empieza de cero', (_nombre, guardado) => {
    const almacen = almacenEnMemoria()
    almacen.setItem(claveCompletados('z'), guardado)
    expect(leerCompletados('z', almacen)).toEqual([])
  })

  it('quita repetidos y lo que no es un identificador', () => {
    const almacen = almacenEnMemoria()
    almacen.setItem(claveCompletados('z'), '["a","a",3,null,"","b"]')
    expect(leerCompletados('z', almacen)).toEqual(['a', 'b'])
  })

  it('si localStorage lanza o no existe, no rompe nada', () => {
    expect(() => guardarCompletados('z', ['a'], almacenQueFalla)).not.toThrow()
    expect(leerCompletados('z', almacenQueFalla)).toEqual([])
    expect(leerCompletados('z', null)).toEqual([])
  })
})

describe('ayuda inicial del mapa', () => {
  it('se recuerda al cerrarla y es independiente del progreso', () => {
    const almacen = almacenEnMemoria()
    guardarCompletados('z', ['a'], almacen)
    expect(leerAyudaMapaVista(almacen)).toBe(false)
    guardarAyudaMapaVista(almacen)
    expect(leerAyudaMapaVista(almacen)).toBe(true)
    expect(leerCompletados('z', almacen)).toEqual(['a'])
  })

  it('si localStorage lanza, se muestra sin romper nada', () => {
    expect(() => guardarAyudaMapaVista(almacenQueFalla)).not.toThrow()
    expect(leerAyudaMapaVista(almacenQueFalla)).toBe(false)
  })
})
