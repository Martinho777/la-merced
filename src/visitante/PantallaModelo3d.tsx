import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useSearchParams } from 'react-router'
import urlModelo from '@/assets/modelos/esfera-provisional.glb?url'
import { Boton } from '@/componentes/Boton'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import { rutaConZona, zonaDeBusqueda } from '@/visitante/camara'
import '@/visitante/pantalla.css'
import './PantallaModelo3d.css'

type Estado = 'cargando' | 'listo' | 'error'

/**
 * "Ver cómo era" (/ver-como-era?zona=…): modelo 3D interactivo en la pantalla, sin cámara: un dedo
 * gira y pellizcar acerca. La biblioteca y el modelo se descargan solo al abrirla. El modelo es una
 * esfera provisional (scripts/generar-modelo-provisional.py) hasta que exista el real. No gira solo,
 * así que no hay nada que quitar con movimiento reducido.
 */
export function PantallaModelo3d() {
  const { t } = useTranslation()
  const [parametros] = useSearchParams()
  const zona = zonaDeBusqueda(parametros)
  const [estado, setEstado] = useState<Estado>('cargando')
  const [intento, setIntento] = useState(0)
  const visor = useRef<HTMLElement>(null)

  useEffect(() => {
    const elemento = visor.current
    if (!elemento) return
    let vigente = true
    const alCargar = () => setEstado('listo')
    const alFallar = () => setEstado('error')
    elemento.addEventListener('load', alCargar)
    elemento.addEventListener('error', alFallar)
    // Sin red, también falla la descarga de la propia biblioteca.
    import('@google/model-viewer').catch(() => vigente && alFallar())
    return () => {
      vigente = false
      elemento.removeEventListener('load', alCargar)
      elemento.removeEventListener('error', alFallar)
    }
  }, [intento])

  if (!zona) return <Navigate to="/zona" replace />

  function reintentar() {
    setEstado('cargando')
    setIntento((n) => n + 1)
  }

  return (
    <div className="pantalla modelo3d">
      <BarraVisitante
        volverA={rutaConZona('/mapa', zona)}
        etiqueta={t('navegacion.mapa')}
        etiquetaAccesible={t('navegacion.volverAlMapa')}
      />
      <div className="modelo3d__cuerpo">
        <h1 className="pantalla__titulo texto-title-1">{t('modelo3d.titulo')}</h1>

        <div className="modelo3d__lienzo">
          {/* `key`: reintentar crea un visor nuevo. */}
          <model-viewer
            key={intento}
            ref={visor}
            className="modelo3d__visor"
            src={urlModelo}
            alt={t('modelo3d.descripcion')}
            camera-controls
            disable-pan
            interaction-prompt="none"
            touch-action="none"
          >
            {/* Vacío: reemplaza la barra de la biblioteca; el aviso de carga es el de abajo. */}
            <div slot="progress-bar" />
          </model-viewer>

          {estado === 'cargando' && (
            <p className="modelo3d__estado texto-body" role="status">
              {t('comun.cargando')}
            </p>
          )}
          {estado === 'error' && (
            <div className="modelo3d__estado" role="alert">
              <p className="pantalla__error texto-body">{t('modelo3d.error')}</p>
              <Boton variante="secundario" tamano="sm" onClick={reintentar}>
                {t('comun.reintentar')}
              </Boton>
            </div>
          )}
        </div>

        <p className="modelo3d__pista texto-small-strong">{t('modelo3d.pista')}</p>
        <p className="pantalla__texto texto-small">{t('modelo3d.provisional')}</p>
      </div>
    </div>
  )
}
