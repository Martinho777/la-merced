// Formato del tiempo de la narración, aparte de la barra para poder probarlo sin DOM.

/** Segundos como "m:ss". Una duración desconocida o inválida no se muestra: devuelve null. */
export function formatearTiempo(segundos: number | null | undefined): string | null {
  if (segundos === null || segundos === undefined || !Number.isFinite(segundos) || segundos < 0) {
    return null
  }
  const total = Math.floor(segundos)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/** Avance de 0 a 100 para la línea de progreso. Sin duración conocida, 0: nunca se simula. */
export function porcentajeAvance(actual: number, duracion: number | null): number {
  if (!duracion || !Number.isFinite(duracion) || duracion <= 0) return 0
  return Math.min(100, Math.max(0, (actual / duracion) * 100))
}
