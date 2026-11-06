import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Boton } from '@/componentes/Boton'
import { Insignia } from '@/componentes/Insignia'
import { Santi } from '@/componentes/Santi/Santi'
import type { PuntoConFicha } from '@/datos/puntos'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import { rutaConZona } from '@/visitante/camara'
import { FotoReservada } from '@/visitante/FotoReservada'
import { numeroDeDetalle, rutaDePunto } from '@/visitante/mapa'
import { PuntoDeRecorrido } from '@/visitante/PuntoDeRecorrido'
import { recordarPuntoAbierto } from '@/visitante/sesionMapa'
import '@/visitante/pantalla.css'
import './PantallaPunto.css'

/**
 * Confirmación de un punto (/confirmacion?zona=…&punto=…): foto real con Santi al lado, para comprobar
 * que es el detalle que se quería tocar antes de abrir su ficha. Abrirla no completa el punto.
 */
export function PantallaConfirmacion() {
  return (
    <PuntoDeRecorrido>
      {({ zona, punto }) => <Confirmacion zona={zona} punto={punto} />}
    </PuntoDeRecorrido>
  )
}

function Confirmacion({ zona, punto }: { zona: string; punto: PuntoConFicha }) {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const rutaMapa = rutaConZona('/mapa', zona)
  const identificador = t('punto.identificador', { numero: numeroDeDetalle(punto.orden) })
  const nombre = punto.ficha?.titulo ?? identificador

  useEffect(() => recordarPuntoAbierto(zona, punto), [zona, punto])

  return (
    <div className="pantalla confirmacion">
      <BarraVisitante
        volverA={rutaMapa}
        etiqueta={t('navegacion.mapa')}
        etiquetaAccesible={t('navegacion.volverAlMapa')}
      />
      <div className="confirmacion__cuerpo">
        <div className="confirmacion__encabezado">
          <p className="confirmacion__intro texto-label">{t('punto.confirmacion.intro')}</p>
          <Insignia>{identificador}</Insignia>
        </div>

        <div className="confirmacion__escena">
          <div className="confirmacion__santi">
            <Santi pose="point" tamano="md" />
          </div>
          <FotoReservada imagen={punto.foto} className="confirmacion__foto" />
        </div>

        <div className="confirmacion__texto">
          <h1 className="confirmacion__titulo texto-title-1">{t('punto.confirmacion.titulo')}</h1>
          <p className="pantalla__texto texto-body">{t('punto.confirmacion.frase', { nombre })}</p>
        </div>
      </div>

      <div className="pantalla__acciones">
        <Boton anchoCompleto onClick={() => navegar(rutaDePunto(zona, punto.slug))}>
          {t('punto.confirmacion.verDetalle')}
        </Boton>
        <Boton variante="fantasma" destructivo anchoCompleto onClick={() => navegar(rutaMapa)}>
          {t('navegacion.volverAlMapa')}
        </Boton>
      </div>
    </div>
  )
}
