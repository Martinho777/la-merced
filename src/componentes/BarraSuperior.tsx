import { ChevronLeft } from 'lucide-react'
import './BarraSuperior.css'

type Props = {
  /** Etiqueta corta junto al chevron ("Mapa", "Zonas"). */
  etiqueta: string
  /** Nombre completo para lectores de pantalla ("Volver al mapa"). Si falta, se usa `etiqueta`. */
  etiquetaAccesible?: string
  onVolver: () => void
  /** Borde inferior, solo cuando el contenido pasa por debajo al hacer scroll. */
  conBorde?: boolean
}

export function BarraSuperior({ etiqueta, etiquetaAccesible, onVolver, conBorde = false }: Props) {
  return (
    <header className={conBorde ? 'barra-superior barra-superior--con-borde' : 'barra-superior'}>
      <button
        type="button"
        className="barra-superior__volver texto-body-strong"
        aria-label={etiquetaAccesible}
        onClick={onVolver}
      >
        <ChevronLeft className="barra-superior__chevron" aria-hidden="true" />
        {etiqueta}
      </button>
    </header>
  )
}
