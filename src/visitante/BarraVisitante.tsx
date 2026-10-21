import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { BarraSuperior } from '@/componentes/BarraSuperior'
import { idiomaActual } from '@/i18n'

type Props = {
  /** Ruta a la que lleva el botón de volver. Sin ella no hay botón de volver. */
  volverA?: string
  /** Etiqueta visible del botón de volver ("Idioma", "Zonas"). */
  etiqueta?: string
  /** Nombre del botón de volver para lectores de pantalla. */
  etiquetaAccesible?: string
  /** Oculta el botón de idioma (en /idioma, que ya es la pantalla de idioma). */
  sinIdioma?: boolean
}

/**
 * BarraSuperior de las pantallas del visitante, con la navegación ya conectada. El botón de idioma
 * lleva a /idioma y deja dicho a qué pantalla volver al terminar.
 */
export function BarraVisitante({ volverA, etiqueta, etiquetaAccesible, sinIdioma = false }: Props) {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const { pathname } = useLocation()
  const idioma = idiomaActual()

  return (
    <BarraSuperior
      etiqueta={volverA ? etiqueta : undefined}
      etiquetaAccesible={etiquetaAccesible}
      onVolver={volverA ? () => navegar(volverA) : undefined}
      idioma={
        sinIdioma
          ? undefined
          : {
              codigo: idioma.toUpperCase(),
              etiquetaAccesible: t('comun.cambiarIdioma', { idioma: t(`idiomas.${idioma}`) }),
              onCambiar: () => navegar('/idioma', { state: { volverA: pathname } }),
            }
      }
    />
  )
}
