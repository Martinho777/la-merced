import { useTranslation } from 'react-i18next'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import '@/visitante/pantalla.css'

/** Pantalla temporal para /alineacion y /mapa, hasta que llegue el bloque 3. */
export function PantallaEnConstruccion() {
  const { t } = useTranslation()

  return (
    <div className="pantalla">
      <BarraVisitante
        volverA="/camara"
        etiqueta={t('navegacion.camara')}
        etiquetaAccesible={t('navegacion.volverACamara')}
      />
      <div className="pantalla__cuerpo pantalla__cuerpo--centrado">
        <h1 className="pantalla__titulo texto-title-1">{t('enConstruccion.titulo')}</h1>
        <p className="pantalla__texto texto-body">{t('enConstruccion.texto')}</p>
      </div>
    </div>
  )
}
