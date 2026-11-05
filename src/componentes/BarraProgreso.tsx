import './BarraProgreso.css'

type Props = {
  valor: number
  maximo: number
  /** Contador visible, que también se anuncia ("3 / 12 detalles"). */
  contador: string
  /** Qué mide la barra, para lectores de pantalla ("Progreso del recorrido"). */
  etiquetaAccesible: string
  /** Lo que se anuncia si el contador solo no se entiende al oírlo ("3 de 12 puntos"). */
  valorAccesible?: string
}

export function BarraProgreso({
  valor,
  maximo,
  contador,
  etiquetaAccesible,
  valorAccesible,
}: Props) {
  const acotado = Math.min(Math.max(valor, 0), maximo)
  const porcentaje = maximo > 0 ? (acotado / maximo) * 100 : 0

  return (
    <div className="barra-progreso">
      <div
        className="barra-progreso__pista"
        role="progressbar"
        aria-label={etiquetaAccesible}
        aria-valuemin={0}
        aria-valuemax={maximo}
        aria-valuenow={acotado}
        aria-valuetext={valorAccesible ?? contador}
      >
        <div className="barra-progreso__relleno" style={{ width: `${porcentaje}%` }} />
      </div>
      <span className="barra-progreso__contador texto-small-strong" aria-hidden="true">
        {contador}
      </span>
    </div>
  )
}
