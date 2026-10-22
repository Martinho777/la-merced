import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router'
import { TriangleAlert } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { obtenerZona } from '@/datos/zonas'
import {
  rutaConZona,
  siguientePaso,
  solicitarCamara,
  vieneDeActivar,
  zonaDeBusqueda,
  type MotivoErrorCamara,
  type SolicitudCamara,
} from '@/visitante/camara'
import './PantallaAlineacion.css'

type MotivoError = Exclude<MotivoErrorCamara, 'denegado'> | 'zona'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'activa'; stream: MediaStream }
  | { tipo: 'error'; motivo: MotivoError }
  /** La zona no existe o no usa cámara: se sale sin pedir nada. */
  | { tipo: 'salir'; destino: 'zonas' | 'mapa' }

const CLAVE_ERROR = {
  zona: 'camara.errorZona',
  'sin-camara': 'alineacion.errores.sinCamara',
  ocupada: 'alineacion.errores.ocupada',
  'no-compatible': 'alineacion.errores.noCompatible',
  inseguro: 'alineacion.errores.inseguro',
  reproduccion: 'alineacion.errores.reproduccion',
  interrumpida: 'alineacion.errores.interrumpida',
  desconocido: 'alineacion.errores.desconocido',
} as const satisfies Record<MotivoError, string>

/**
 * Pantalla 6 (/alineacion?zona=…): video de la cámara trasera con el contorno de la fachada encima.
 * La persona alinea a mano y sigue al mapa con "Listo" o "Saltar". Solo pide la cámara si llegó
 * desde "Activar cámara"; si niega el permiso, pasa al mapa sin más. La cámara se apaga al salir
 * por cualquier camino (botones, atrás, desmontar, ocultar la página) y también si la respuesta
 * del navegador llega cuando la pantalla ya no está.
 */
