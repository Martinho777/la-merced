import { useTranslation } from 'react-i18next'
import { Minus, Plus, RotateCcw, type LucideIcon } from 'lucide-react'

type Props = {
  puedeAcercar: boolean
  puedeAlejar: boolean
  puedeRestablecer: boolean
  onAcercar: () => void
  onAlejar: () => void
  onRestablecer: () => void
}

/**
 * Alternativa con botones a los gestos del mapa (docs/diseno/sistema-de-diseno.md → Touch and sizes).
 * Detiene `pointerdown` para que tocar un botón no empiece un gesto en el lienzo.
 */
export function ControlesMapa({
  puedeAcercar,
  puedeAlejar,
  puedeRestablecer,
  onAcercar,
  onAlejar,
  onRestablecer,
}: Props) {
  const { t } = useTranslation()

  const controles: { icono: LucideIcon; etiqueta: string; activo: boolean; accion: () => void }[] =
    [
      {
        icono: Plus,
        etiqueta: t('mapa.controles.acercar'),
        activo: puedeAcercar,
        accion: onAcercar,
      },
      { icono: Minus, etiqueta: t('mapa.controles.alejar'), activo: puedeAlejar, accion: onAlejar },
      {
        icono: RotateCcw,
        etiqueta: t('mapa.controles.restablecer'),
        activo: puedeRestablecer,
        accion: onRestablecer,
      },
    ]

  return (
    <div
      className="mapa__controles"
      role="group"
      aria-label={t('mapa.controles.titulo')}
      onPointerDown={(evento) => evento.stopPropagation()}
    >
      {controles.map(({ icono: Icono, etiqueta, activo, accion }) => (
        <button
          key={etiqueta}
          type="button"
          className="mapa__control"
          aria-label={etiqueta}
          disabled={!activo}
          onClick={accion}
        >
          <Icono className="mapa__control-icono" aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}
