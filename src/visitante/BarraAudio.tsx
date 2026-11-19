import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pause, Play } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import type { PuntoConFicha } from '@/datos/puntos'
import { prepararVoz, type VozNarracion } from '@/visitante/analizadorVoz'
import { formatearTiempo, porcentajeAvance } from '@/visitante/audio'
import './BarraAudio.css'

type Props = {
  audio: PuntoConFicha['audio']
  transcripcion: string | null
  /**
   * Avisa cuando la narración empieza a sonar (con su nivel de voz, o null si no se puede leer el
   * volumen) y cuando se detiene (`false`). La ficha lo usa para que Santi hable.
   */
  alCambiarVoz?: (voz: VozNarracion | null | false) => void
}

/**
 * Narración de la ficha (docs/diseno/componentes.md → Audio bar). Nunca empieza sola. Sin audio avisa
 * "Audio próximamente" y deshabilita la reproducción, sin simular tiempo ni avance; la transcripción
 * se puede leer aunque no haya audio y su botón se deshabilita solo si tampoco hay transcripción.
 */
export function BarraAudio({ audio, transcripcion, alCambiarVoz }: Props) {
  const { t } = useTranslation()
  const idTranscripcion = useId()
  const reproductor = useRef<HTMLAudioElement>(null)
  const [reproduciendo, setReproduciendo] = useState(false)
  const [actual, setActual] = useState(0)
  const [duracionCargada, setDuracionCargada] = useState<number | null>(null)
  const [fallo, setFallo] = useState(false)
  const voz = useRef<VozNarracion | null>(null)
  const [conTranscripcion, setConTranscripcion] = useState(false)

  const disponible = audio !== null && !fallo
  const duracion = duracionCargada ?? audio?.duracionS ?? null
  const tiempoTotal = formatearTiempo(duracion)

  function alternar() {
    const elemento = reproductor.current
    if (!elemento) return
    if (elemento.paused) {
      // Dentro del toque: el navegador solo deja arrancar Web Audio con un gesto.
      voz.current = prepararVoz(elemento)
      elemento.play().catch(() => setFallo(true))
    } else elemento.pause()
  }

  return (
    <section className="barra-audio" aria-label={t('punto.audio.titulo')}>
      <div className="barra-audio__fila">
        <button
          type="button"
          className="barra-audio__reproducir"
          disabled={!disponible}
          aria-label={t(reproduciendo ? 'punto.audio.pausar' : 'punto.audio.reproducir')}
          onClick={alternar}
        >
          {reproduciendo ? (
            <Pause className="barra-audio__icono" aria-hidden="true" />
          ) : (
            <Play className="barra-audio__icono" aria-hidden="true" />
          )}
        </button>

        <div className="barra-audio__centro">
          <div className="barra-audio__textos">
            <span className="texto-small-strong">
              {disponible
                ? t('punto.audio.titulo')
                : t(fallo ? 'punto.audio.error' : 'punto.audio.proximamente')}
            </span>
            {disponible && tiempoTotal && (
              <span className="barra-audio__tiempo texto-small">
                {`${formatearTiempo(actual) ?? ''} / ${tiempoTotal}`}
              </span>
            )}
          </div>
          {disponible && (
            <div className="barra-audio__pista">
              <div
                className="barra-audio__avance"
                style={{ width: `${porcentajeAvance(actual, duracion)}%` }}
              />
            </div>
          )}
        </div>

        <Boton
          variante="secundario"
          tamano="sm"
          disabled={!transcripcion}
          aria-expanded={transcripcion ? conTranscripcion : undefined}
          aria-controls={transcripcion ? idTranscripcion : undefined}
          onClick={() => setConTranscripcion((abierta) => !abierta)}
        >
          {t('punto.audio.transcripcion')}
        </Boton>
      </div>

      {transcripcion && (
        <p
          id={idTranscripcion}
          className="barra-audio__transcripcion texto-body"
          hidden={!conTranscripcion}
        >
          {transcripcion}
        </p>
      )}

      {audio && (
        <audio
          ref={reproductor}
          src={audio.url}
          preload="metadata"
          // Para poder leer el volumen de un archivo de otro dominio (ver analizadorVoz.ts).
          crossOrigin="anonymous"
          onPlay={() => {
            setReproduciendo(true)
            alCambiarVoz?.(voz.current)
          }}
          onPause={() => {
            setReproduciendo(false)
            alCambiarVoz?.(false)
          }}
          onEnded={() => {
            setReproduciendo(false)
            alCambiarVoz?.(false)
          }}
          onTimeUpdate={(evento) => setActual(evento.currentTarget.currentTime)}
          onLoadedMetadata={(evento) => {
            const { duration } = evento.currentTarget
            if (Number.isFinite(duration)) setDuracionCargada(duration)
          }}
          onError={() => {
            setReproduciendo(false)
            setFallo(true)
            alCambiarVoz?.(false)
          }}
        />
      )}
    </section>
  )
}