export function PantallaAlineacion() {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const { state } = useLocation()
  const [parametros] = useSearchParams()
  const slug = zonaDeBusqueda(parametros)
  const activada = vieneDeActivar(state)

  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [urlContorno, setUrlContorno] = useState<string | null>(null)
  const [contornoFallo, setContornoFallo] = useState(false)
  const [intento, setIntento] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)
  const solicitudRef = useRef<SolicitudCamara | null>(null)
  const saliendo = useRef(false)

  // Zona y cámara, en ese orden: si la zona no usa cámara no se llega a pedir el permiso.
  useEffect(() => {
    if (!slug || !activada) return
    let vigente = true
    let solicitud: SolicitudCamara | null = null

    // En desarrollo, StrictMode monta, desmonta y vuelve a montar: esperar un turno hace que el
    // primer montaje se cancele antes de pedir nada y evita dos solicitudes de cámara.
    const espera = window.setTimeout(() => {
      void (async () => {
        let zona
        try {
          zona = await obtenerZona(slug)
        } catch {
          if (vigente) setEstado({ tipo: 'error', motivo: 'zona' })
          return
        }
        if (!vigente) return

        const paso = siguientePaso(zona)
        if (paso !== 'camara' || !zona) {
          setEstado({ tipo: 'salir', destino: paso === 'zonas' ? 'zonas' : 'mapa' })
          return
        }
        setUrlContorno(zona.urlContorno)

        solicitud = solicitarCamara()
        solicitudRef.current = solicitud
        const resultado = await solicitud.resultado
        // Si ya no está vigente, cancelar() detuvo el stream (o lo detendrá al llegar).
        if (!vigente || resultado.tipo === 'cancelada') return

        if (resultado.tipo === 'lista') {
          setEstado({ tipo: 'activa', stream: resultado.stream })
        } else if (resultado.motivo === 'denegado') {
          setEstado({ tipo: 'salir', destino: 'mapa' })
        } else {
          setEstado({ tipo: 'error', motivo: resultado.motivo })
        }
      })()
    }, 0)

    return () => {
      vigente = false
      window.clearTimeout(espera)
      solicitud?.cancelar()
      if (solicitudRef.current === solicitud) solicitudRef.current = null
    }
  }, [slug, activada, intento])

  const stream = estado.tipo === 'activa' ? estado.stream : null

  // Conecta el stream al <video> y lo suelta al terminar.
  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return
    let vigente = true

    function fallar(motivo: MotivoError) {
      if (!vigente) return
      solicitudRef.current?.cancelar()
      setEstado({ tipo: 'error', motivo })
    }

    // React no siempre refleja `muted` como atributo, y iOS lo exige para reproducir en línea.
    video.muted = true
    video.setAttribute('muted', '')
    video.srcObject = stream
    video.play().catch(() => fallar('reproduccion'))

    // El sistema puede cortar la cámara (otra app la toma, se revoca el permiso).
    const alTerminarPista = () => fallar('interrumpida')
    const pistas = stream.getVideoTracks()
    for (const pista of pistas) pista.addEventListener('ended', alTerminarPista)

    return () => {
      vigente = false
      for (const pista of pistas) pista.removeEventListener('ended', alTerminarPista)
      video.pause()
      video.srcObject = null
    }
  }, [stream])

  // Al ocultar la página (cambiar de app, bfcache) se apaga la cámara; al volver se ofrece seguir.
  useEffect(() => {
    if (!stream) return
    function alOcultar() {
      solicitudRef.current?.cancelar()
      setEstado({ tipo: 'error', motivo: 'interrumpida' })
    }
    window.addEventListener('pagehide', alOcultar)
    return () => window.removeEventListener('pagehide', alOcultar)
  }, [stream])

  // Sin zona en la URL: a elegir zona. Sin haber pulsado "Activar cámara" (entrada directa): a la
  // explicación, para que el permiso nunca se pida sin que la persona lo decida.
  if (!slug) return <Navigate to="/zona" replace />
  if (!activada) return <Navigate to={rutaConZona('/camara', slug)} replace />
  if (estado.tipo === 'salir') {
    return (
      <Navigate to={estado.destino === 'zonas' ? '/zona' : rutaConZona('/mapa', slug)} replace />
    )
  }

  const mapa = rutaConZona('/mapa', slug)

  /** Listo, Saltar y Continuar: apaga la cámara y pasa a la ilustración con una transición. */
  function irAlMapa() {
    if (saliendo.current) return
    saliendo.current = true
    solicitudRef.current?.cancelar()
    // replace: "atrás" desde el mapa vuelve a la explicación, no a una cámara ya cerrada.
    void navegar(mapa, { replace: true, viewTransition: true })
  }

  function reintentar() {
    setEstado({ tipo: 'cargando' })
    setIntento((n) => n + 1)
  }

  const contornoDisponible = urlContorno !== null && !contornoFallo

  return (
    <div className="alineacion">
      <video
        ref={videoRef}
        className="alineacion__video"
        autoPlay
        playsInline
        muted
        disablePictureInPicture
        aria-hidden="true"
      />

      {estado.tipo === 'cargando' && (
        <p className="alineacion__aviso texto-body-strong" role="status">
          {t('alineacion.abriendo')}
        </p>
      )}
      {estado.tipo === 'activa' && (
        <p className="alineacion__aviso texto-body-strong" role="status">
          {!contornoDisponible && (
            <TriangleAlert className="alineacion__icono" aria-hidden="true" />
          )}
          {contornoDisponible ? t('alineacion.instruccion') : t('alineacion.errores.contorno')}
        </p>
      )}
      {estado.tipo === 'error' && (
        <p className="alineacion__aviso texto-body-strong" role="alert">
          <TriangleAlert className="alineacion__icono" aria-hidden="true" />
          {t(CLAVE_ERROR[estado.motivo])}
        </p>
      )}

      <div className="alineacion__visor">
        {estado.tipo === 'activa' && contornoDisponible && (
          // Decorativo: el aviso de arriba ya dice qué hacer con él.
          <img
            className="alineacion__contorno"
            src={urlContorno}
            alt=""
            decoding="async"
            onError={() => setContornoFallo(true)}
          />
        )}
      </div>

      <div className="alineacion__acciones">
        {estado.tipo === 'activa' && (
          <Boton anchoCompleto onClick={irAlMapa}>
            {t('alineacion.listo')}
          </Boton>
        )}
        {estado.tipo === 'error' && (
          <Boton anchoCompleto onClick={irAlMapa}>
            {t('alineacion.continuarSinCamara')}
          </Boton>
        )}
        {estado.tipo === 'error' && estado.motivo === 'zona' ? (
          <Boton variante="secundario" anchoCompleto onClick={reintentar}>
            {t('comun.reintentar')}
          </Boton>
        ) : (
          estado.tipo !== 'error' && (
            <Boton variante="secundario" anchoCompleto onClick={irAlMapa}>
              {t('camara.saltar')}
            </Boton>
          )
        )}
      </div>
    </div>
  )
}
