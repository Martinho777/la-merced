import { describe, expect, it } from 'vitest'
import {
  acotar,
  alternarZoom,
  enfocarPunto,
  escalas,
  mismaVista,
  mover,
  reajustar,
  traerAVista,
  vistaInicial,
  zoomEn,
  type Lienzo,
  type Vista,
} from '@/visitante/gestos'

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

/** Dónde queda en el lienzo un punto de la escena (x e y de 0 a 1). */
function enPantalla(vista: Vista, lienzoActual: Lienzo, x: number, y: number) {
  return {
    x: vista.x + x * lienzoActual.ancho * vista.escala,
    y: vista.y + (y * lienzoActual.ancho * vista.escala) / 2,
  }
}

describe('zoom automático a un punto', () => {
  it('acerca y deja el punto en el centro del lienzo', () => {
    const inicial = vistaInicial(lienzo)
    const vista = enfocarPunto(inicial, lienzo, 0.5, 0.5)
    expect(vista.escala).toBeGreaterThan(inicial.escala)
    expect(enPantalla(vista, lienzo, 0.5, 0.5).x).toBeCloseTo(164)
    expect(enPantalla(vista, lienzo, 0.5, 0.5).y).toBeCloseTo(240)
  })

  it('no aleja si ya se estaba más cerca, ni pasa del máximo', () => {
    const cerca = zoomEn(vistaInicial(lienzo), lienzo, { x: 164, y: 240 }, 100)
    expect(enfocarPunto(cerca, lienzo, 0.5, 0.5).escala).toBeCloseTo(maxima)
  })

  it('un punto en una esquina sigue dentro del lienzo, sin dejar huecos', () => {
    for (const [x, y] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0.02, 0.97],
    ] as const) {
      const vista = enfocarPunto(vistaInicial(lienzo), lienzo, x, y)
      const punto = enPantalla(vista, lienzo, x, y)
      expect(punto.x).toBeGreaterThanOrEqual(-0.01)
      expect(punto.x).toBeLessThanOrEqual(lienzo.ancho + 0.01)
      expect(punto.y).toBeGreaterThanOrEqual(-0.01)
      expect(punto.y).toBeLessThanOrEqual(lienzo.alto + 0.01)
      expect(vista).toEqual(acotar(vista, lienzo))
    }
  })

  it('traerAVista no mueve un punto visible y centra uno que quedó fuera', () => {
    const vista = enfocarPunto(vistaInicial(lienzo), lienzo, 0.5, 0.5)
    expect(traerAVista(vista, lienzo, 0.5, 0.5)).toBe(vista)
    const traida = traerAVista(vista, lienzo, 0.2, 0.5)
    expect(traida.escala).toBe(vista.escala)
    expect(enPantalla(traida, lienzo, 0.2, 0.5).x).toBeCloseTo(164)
  })
})

describe('cambio de tamaño del lienzo', () => {
  it('conserva en el centro el mismo lugar de la fachada', () => {
    const vista = enfocarPunto(vistaInicial(lienzo), lienzo, 0.5, 0.5)
    const grande = { ancho: 500, alto: 800 }
    const ajustada = reajustar(vista, lienzo, grande)
    expect(enPantalla(ajustada, grande, 0.5, 0.5).x).toBeCloseTo(250)
    expect(enPantalla(ajustada, grande, 0.5, 0.5).y).toBeCloseTo(400)
    expect(ajustada).toEqual(acotar(ajustada, grande))
  })

  it('la vista inicial sigue siendo la inicial con el nuevo tamaño', () => {
    const grande = { ancho: 500, alto: 700 }
    expect(mismaVista(reajustar(vistaInicial(lienzo), lienzo, grande), vistaInicial(grande))).toBe(
      true,
    )
  })

  it('desde un lienzo sin medir parte de la vista inicial', () => {
    const ajustada = reajustar({ escala: 1, x: 0, y: 0 }, { ancho: 0, alto: 0 }, lienzo)
    expect(mismaVista(ajustada, vistaInicial(lienzo))).toBe(true)
  })
})
