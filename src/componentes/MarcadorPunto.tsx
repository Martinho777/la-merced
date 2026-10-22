import { Check } from 'lucide-react'
import './MarcadorPunto.css'

export type EstadoMarcador = 'esencial' | 'opcional' | 'visitado'

type Props = {
  numero: number
  estado: EstadoMarcador
  /** Siguiente punto de la ruta: halo y pulso suave (sin pulso con movimiento reducido). */
  siguiente?: boolean
  /** Posición sobre la ilustración, de 0 a 1. */
  x: number
  y: number
  /** Nombre completo con el estado en palabras ("Punto 7, Nicho central, esencial, no visitado"). */
  etiquetaAccesible: string
  onPresionar: () => void
}

/**
 * Marcador de punto del mapa (docs/diseno/componentes.md → Map point marker): disco de 36px con área
 * táctil de 48px. Esencial: disco sólido; opcional: anillo discontinuo; visitado: check. El estado
 * nunca depende solo del color.
 */
export function MarcadorPunto({
  numero,
  estado,
  siguiente = false,
  x,
  y,
  etiquetaAccesible,
  onPresionar,
}: Props) {
  const clases = ['marcador', `marcador--${estado}`, siguiente && 'marcador--siguiente']
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={clases}
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      aria-label={etiquetaAccesible}
      onClick={onPresionar}
    >
      <span className="marcador__disco texto-marker" aria-hidden="true">
        {estado === 'visitado' ? <Check className="marcador__check" /> : numero}
      </span>
    </button>
  )
}

/** Muestra de un marcador para la leyenda del mapa (sin número ni acción). */
export function MuestraMarcador({ estado }: { estado: EstadoMarcador }) {
  return (
    <span className={`marcador marcador--muestra marcador--${estado}`} aria-hidden="true">
      <span className="marcador__disco">
        {estado === 'visitado' && <Check className="marcador__check" />}
      </span>
    </span>
  )
}
