import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Boton } from '@/componentes/Boton'
import { Santi } from '@/componentes/Santi/Santi'
import { SantiBurbuja } from '@/componentes/SantiBurbuja'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import '@/visitante/pantalla.css'

/**
 * Pantalla 5 (/camara): Santi explica para qué es la cámara antes de pedir el permiso. El permiso
 * todavía no se pide (bloque 3): los dos botones llevan a pantallas en construcción.
 */
export function PantallaCamara() {
  const { t } = useTranslation()
  const navegar = useNavigate()

  return (
    <div className="pantalla">
      <BarraVisitante
        volverA="/zona"
        etiqueta={t('navegacion.zonas')}
        etiquetaAccesible={t('navegacion.volverAZonas')}
      />
      <div className="pantalla__cuerpo pantalla__cuerpo--centrado">
        <SantiBurbuja cola="abajo">{t('camara.explicacion')}</SantiBurbuja>
        <Santi pose="phone" tamano="lg" />
      </div>
      <div className="pantalla__acciones">
        <Boton anchoCompleto onClick={() => navegar('/alineacion')}>
          {t('camara.activar')}
        </Boton>
        <Boton variante="secundario" anchoCompleto onClick={() => navegar('/mapa')}>
          {t('camara.saltar')}
        </Boton>
      </div>
    </div>
  )
}
