import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { RUTA_INICIO, seccionDe } from '@/gestor/secciones'

/**
 * Botón «Inicio» del encabezado del gestor, a la izquierda: vuelve a las tareas desde cualquier
 * sección. No aparece en el inicio ni al editar una ficha, que tiene su propio botón para volver a la
 * lista de puntos.
 */
export function NavegacionGestor() {
  const { t } = useTranslation('gestor')
  const { pathname } = useLocation()
  const navegar = useNavigate()
  const actual = seccionDe(pathname)
  if (actual === 'inicio' || actual === 'punto') return null

  return (
    <Boton
      variante="secundario"
      tamano="sm"
      icono={ChevronLeft}
      className="gestor__inicio"
      aria-label={t('navegacion.inicioAccesible')}
      onClick={() => navegar(RUTA_INICIO)}
    >
      {t('navegacion.inicio')}
    </Boton>
  )
}
