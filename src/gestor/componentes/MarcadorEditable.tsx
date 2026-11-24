import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import '@/componentes/MarcadorPunto.css'

type Props = {
  numero: number
  esencial: boolean
  seleccionado: boolean
  /** Posición sobre la ilustración, de 0 a 1. */
  x: number
  y: number
  /** Nombre completo con la clasificación en palabras. */
  etiquetaAccesible: string
  /** Mientras se guarda no se puede mover. */
  deshabilitado: boolean
  alSeleccionar: () => void
  /** Posición del puntero (en pantalla) a la que se arrastra el centro del marcador. */
  alArrastrar: (cliente: { x: number; y: number }) => void
  /** Mover con el teclado: desplazamiento en fracciones de la ilustración. */
  alDesplazar: (dx: number, dy: number) => void
}

const PASO = 0.01
const PASO_GRANDE = 0.05

/**
 * Marcador arrastrable del editor de ubicaciones. Se ve igual que el del mapa del visitante (mismas
 * clases: esencial sólido, opcional con anillo discontinuo) pero responde a Pointer Events, así que el
 * mismo código sirve para ratón, lápiz y dedo. También se mueve con las flechas del teclado.
 */
export function MarcadorEditable({
  numero,
  esencial,
  seleccionado,
  x,
  y,
  etiquetaAccesible,
  deshabilitado,
  alSeleccionar,
  alArrastrar,
  alDesplazar,
}: Props) {
  // Puntero que arrastra y cuánto separa el agarre del centro del marcador, para que no "salte".
  const arrastre = useRef<{ id: number; dx: number; dy: number } | null>(null)

  function alApoyar(evento: PointerEvent<HTMLButtonElement>) {
    if (evento.pointerType === 'mouse' && evento.button !== 0) return
    // La ilustración de abajo solo reacciona a toques en el vacío.
    evento.stopPropagation()
    alSeleccionar()
    if (deshabilitado) return
    const caja = evento.currentTarget.getBoundingClientRect()
    arrastre.current = {
      id: evento.pointerId,
      dx: evento.clientX - (caja.left + caja.width / 2),
      dy: evento.clientY - (caja.top + caja.height / 2),
    }
    evento.currentTarget.setPointerCapture(evento.pointerId)
  }

  function alMover(evento: PointerEvent<HTMLButtonElement>) {
    const actual = arrastre.current
    if (!actual || actual.id !== evento.pointerId) return
    alArrastrar({ x: evento.clientX - actual.dx, y: evento.clientY - actual.dy })
  }

  function alSoltar(evento: PointerEvent<HTMLButtonElement>) {
    if (arrastre.current?.id === evento.pointerId) arrastre.current = null
  }

  function alPulsarTecla(evento: KeyboardEvent<HTMLButtonElement>) {
    const paso = evento.shiftKey ? PASO_GRANDE : PASO
    const direccion: Record<string, [number, number]> = {
      ArrowLeft: [-paso, 0],
      ArrowRight: [paso, 0],
      ArrowUp: [0, -paso],
      ArrowDown: [0, paso],
    }
    const desplazamiento = direccion[evento.key]
    if (!desplazamiento || deshabilitado) return
    evento.preventDefault()
    alDesplazar(...desplazamiento)
  }

  const clases = [
    'marcador',
    'marcador-editable',
    esencial ? 'marcador--esencial' : 'marcador--opcional',
    seleccionado && 'marcador--seleccionado',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={clases}
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      aria-label={etiquetaAccesible}
      aria-pressed={seleccionado}
      onPointerDown={alApoyar}
      onPointerMove={alMover}
      onPointerUp={alSoltar}
      onPointerCancel={alSoltar}
      onClick={alSeleccionar}
      onKeyDown={alPulsarTecla}
    >
      <span className="marcador__disco texto-marker" aria-hidden="true">
        {numero}
      </span>
    </button>
  )
}
