import { describe, expect, it } from 'vitest'
import {
  estadoDePunto,
  progreso,
  puntosConPosicion,
  puntosDeRuta,
  rutaDePunto,
  siguientePunto,
} from '@/visitante/mapa'

const punto = (orden: number, esEsencial: boolean, pos: number | null = 0.5) => ({
  slug: `punto-${orden}`,
  orden,
  es_esencial: esEsencial,
  pos_x: pos,
  pos_y: pos,
})

// Desordenados a propósito: el mapa siempre trabaja por `orden`.
const puntos = [punto(3, true), punto(1, false), punto(2, true), punto(4, false, null)]
const ninguno = new Set<string>()

describe('mapa', () => {
  it('la ruta esencial solo cuenta los puntos esenciales, en orden', () => {
    expect(puntosDeRuta(puntos, 'esencial').map((p) => p.orden)).toEqual([2, 3])
  })

  it('la recomendada y la libre cuentan todos los puntos, en orden', () => {
    expect(puntosDeRuta(puntos, 'recomendada').map((p) => p.orden)).toEqual([1, 2, 3, 4])
    expect(puntosDeRuta(puntos, 'libre').map((p) => p.orden)).toEqual([1, 2, 3, 4])
  })

  it('el siguiente punto es el primero sin visitar de la ruta', () => {
    expect(siguientePunto(puntos, 'recomendada', ninguno)?.orden).toBe(1)
    expect(siguientePunto(puntos, 'esencial', ninguno)?.orden).toBe(2)
    expect(siguientePunto(puntos, 'recomendada', new Set(['punto-1', 'punto-2']))?.orden).toBe(3)
  })

  it('la ruta libre no tiene siguiente punto, y una ruta completa tampoco', () => {
    expect(siguientePunto(puntos, 'libre', ninguno)).toBeNull()
    expect(siguientePunto(puntos, 'esencial', new Set(['punto-2', 'punto-3']))).toBeNull()
  })

  it('el estado de un punto: visitado gana; si no, esencial u opcional', () => {
    expect(estadoDePunto(punto(1, true), ninguno)).toBe('esencial')
    expect(estadoDePunto(punto(1, false), ninguno)).toBe('opcional')
    expect(estadoDePunto(punto(1, true), new Set(['punto-1']))).toBe('visitado')
  })

  it('el progreso cuenta solo los puntos de la ruta', () => {
    const visitados = new Set(['punto-1', 'punto-2'])
    expect(progreso(puntos, 'recomendada', visitados)).toEqual({ visitados: 2, total: 4 })
    expect(progreso(puntos, 'esencial', visitados)).toEqual({ visitados: 1, total: 2 })
  })

  it('solo se dibujan los puntos con posición', () => {
    expect(puntosConPosicion(puntos).map((p) => p.orden)).toEqual([3, 1, 2])
  })

  it('la ruta de un punto lleva la zona y el punto', () => {
    expect(rutaDePunto('fachada-principal', 'punto-3')).toBe(
      '/punto?zona=fachada-principal&punto=punto-3',
    )
  })
})
