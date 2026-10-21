import type { ReactNode } from 'react'
import { Check, type LucideIcon } from 'lucide-react'
import { Insignia } from '@/componentes/Insignia'
import './Tarjeta.css'

type Props = {
  titulo: string
  subtitulo?: string
  /** Icono inicial (`icon-lg`). */
  icono?: LucideIcon
  /** Miniatura inicial, en lugar del icono. */
  miniatura?: { src: string; alt: string }
  /** Contenido final: un chevron o una insignia. */
  final?: ReactNode
  /** Si se pasa, toda la tarjeta es un botón. */
  onPresionar?: () => void
  /** Seleccionada (ruta, zona): borde `border-strong` y check, sin cambiar el fondo. Si se pasa
   *  (true o false), la tarjeta presionable se anuncia como botón de alternar. */
  seleccionada?: boolean
  /** Texto de la insignia de no disponible ("Próximamente"). Si se pasa, la tarjeta no es accionable. */
  etiquetaNoDisponible?: string
  /** Fuerza el estado presionado (solo para la página /estilos). */
  forzarPresionada?: boolean
}

export function Tarjeta({
  titulo,
  subtitulo,
  icono: Icono,
  miniatura,
  final,
  onPresionar,
  seleccionada,
  etiquetaNoDisponible,
  forzarPresionada = false,
}: Props) {
  const noDisponible = etiquetaNoDisponible !== undefined
  const presionable = onPresionar !== undefined && !noDisponible

  const clases = [
    'tarjeta',
    presionable && 'tarjeta--presionable',
    seleccionada && 'tarjeta--seleccionada',
    noDisponible && 'tarjeta--no-disponible',
  ]
    .filter(Boolean)
    .join(' ')

  const contenido = (
    <>
      <span className="tarjeta__contenido">
        {miniatura ? (
          <img className="tarjeta__miniatura" src={miniatura.src} alt={miniatura.alt} />
        ) : (
          Icono && <Icono className="tarjeta__icono" aria-hidden="true" />
        )}
        <span className="tarjeta__textos">
          <span className="tarjeta__titulo texto-heading">{titulo}</span>
          {subtitulo && <span className="tarjeta__subtitulo texto-small">{subtitulo}</span>}
        </span>
        {final && <span className="tarjeta__final">{final}</span>}
      </span>
      {seleccionada && <Check className="tarjeta__check" aria-hidden="true" />}
      {noDisponible && <Insignia className="tarjeta__insignia">{etiquetaNoDisponible}</Insignia>}
    </>
  )

  if (presionable) {
    return (
      <button
        type="button"
        className={clases}
        aria-pressed={seleccionada}
        data-presionado={forzarPresionada || undefined}
        onClick={onPresionar}
      >
        {contenido}
      </button>
    )
  }

  return <div className={clases}>{contenido}</div>
}
