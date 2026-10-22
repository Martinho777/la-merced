import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import { rutaConZona, zonaDeBusqueda } from '@/visitante/camara'
import '@/visitante/pantalla.css'

/**
 * Pantalla temporal para /punto?zona=…&punto=… (la ficha del punto llega en el próximo bloque).
 * Vuelve al mapa de la misma zona; sin zona, a elegir zona.
 */
export function PantallaEnConstruccion() {
  const { t } = useTranslation()
  const [parametros] = useSearchParams()
  const zona = zonaDeBusqueda(parametros)

  return (
    <div className="pantalla">
      {zona ? (
        <BarraVisitante
          volverA={rutaConZona('/mapa', zona)}
          etiqueta={t('navegacion.mapa')}
          etiquetaAccesible={t('navegacion.volverAlMapa')}
        />
      ) : (
        <BarraVisitante
          volverA="/zona"
          etiqueta={t('navegacion.zonas')}
          etiquetaAccesible={t('navegacion.volverAZonas')}
        />
      )}
      <div className="pantalla__cuerpo pantalla__cuerpo--centrado">
        <h1 className="pantalla__titulo texto-title-1">{t('enConstruccion.titulo')}</h1>
        <p className="pantalla__texto texto-body">{t('enConstruccion.texto')}</p>
      </div>
    </div>
  )
}
