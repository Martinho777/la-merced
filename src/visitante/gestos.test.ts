import { describe, expect, it } from 'vitest'
import { acotar, alternarZoom, escalas, mover, vistaInicial, zoomEn } from '@/visitante/gestos'

// Lienzo vertical típico: 328 × 480. La escena a escala 1 mide 328 × 164.
const lienzo = { ancho: 328, alto: 480 }
const { contener, cubrir, maxima } = escalas(lienzo)

describe('gestos del mapa', () => {
  it('en vertical, contener es escala 1 y cubrir llena el alto', () => {
    expect(contener).toBe(1)
    expect(cubrir).toBeCloseTo(480 / 164)
    expect(maxima).toBeCloseTo(cubrir * 3)
  })

  it('la vista inicial llena el lienzo, centrada en la fachada', () => {
    const vista = vistaInicial(lienzo)
    expect(vista.escala).toBeCloseTo(cubrir)
    expect(vista.y).toBeCloseTo(0)
    const anchoEscena = 328 * cubrir
    expect(vista.x).toBeCloseTo((328 - anchoEscena) / 2)
  })

  it('moverse no deja huecos: la fachada no se despega de los bordes', () => {
    const vista = vistaInicial(lienzo)
    const aLaDerecha = mover(vista, lienzo, 10000, 0)
    expect(aLaDerecha.x).toBe(0)
    const aLaIzquierda = mover(vista, lienzo, -10000, 0)
    expect(aLaIzquierda.x).toBeCloseTo(328 - 328 * cubrir)
    // En alto la escena cabe justo: no se mueve en vertical.
    expect(mover(vista, lienzo, 0, 500).y).toBeCloseTo(0)
  })

  it('pellizcar deja quieto el punto entre los dedos', () => {
    const vista = vistaInicial(lienzo)
    const punto = { x: 200, y: 240 }
    const antes = { x: (punto.x - vista.x) / vista.escala, y: (punto.y - vista.y) / vista.escala }
    const despues = zoomEn(vista, lienzo, punto, 1.5)
    expect(despues.escala).toBeCloseTo(vista.escala * 1.5)
    expect((punto.x - despues.x) / despues.escala).toBeCloseTo(antes.x)
    expect((punto.y - despues.y) / despues.escala).toBeCloseTo(antes.y)
  })

  it('el zoom no pasa de sus límites', () => {
    const vista = vistaInicial(lienzo)
    expect(zoomEn(vista, lienzo, { x: 0, y: 0 }, 100).escala).toBeCloseTo(maxima)
    expect(zoomEn(vista, lienzo, { x: 0, y: 0 }, 0.01).escala).toBeCloseTo(contener)
  })

  it('a escala "contener" la fachada entera se ve centrada', () => {
    const vista = acotar({ escala: contener, x: 50, y: 50 }, lienzo)
    expect(vista.x).toBe(0)
    expect(vista.y).toBeCloseTo((480 - 164) / 2)
  })

  it('el doble toque alterna entre la fachada entera y la vista que llena el lienzo', () => {
    const inicial = vistaInicial(lienzo)
    const entera = alternarZoom(inicial, lienzo, { x: 164, y: 240 })
    expect(entera.escala).toBeCloseTo(contener)
    const otraVez = alternarZoom(entera, lienzo, { x: 164, y: 240 })
    expect(otraVez.escala).toBeCloseTo(cubrir)
  })

  it('con un lienzo sin medir no divide entre cero', () => {
    expect(escalas({ ancho: 0, alto: 0 })).toEqual({ contener: 1, cubrir: 1, maxima: 1 })
  })
})
