// Secuencia de cuadros de habla de Santi, aparte del componente para poder probarla sin DOM.

/** Cada cuánto cambia la boca (ms): rápido, como al hablar. */
export const INTERVALO_HABLA_MS = 110

/** Cuánto habla Santi para un texto: unos 55 ms por letra, entre 1,5 y 5 segundos. */
export function duracionHabla(texto: string): number {
  return Math.min(5000, Math.max(1500, texto.length * 55))
}

// Orden de las bocas (índices sobre los cuadros [cerrada, 1, 2, 3, "o"]): variado para que no se
// note el ciclo. Nunca repite el mismo cuadro dos veces seguidas.
const PATRON = [1, 2, 3, 2, 4, 1, 3, 0, 2, 1, 4, 3, 0, 1, 2]

/**
 * Índices de cuadro, uno por intervalo, para hablar `duracionMs`. Siempre termina en el cuadro 0
 * (boca cerrada), que es el de reposo.
 */
export function secuenciaHabla(duracionMs: number, intervaloMs = INTERVALO_HABLA_MS): number[] {
  const pasos = Math.max(0, Math.round(duracionMs / intervaloMs))
  const secuencia = Array.from({ length: pasos }, (_, i) => PATRON[i % PATRON.length]!)
  return secuencia.at(-1) === 0 ? secuencia : [...secuencia, 0]
}
