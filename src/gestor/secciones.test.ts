import { describe, expect, it } from 'vitest'
import { RUTA_SECCION, seccionDe, seccionesVisibles } from '@/gestor/secciones'

describe('secciones del gestor', () => {
  it('editor y revisor ven Fichas, Ubicación y Faltantes; solo el admin ve Textos y Publicar', () => {
    expect(seccionesVisibles('editor')).toEqual(['fichas', 'ubicacion', 'faltantes'])
    expect(seccionesVisibles('revisor')).toEqual(['fichas', 'ubicacion', 'faltantes'])
    expect(seccionesVisibles('admin')).toEqual([
      'fichas',
      'ubicacion',
      'faltantes',
      'textos',
      'publicar',
    ])
  })

  it('sin rol no hay secciones', () => {
    expect(seccionesVisibles(null)).toEqual([])
  })

  it('cada sección tiene la ruta que le corresponde', () => {
    expect(RUTA_SECCION).toEqual({
      fichas: '/gestor/puntos',
      ubicacion: '/gestor/ubicaciones',
      faltantes: '/gestor/faltantes',
      textos: '/gestor/textos',
      publicar: '/gestor/publicar',
    })
  })

  it('la sección activa sale de la dirección', () => {
    expect(seccionDe('/gestor')).toBe('inicio')
    expect(seccionDe('/gestor/')).toBe('inicio')
    expect(seccionDe('/gestor/puntos')).toBe('fichas')
    expect(seccionDe('/gestor/ubicaciones')).toBe('ubicacion')
    expect(seccionDe('/gestor/textos')).toBe('textos')
    expect(seccionDe('/gestor/textos/')).toBe('textos')
    expect(seccionDe('/gestor/faltantes')).toBe('faltantes')
    expect(seccionDe('/gestor/publicar')).toBe('publicar')
  })

  it('editar una ficha no es una tarea del inicio', () => {
    expect(seccionDe('/gestor/punto/abc')).toBe('punto')
  })

  it('una dirección desconocida del gestor muestra el inicio', () => {
    expect(seccionDe('/gestor/otra-cosa')).toBe('inicio')
    // No se confunde por prefijo con otra sección.
    expect(seccionDe('/gestor/ubicaciones-viejas')).toBe('inicio')
  })
})
