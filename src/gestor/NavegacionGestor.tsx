import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'
import type { Rol } from '@/datos/sesion'
import { RUTA_SECCION, seccionDe, seccionesVisibles } from '@/gestor/secciones'

/**
 * Barra de secciones del gestor (Fichas, Ubicación y, solo para admin, Textos). Se oculta mientras se
 * edita una ficha, que tiene su propia barra con el botón de volver.
 */
export function NavegacionGestor({ rol }: { rol: Rol | null }) {
  const { t } = useTranslation('gestor')
  const { pathname } = useLocation()
  const actual = seccionDe(pathname)
  if (actual === 'punto') return null

  const secciones = seccionesVisibles(rol)
  if (secciones.length === 0) return null

  return (
    <nav className="gestor__navegacion" aria-label={t('navegacion.etiqueta')}>
      {secciones.map((seccion) => {
        const activa = seccion === actual
        return (
          <Link
            key={seccion}
            to={RUTA_SECCION[seccion]}
            className={
              activa
                ? 'gestor__seccion-enlace gestor__seccion-enlace--activo'
                : 'gestor__seccion-enlace'
            }
            aria-current={activa ? 'page' : undefined}
          >
            <span className="texto-button">{t(`navegacion.${seccion}`)}</span>
          </Link>
        )
      })}
    </nav>
  )
}
