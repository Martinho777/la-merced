// Subida de un archivo al bucket "medios" con progreso. supabase-js no informa el avance, así que se
// usa XMLHttpRequest contra la misma API de Storage, con la sesión del usuario. Los límites los
// aplica el servidor: tamaño y tipos MIME del bucket, y carpeta y extensión en sus reglas de acceso
// (supabase/migrations/…_almacenamiento.sql y …_audios_procedencia_publicaciones.sql).

import { BUCKET_MEDIOS } from '@/lib/storage'
import { CLAVE_PUBLICA, supabase, URL_SUPABASE } from '@/lib/supabase'

export type MotivoRechazo = 'tamano' | 'formato' | 'permiso' | 'existe' | 'conexion' | 'otro'

/** El servidor rechazó la subida; `motivo` dice por qué, para elegir el mensaje. */
export class ErrorSubida extends Error {
  readonly motivo: MotivoRechazo
  readonly estado: number

  constructor(motivo: MotivoRechazo, estado: number, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorSubida'
    this.motivo = motivo
    this.estado = estado
  }
}

/** Traduce la respuesta de Storage a un motivo. Storage responde 400 con el detalle en el cuerpo. */
export function motivoDeRechazo(estado: number, cuerpo: string): MotivoRechazo {
  const texto = cuerpo.toLowerCase()
  if (estado === 413 || texto.includes('maximum allowed size') || texto.includes('too large')) {
    return 'tamano'
  }
  if (estado === 415 || texto.includes('mime type') || texto.includes('invalid_mime')) {
    return 'formato'
  }
  if (estado === 409 || texto.includes('already exists') || texto.includes('duplicate')) {
    return 'existe'
  }
  if (estado === 401 || estado === 403 || texto.includes('row-level security')) return 'permiso'
  if (estado === 0) return 'conexion'
  return 'otro'
}

/**
 * Sube `archivo` a `ruta` del bucket. `alAvanzar` recibe la fracción enviada (0 a 1). Lanza
 * ErrorSubida si el servidor lo rechaza.
 */
export async function subirConProgreso(
  ruta: string,
  archivo: Blob,
  tipoMime: string,
  alAvanzar?: (fraccion: number) => void,
): Promise<void> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new ErrorSubida('permiso', 401, 'Inicia sesión para subir archivos.')

  const destino = `${URL_SUPABASE}/storage/v1/object/${BUCKET_MEDIOS}/${ruta
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`

  await new Promise<void>((resolver, rechazar) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', destino)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('apikey', CLAVE_PUBLICA)
    xhr.setRequestHeader('Content-Type', tipoMime)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('cache-control', 'max-age=3600')
    xhr.upload.onprogress = (evento) => {
      if (evento.lengthComputable) alAvanzar?.(evento.loaded / evento.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        alAvanzar?.(1)
        resolver()
        return
      }
      const motivo = motivoDeRechazo(xhr.status, xhr.responseText)
      rechazar(
        new ErrorSubida(motivo, xhr.status, `Storage rechazó el archivo: ${xhr.responseText}`),
      )
    }
    xhr.onerror = () => rechazar(new ErrorSubida('conexion', 0, 'Se perdió la conexión al subir.'))
    xhr.send(archivo)
  })
}
