import { useTranslation } from 'react-i18next'

/**
 * Línea de avance de la ficha: verde, de borde a borde de la pantalla y pegada arriba, crece a
 * medida que se llenan los campos. Se anuncia como barra de progreso con "6 de 9 listos".
 */
export function BarraAvance({ hechos, total }: { hechos: number; total: number }) {
  const { t } = useTranslation('gestor')
  const porcentaje = total > 0 ? Math.round((hechos / total) * 100) : 0

  return (
    <div
      className="barra-avance"
      role="progressbar"
      aria-label={t('avance.etiqueta')}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={hechos}
      aria-valuetext={t('avance.valor', { hechos, total })}
    >
      <div className="barra-avance__relleno" style={{ width: `${porcentaje}%` }} />
    </div>
  )
}
