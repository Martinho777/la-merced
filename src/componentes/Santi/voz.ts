// Del volumen de la narración a la boca de Santi, aparte del componente para probarlo sin DOM ni
// Web Audio. El analizador entrega muestras; aquí se convierten en un nivel de 0 a 1 y en un cuadro.

/**
 * Volumen (RMS) de un bloque de muestras de AnalyserNode.getByteTimeDomainData, de 0 a 1. El silencio
 * vale 128 en cada muestra; los extremos, 0 y 255.
 */
export function nivelRms(muestras: ArrayLike<number>): number {
  if (muestras.length === 0) return 0
  let suma = 0
  for (let i = 0; i < muestras.length; i++) {
    const valor = ((muestras[i] ?? 128) - 128) / 128
    suma += valor * valor
  }
  return Math.min(1, Math.sqrt(suma / muestras.length))
}

/**
 * Suaviza el nivel y lo normaliza contra el pico reciente, para que la boca se abra igual con una
 * grabación baja que con una alta: abre rápido, cierra un poco más lento y el pico decae solo.
 */
export class SuavizadorVoz {
  private nivel = 0
  private pico = 0.08

  siguiente(rms: number): number {
    const factor = rms > this.nivel ? 0.6 : 0.25
    this.nivel += (rms - this.nivel) * factor
    this.pico = Math.max(this.nivel, this.pico * 0.995, 0.08)
    return Math.min(1, this.nivel / this.pico)
  }
}

/** Por debajo de esto la boca queda cerrada (respiraciones, ruido de fondo). */
const UMBRAL_SILENCIO = 0.18

/**
 * Cuadro de habla para un nivel de 0 a 1: 0 es el pico cerrado y 1 a 3 aperturas cada vez mayores
 * (los cuadros talk-0 a talk-3 de src/assets/santi).
 */
export function cuadroDeNivel(nivel: number): 0 | 1 | 2 | 3 {
  if (!(nivel >= UMBRAL_SILENCIO)) return 0
  if (nivel < 0.45) return 1
  if (nivel < 0.75) return 2
  return 3
}
