import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Boton } from '@/componentes/Boton'
import { Santi } from '@/componentes/Santi/Santi'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import '@/visitante/pantalla.css'
import './PantallaBienvenida.css'

/** Pantalla 1 (/): Santi saluda. */
export function PantallaBienvenida() {
  const { t } = useTranslation()
  const navegar = useNavigate()

  return (
    <div className="pantalla">
      <BarraVisitante />
      <div className="pantalla__cuerpo pantalla__cuerpo--centrado">
        <Santi
          pose="wave-large"
          tamano="lg"
          className="bienvenida__entrada bienvenida__entrada--santi"
        />
        <h1 className="pantalla__titulo texto-display bienvenida__entrada bienvenida__entrada--2">
          {t('bienvenida.titulo')}
        </h1>
        <p className="pantalla__texto texto-body-lg bienvenida__entrada bienvenida__entrada--3">
          {t('bienvenida.subtitulo')}
        </p>
      </div>
      <div className="pantalla__acciones bienvenida__entrada bienvenida__entrada--4">
        <Boton anchoCompleto onClick={() => navegar('/idioma')}>
          {t('bienvenida.empezar')}
        </Boton>
      </div>
    </div>
  )
}
