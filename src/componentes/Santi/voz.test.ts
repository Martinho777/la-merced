import { describe, expect, it } from 'vitest'
import { cuadroDeNivel, nivelRms, SuavizadorVoz } from '@/componentes/Santi/voz'

const silencio = new Uint8Array(256).fill(128)
const onda = (amplitud: number) =>
  Uint8Array.from({ length: 256 }, (_, i) => 128 + Math.round(amplitud * 127 * Math.sin(i / 4)))

describe('boca de Santi según el volumen', () => {
  it('el silencio tiene nivel 0 y una onda fuerte, cercano a 0,7', () => {
    expect(nivelRms(silencio)).toBe(0)
    expect(nivelRms([])).toBe(0)
    expect(nivelRms(onda(1))).toBeGreaterThan(0.65)
    expect(nivelRms(onda(1))).toBeLessThanOrEqual(1)
  })

  it('más volumen, más abierta la boca; en silencio, cerrada', () => {
    expect(cuadroDeNivel(0)).toBe(0)
    expect(cuadroDeNivel(0.1)).toBe(0)
    expect(cuadroDeNivel(0.3)).toBe(1)
    expect(cuadroDeNivel(0.6)).toBe(2)
    expect(cuadroDeNivel(0.9)).toBe(3)
    expect(cuadroDeNivel(Number.NaN)).toBe(0)
  })

  it('con una grabación baja la boca también se abre (se normaliza contra el pico)', () => {
    const suavizador = new SuavizadorVoz()
    let nivel = 0
    for (let i = 0; i < 30; i++) nivel = suavizador.siguiente(nivelRms(onda(0.15)))
    expect(cuadroDeNivel(nivel)).toBeGreaterThanOrEqual(2)
  })

  it('al callarse, la boca se cierra en pocos cuadros', () => {
    const suavizador = new SuavizadorVoz()
    for (let i = 0; i < 30; i++) suavizador.siguiente(nivelRms(onda(0.8)))
    let nivel = 1
    for (let i = 0; i < 12; i++) nivel = suavizador.siguiente(0)
    expect(cuadroDeNivel(nivel)).toBe(0)
  })
})
