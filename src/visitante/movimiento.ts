// Preferencia de movimiento reducido del dispositivo y tiempos que dependen de ella.

import { useSyncExternalStore } from 'react'

const CONSULTA = '(prefers-reduced-motion: reduce)'

function consultaDelNavegador(): MediaQueryList | null {
  return typeof window === 'undefined' || !window.matchMedia ? null : window.matchMedia(CONSULTA)
}

function suscribir(avisar: () => void): () => void {
  const consulta = consultaDelNavegador()
  consulta?.addEventListener('change', avisar)
  return () => consulta?.removeEventListener('change', avisar)
}

/** Si el dispositivo pide movimiento reducido. Se actualiza aunque cambie con la app abierta. */
export function useMovimientoReducido(): boolean {
  return useSyncExternalStore(
    suscribir,
    () => consultaDelNavegador()?.matches ?? false,
    () => false,
  )
}

/**
 * Cuánto se ve el acercamiento antes de pasar a la pantalla del punto (ms). Con movimiento normal es
 * la transición (--duration-slow, 280ms) más una pausa; con movimiento reducido el cambio es un corte
 * inmediato y solo queda la pausa, para que se note dónde quedó el mapa.
 */
export function esperaTrasEnfocar(movimientoReducido: boolean): number {
  return movimientoReducido ? 450 : 280 + 450
}
