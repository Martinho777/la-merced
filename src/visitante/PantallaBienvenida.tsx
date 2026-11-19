import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { UserCog } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { SantiAnimado } from '@/componentes/Santi/SantiAnimado'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import '@/visitante/pantalla.css'
import './PantallaBienvenida.css'

/** Pantalla 1 (/): Santi saluda. */
export function PantallaBienvenida() {
  const { t } = useTranslation()
  const navegar = useNavigate()

  return (
    <div className="pantalla bienvenida">
      <BarraVisitante />
      {/* Entrada discreta al gestor para el equipo (editores y revisores). */}
      <Link
        to="/gestor"
        className="bienvenida__acceso"
        aria-label={t('bienvenida.accesoEquipo')}
        title={t('bienvenida.accesoEquipo')}
      >
        <UserCog className="bienvenida__acceso-icono" aria-hidden="true" />
      </Link>
      <div className="pantalla__cuerpo pantalla__cuerpo--centrado">
        {/* Saluda después de entrar (la entrada es CSS; el saludo, GSAP sobre otro elemento). */}
        <SantiAnimado
          pose="wave-large"
          tamano="lg"
          animacion="saludo"
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
