import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useSearchParams } from 'react-router'
import { Boton } from '@/componentes/Boton'
import type { PuntoConFicha } from '@/datos/puntos'
import type { Recorrido } from '@/datos/recorrido'
import { idiomaActual } from '@/i18n'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import { rutaConZona, zonaDeBusqueda } from '@/visitante/camara'
import { PARAM_PUNTO } from '@/visitante/mapa'
import { useRecorrido } from '@/visitante/useRecorrido'
import '@/visitante/pantalla.css'

type Contexto = { zona: string; punto: PuntoConFicha; recorrido: Recorrido }

/**
 * Lo común de la confirmación y la ficha: lee zona y punto de la URL, carga el recorrido y muestra
 * sus estados. Sin zona vuelve a elegir zona; con un punto que no existe, al mapa de esa zona.
 */
export function PuntoDeRecorrido({ children }: { children: (contexto: Contexto) => ReactNode }) {
  const { t } = useTranslation()
  const [parametros] = useSearchParams()
  const zona = zonaDeBusqueda(parametros)
  const slugPunto = parametros.get(PARAM_PUNTO)
  const { estado, reintentar } = useRecorrido(zona, idiomaActual())

  if (!zona || estado.tipo === 'sinZona') return <Navigate to="/zona" replace />
  const rutaMapa = rutaConZona('/mapa', zona)

  if (estado.tipo !== 'listo') {
    return (
      <div className="pantalla">
        <BarraVisitante
          volverA={rutaMapa}
          etiqueta={t('navegacion.mapa')}
          etiquetaAccesible={t('navegacion.volverAlMapa')}
        />
        <div className="pantalla__cuerpo pantalla__cuerpo--centrado">
          {estado.tipo === 'cargando' ? (
            <p className="pantalla__texto texto-body" role="status">
              {t('comun.cargando')}
            </p>
          ) : (
            <div className="pantalla__estado" role="alert">
              <p className="pantalla__error texto-body">{t('punto.error')}</p>
              <Boton variante="secundario" tamano="sm" onClick={reintentar}>
                {t('comun.reintentar')}
              </Boton>
            </div>
          )}
        </div>
      </div>
    )
  }

  const punto = estado.recorrido.puntos.find((p) => p.slug === slugPunto)
  if (!punto) return <Navigate to={rutaMapa} replace />
  return children({ zona, punto, recorrido: estado.recorrido })
}
