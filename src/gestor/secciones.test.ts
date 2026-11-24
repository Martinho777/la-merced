import { describe, expect, it } from 'vitest'
import { RUTA_SECCION, seccionDe, seccionesVisibles } from '@/gestor/secciones'

describe('secciones del gestor', () => {
  it('editor y revisor ven Fichas y Ubicación; solo el admin ve además Textos', () => {
    expect(seccionesVisibles('editor')).toEqual(['fichas', 'ubicacion'])
    expect(seccionesVisibles('revisor')).toEqual(['fichas', 'ubicacion'])
    expect(seccionesVisibles('admin')).toEqual(['fichas', 'ubicacion', 'textos'])
  })

  it('sin rol no hay secciones', () => {
    expect(seccionesVisibles(null)).toEqual([])
  })

  it('cada sección tiene la ruta que le corresponde', () => {
    expect(RUTA_SECCION).toEqual({
      fichas: '/gestor',
      ubicacion: '/gestor/ubicaciones',
      textos: '/gestor/textos',
    })
  })

  it('la sección activa sale de la dirección', () => {
    expect(seccionDe('/gestor')).toBe('fichas')
    expect(seccionDe('/gestor/')).toBe('fichas')
    expect(seccionDe('/gestor/ubicaciones')).toBe('ubicacion')
    expect(seccionDe('/gestor/textos')).toBe('textos')
    expect(seccionDe('/gestor/textos/')).toBe('textos')
  })

  it('editar una ficha no es una sección de la barra', () => {
    expect(seccionDe('/gestor/punto/abc')).toBe('punto')
  })

  it('una dirección desconocida del gestor muestra la lista de fichas', () => {
    expect(seccionDe('/gestor/otra-cosa')).toBe('fichas')
    // No se confunde por prefijo con otra sección.
    expect(seccionDe('/gestor/ubicaciones-viejas')).toBe('fichas')
    expect(seccionDe('/gestor/puntos')).toBe('fichas')
  })
})
