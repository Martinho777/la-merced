import { describe, expect, it } from 'vitest'
import { guardarIdioma, guardarRuta, leerIdioma, leerRuta } from '@/lib/preferencias'

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
