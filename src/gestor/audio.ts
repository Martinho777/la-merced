// Preparar la narración antes de subirla: qué archivos se aceptan y cuánto dura. La validación va
// aparte para probarla sin DOM; leer la duración necesita el navegador.

import type { AudioPreparado, TipoMimeAudio } from '@/datos/audios'

/** Límite por archivo del bucket "medios" (50 MB, supabase/migrations/…_almacenamiento.sql). */
export const TAMANO_MAXIMO_AUDIO = 52_428_800

/** Lo que acepta el selector de archivos: MP3 y M4A (el bucket solo admite esos audios). */
export const TIPOS_AUDIO_ACEPTADOS = ['audio/mpeg', 'audio/mp4', 'audio/x-m4a', '.mp3', '.m4a']

export type MotivoAudio = 'formato' | 'tamano'

export class ErrorAudio extends Error {
  readonly motivo: MotivoAudio

  constructor(motivo: MotivoAudio) {
    super(motivo === 'formato' ? 'Formato de audio no admitido.' : 'El audio pesa más de 50 MB.')
    this.name = 'ErrorAudio'
    this.motivo = motivo
  }
}

/**
 * Tipo con que se guarda el archivo. Los navegadores nombran el M4A de varias formas (o no lo nombran
 * en absoluto), así que también se mira la extensión. Null si no es MP3 ni M4A.
 */
export function tipoMimeAudio(archivo: { type: string; name: string }): TipoMimeAudio | null {
  const tipo = archivo.type.toLowerCase()
  const extension = archivo.name.toLowerCase().split('.').pop() ?? ''
  if (tipo === 'audio/mpeg' || tipo === 'audio/mp3' || extension === 'mp3') return 'audio/mpeg'
  if (['audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac'].includes(tipo)) return 'audio/mp4'
  if (extension === 'm4a') return 'audio/mp4'
  return null
}

/** Revisa formato y tamaño. Lanza ErrorAudio si el archivo no sirve. */
export function validarAudio(archivo: { type: string; name: string; size: number }): TipoMimeAudio {
  const tipoMime = tipoMimeAudio(archivo)
  if (!tipoMime) throw new ErrorAudio('formato')
  if (archivo.size > TAMANO_MAXIMO_AUDIO) throw new ErrorAudio('tamano')
  return tipoMime
}

/** Duración en segundos, o null si el navegador no la informa (el audio se sube igual). */
function leerDuracion(archivo: Blob): Promise<number | null> {
  return new Promise((resolver) => {
    const url = URL.createObjectURL(archivo)
    const audio = new Audio()
    const terminar = (duracion: number | null) => {
      window.clearTimeout(espera)
      URL.revokeObjectURL(url)
      resolver(duracion)
    }
    const espera = window.setTimeout(() => terminar(null), 10_000)
    audio.preload = 'metadata'
    audio.onloadedmetadata = () =>
      terminar(Number.isFinite(audio.duration) ? Math.round(audio.duration * 100) / 100 : null)
    audio.onerror = () => terminar(null)
    audio.src = url
  })
}

/** Valida el archivo elegido y lee su duración. */
export async function prepararAudio(archivo: File): Promise<AudioPreparado> {
  const tipoMime = validarAudio(archivo)
  return { archivo, tipoMime, duracionS: await leerDuracion(archivo) }
}
