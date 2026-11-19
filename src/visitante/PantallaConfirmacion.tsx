import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Boton } from '@/componentes/Boton'
import { Insignia } from '@/componentes/Insignia'
import { SantiAnimado } from '@/componentes/Santi/SantiAnimado'
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
          <Insignia>{identificador}</Insignia>
        </div>

        <div className="confirmacion__escena">
          <div className="confirmacion__santi">
            <SantiAnimado pose="point" tamano="lg" animacion="senalar" />
          </div>
          <FotoReservada imagen={punto.foto} className="confirmacion__foto" />
        </div>

        {/* Solo la confirmación corta a la vista; el nombre del punto, para lectores de pantalla. */}
        <h1 className="confirmacion__titulo texto-title-1">
          {t('punto.confirmacion.pregunta')}
          <span className="visualmente-oculto"> {t('punto.confirmacion.frase', { nombre })}</span>
        </h1>
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
