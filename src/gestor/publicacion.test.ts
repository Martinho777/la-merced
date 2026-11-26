import { describe, expect, it } from 'vitest'
import { comprobarDespliegue, LIMITE_MS } from '@/gestor/publicacion'

const esperada = { version: 5, sha256: 'a'.repeat(64) }

describe('comprobar que el despliegue lleva la publicación', () => {
  it('solo es «publicada» con la misma versión y la misma huella', () => {
    expect(comprobarDespliegue({ ...esperada, generadoEn: 'x' }, esperada, 1000)).toBe('publicada')
  })

  it('aceptar el despliegue no basta: mientras el sitio sirva otra versión, se espera', () => {
    expect(comprobarDespliegue({ version: 4, sha256: 'b', generadoEn: 'x' }, esperada, 1000)).toBe(
      'esperando',
    )
    expect(comprobarDespliegue(null, esperada, 1000)).toBe('esperando')
  })

  it('la misma versión con otra huella no cuenta (no es el JSON generado)', () => {
    expect(
      comprobarDespliegue({ version: 5, sha256: 'b'.repeat(64), generadoEn: 'x' }, esperada, 1000),
    ).toBe('esperando')
  })

  it('pasado el límite sin verla, vence', () => {
    expect(comprobarDespliegue(null, esperada, LIMITE_MS)).toBe('vencida')
  })
})
