import { useTranslation } from 'react-i18next'
import { Check } from 'lucide-react'
import { PASOS, type EstadoPaso, type Paso } from '@/gestor/pasos'

/**
 * Barra de pasos del editor: número y nombre de cada paso. El estado va en el círculo: check verde si
 * está listo, anillo naranja discontinuo si falta algo opcional y anillo rojo si falta algo
 * obligatorio (forma además de color), y en palabras para el lector de pantalla. Se puede saltar a cualquiera; el actual lleva
 * aria-current="step".
 */
export function PasosEditor({
  actual,
  estados,
  sinGuardar,
  alElegir,
}: {
  actual: Paso
  estados: Record<Paso, EstadoPaso>
  /** Paso con cambios sin guardar, para avisarlo en la barra. */
  sinGuardar: Paso | null
  alElegir: (paso: Paso) => void
}) {
  const { t } = useTranslation('gestor')

  return (
    <nav className="pasos" aria-label={t('pasos.titulo')}>
      <ol className="pasos__lista">
        {PASOS.map((paso, i) => {
          const estado = estados[paso]
          const clases = [
            'pasos__paso',
            `pasos__paso--${estado}`,
            paso === actual && 'pasos__paso--actual',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <li key={paso}>
              <button
                type="button"
                className={clases}
                aria-current={paso === actual ? 'step' : undefined}
                onClick={() => alElegir(paso)}
              >
                <span className="pasos__numero texto-small-strong" aria-hidden="true">
                  {estado === 'completo' ? <Check className="pasos__check" /> : i + 1}
                </span>
                <span className="pasos__nombre texto-body-strong">{t(`pasos.${paso}.nombre`)}</span>
                <span className="visualmente-oculto">
                  {': '}
                  {paso === sinGuardar
                    ? t('pasos.estado.sinGuardar')
                    : paso === 'revision' && estado === 'completo'
                      ? t('pasos.estado.publicada')
                      : t(`pasos.estado.${estado}`)}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
