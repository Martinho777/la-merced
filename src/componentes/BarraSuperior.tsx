import { ChevronLeft, Languages } from 'lucide-react'
import './BarraSuperior.css'

type Props = {
  /** Etiqueta corta junto al chevron ("Mapa", "Zonas"). Sin `etiqueta` ni `onVolver` no hay botón de volver. */
  etiqueta?: string
  /** Nombre completo para lectores de pantalla ("Volver al mapa"); debe incluir la etiqueta visible. */
  etiquetaAccesible?: string
  onVolver?: () => void
  /** Botón discreto para cambiar de idioma, a la derecha. */
  idioma?: {
    /** Código visible ("ES", "CAK", "EN"). */
    codigo: string
    /** Nombre para lectores de pantalla ("Cambiar idioma. Idioma actual: Español"). */
    etiquetaAccesible: string
    onCambiar: () => void
  }
  /** Borde inferior, solo cuando el contenido pasa por debajo al hacer scroll. */
  conBorde?: boolean
}

export function BarraSuperior({
  etiqueta,
  etiquetaAccesible,
  onVolver,
  idioma,
  conBorde = false,
}: Props) {
  return (
    <header className={conBorde ? 'barra-superior barra-superior--con-borde' : 'barra-superior'}>
      {etiqueta && onVolver && (
        <button
          type="button"
          className="barra-superior__volver texto-body-strong"
          aria-label={etiquetaAccesible}
          onClick={onVolver}
        >
          <ChevronLeft className="barra-superior__chevron" aria-hidden="true" />
          {etiqueta}
        </button>
      )}
      {idioma && (
        <button
          type="button"
          className="barra-superior__idioma texto-small-strong"
          aria-label={idioma.etiquetaAccesible}
          onClick={idioma.onCambiar}
        >
          <Languages className="barra-superior__icono-idioma" aria-hidden="true" />
          {idioma.codigo}
        </button>
      )}
    </header>
  )
}
