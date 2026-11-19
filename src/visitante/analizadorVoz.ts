// Volumen de la narración en vivo (Web Audio API), para que el pico de Santi siga al audio.
//
// Un <audio> solo puede conectarse una vez a Web Audio, y desde ese momento suena a través del
// AudioContext: por eso el contexto se crea en el primer toque de "Reproducir" (los navegadores no
// dejan sonar uno creado sin un gesto) y se reanuda en cada reproducción. El <audio> lleva
// crossOrigin="anonymous": sin eso, el navegador no deja leer el volumen de un archivo de otro
// dominio (el bucket de Supabase) y el analizador solo vería silencio.

import { nivelRms, SuavizadorVoz } from '@/componentes/Santi/voz'

export type VozNarracion = {
  /** Nivel de voz actual, de 0 a 1, ya suavizado. */
  nivel: () => number
}

type Conexion = { contexto: AudioContext; voz: VozNarracion }

const conexiones = new WeakMap<HTMLAudioElement, Conexion>()

function crearContexto(): AudioContext | null {
  const Contexto =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  try {
    return Contexto ? new Contexto() : null
  } catch {
    return null
  }
}

/**
 * Conecta el <audio> a un analizador (la primera vez) y reanuda el contexto. Hay que llamarla dentro
 * del toque que inicia la reproducción. Devuelve null si el navegador no tiene Web Audio: el audio
 * suena igual y Santi habla con un patrón en lugar de seguir el volumen.
 */
export function prepararVoz(audio: HTMLAudioElement): VozNarracion | null {
  let conexion = conexiones.get(audio)
  if (!conexion) {
    const contexto = crearContexto()
    if (!contexto) return null
    try {
      const analizador = contexto.createAnalyser()
      analizador.fftSize = 512
      contexto.createMediaElementSource(audio).connect(analizador)
      analizador.connect(contexto.destination)
      const muestras = new Uint8Array(analizador.fftSize)
      const suavizador = new SuavizadorVoz()
      conexion = {
        contexto,
        voz: {
          nivel: () => {
            analizador.getByteTimeDomainData(muestras)
            return suavizador.siguiente(nivelRms(muestras))
          },
        },
      }
      conexiones.set(audio, conexion)
    } catch {
      void contexto.close()
      return null
    }
  }
  if (conexion.contexto.state === 'suspended') void conexion.contexto.resume()
  return conexion.voz
}
