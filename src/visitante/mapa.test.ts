import { describe, expect, it } from 'vitest'
import {
  estadoDePunto,
  numeroDeDetalle,
  progreso,
  puntosConPosicion,
  puntosDeRuta,
  rutaDeConfirmacion,
  rutaDePunto,
  siguientePunto,
  vecinosEnRuta,
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
    expect(rutaDeConfirmacion('fachada-principal', 'punto-3')).toBe(
      '/confirmacion?zona=fachada-principal&punto=punto-3',
    )
  })

  it('el identificador lleva dos cifras y no depende de la cantidad de puntos', () => {
    expect(numeroDeDetalle(5)).toBe('05')
    expect(numeroDeDetalle(12)).toBe('12')
    expect(numeroDeDetalle(120)).toBe('120')
  })
})

describe('anterior y siguiente', () => {
  const slugs = (v: ReturnType<typeof vecinosEnRuta>) => [v.anterior?.slug, v.siguiente?.slug]

  it('siguen el orden de la ruta aunque los datos vengan desordenados', () => {
    expect(slugs(vecinosEnRuta(puntos, 'recomendada', 'punto-2'))).toEqual(['punto-1', 'punto-3'])
    expect(slugs(vecinosEnRuta(puntos, 'libre', 'punto-3'))).toEqual(['punto-2', 'punto-4'])
  })

  it('el primero no tiene anterior y el último no tiene siguiente', () => {
    expect(slugs(vecinosEnRuta(puntos, 'recomendada', 'punto-1'))).toEqual([undefined, 'punto-2'])
    expect(slugs(vecinosEnRuta(puntos, 'recomendada', 'punto-4'))).toEqual(['punto-3', undefined])
  })

  it('la ruta esencial salta los opcionales', () => {
    expect(slugs(vecinosEnRuta(puntos, 'esencial', 'punto-2'))).toEqual([undefined, 'punto-3'])
    expect(slugs(vecinosEnRuta(puntos, 'esencial', 'punto-3'))).toEqual(['punto-2', undefined])
  })

  it('un punto fuera de la ruta usa el orden de todos, y uno inexistente no tiene vecinos', () => {
    expect(slugs(vecinosEnRuta(puntos, 'esencial', 'punto-1'))).toEqual([undefined, 'punto-2'])
    expect(slugs(vecinosEnRuta(puntos, 'libre', 'no-existe'))).toEqual([undefined, undefined])
  })
})
