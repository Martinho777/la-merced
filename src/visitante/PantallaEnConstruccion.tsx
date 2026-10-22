import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import '@/visitante/pantalla.css'

/** Pantalla temporal para /mapa, hasta que llegue la ilustración de la zona. Conserva ?zona= al volver. */
export function PantallaEnConstruccion() {
  const { t } = useTranslation()
  const { search } = useLocation()

  return (
    <div className="pantalla">
      <BarraVisitante
        volverA={`/camara${search}`}
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
