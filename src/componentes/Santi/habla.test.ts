import { describe, expect, it } from 'vitest'
import { duracionHabla, INTERVALO_HABLA_MS, secuenciaHabla } from '@/componentes/Santi/habla'

describe('habla de Santi', () => {
  it('habla más tiempo cuanto más largo es el texto, dentro de sus límites', () => {
    expect(duracionHabla('¡Hola!')).toBe(1500)
    expect(duracionHabla('a'.repeat(60))).toBe(3300)
    expect(duracionHabla('a'.repeat(500))).toBe(5000)
  })

  it('la secuencia dura lo pedido y termina con la boca cerrada', () => {
    const secuencia = secuenciaHabla(2200)
    expect(secuencia).toHaveLength(Math.round(2200 / INTERVALO_HABLA_MS) + 1)
    expect(secuencia.at(-1)).toBe(0)
  })

  it('nunca repite la misma boca dos veces seguidas', () => {
    const secuencia = secuenciaHabla(5000)
    for (let i = 1; i < secuencia.length; i++) expect(secuencia[i]).not.toBe(secuencia[i - 1])
  })

  it('solo usa los cinco cuadros que hay (cerrada, tres aperturas y la "o")', () => {
    for (const cuadro of secuenciaHabla(5000)) expect(cuadro).toBeGreaterThanOrEqual(0)
    for (const cuadro of secuenciaHabla(5000)) expect(cuadro).toBeLessThanOrEqual(4)
  })

  it('sin duración, queda en reposo', () => {
    expect(secuenciaHabla(0)).toEqual([0])
  })
})
