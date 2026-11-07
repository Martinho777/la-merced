import { describe, expect, it } from 'vitest'
import { siguienteOrden } from '@/gestor/fotos'
import { esFormatoAceptado, LADO_MAXIMO, medidasReducidas } from '@/gestor/imagen'

describe('preparación de fotos', () => {
  it('reduce el lado más largo a 2000 px y conserva la proporción', () => {
    expect(medidasReducidas(4000, 3000)).toEqual({ ancho: LADO_MAXIMO, alto: 1500 })
    expect(medidasReducidas(3000, 6000)).toEqual({ ancho: 1000, alto: LADO_MAXIMO })
  })

  it('nunca agranda una imagen pequeña', () => {
    expect(medidasReducidas(800, 600)).toEqual({ ancho: 800, alto: 600 })
  })

  it('acepta JPEG, PNG y WebP; HEIC y TIFF no', () => {
    expect(esFormatoAceptado('image/jpeg')).toBe(true)
    expect(esFormatoAceptado('image/png')).toBe(true)
    expect(esFormatoAceptado('image/webp')).toBe(true)
    expect(esFormatoAceptado('image/heic')).toBe(false)
    expect(esFormatoAceptado('image/tiff')).toBe(false)
  })

  it('una foto histórica nueva va después de la última', () => {
    expect(siguienteOrden([])).toBe(0)
    expect(siguienteOrden([{ orden: 0 }, { orden: 3 }])).toBe(4)
  })
})
