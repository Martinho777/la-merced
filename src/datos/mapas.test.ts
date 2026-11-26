import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

const { problemaDeMapa } = await import('@/datos/mapas')
const { slugNuevo } = await import('@/datos/ubicaciones')

const imagen = (extra: Partial<Parameters<typeof problemaDeMapa>[0]> = {}) => ({
  tipo: 'image/webp',
  ancho: 3200,
  alto: 1600,
  descripcion: 'Ilustración de la fachada',
  ...extra,
})

describe('imagen nueva del mapa', () => {
  it('acepta WebP, JPG o PNG en proporción 2:1 con descripción', () => {
    expect(problemaDeMapa(imagen())).toBeNull()
    expect(problemaDeMapa(imagen({ tipo: 'image/jpeg' }))).toBeNull()
    expect(problemaDeMapa(imagen({ tipo: 'image/png', ancho: 2000, alto: 1010 }))).toBeNull()
  })

  it('rechaza otros formatos', () => {
    expect(problemaDeMapa(imagen({ tipo: 'image/gif' }))).toBe('formato')
    expect(problemaDeMapa(imagen({ tipo: 'image/svg+xml' }))).toBe('formato')
  })

  it('rechaza otra proporción: los puntos quedarían fuera de lugar', () => {
    expect(problemaDeMapa(imagen({ ancho: 1600, alto: 1200 }))).toBe('proporcion')
    expect(problemaDeMapa(imagen({ ancho: 3200, alto: 1400 }))).toBe('proporcion')
    expect(problemaDeMapa(imagen({ alto: 0 }))).toBe('proporcion')
  })

  it('pide la descripción para lectores de pantalla', () => {
    expect(problemaDeMapa(imagen({ descripcion: '  ' }))).toBe('sinDescripcion')
  })
})

describe('slug de un punto nuevo', () => {
  it('lleva la zona y un sufijo corto sin guiones', () => {
    expect(slugNuevo('fachada-principal', '1a2b3c4d-5e6f-7a8b-9c0d-ffffffffffff')).toBe(
      'fachada-principal-1a2b3c4d',
    )
    expect(slugNuevo('fachada-principal')).toMatch(/^fachada-principal-[0-9a-f]{8}$/)
  })
})
