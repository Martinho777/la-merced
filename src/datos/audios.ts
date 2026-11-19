// Narración de una ficha en el gestor: un audio por ficha (es decir, por punto e idioma). El archivo
// va al bucket "medios" (carpeta audios/), sus datos a la tabla medios y la ficha lo apunta con
// fichas.audio_id, que es lo que lee la app del visitante (src/datos/puntos.ts → mediosDePunto).
//
// Cambiar o quitar la narración de una ficha publicada la devuelve a revisión, como cualquier otro
// cambio a contenido publicado (regla del README).

import { BUCKET_MEDIOS } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import {
  COLUMNAS_FICHA,
  estadoAlGuardar,
  fichaGestor,
  type FichaGestor,
  type IdiomaFicha,
} from '@/datos/gestor'

/** Formatos que acepta el bucket para audios (supabase/migrations/…_almacenamiento.sql). */
export type TipoMimeAudio = 'audio/mpeg' | 'audio/mp4'

/** Archivo de audio listo para subir, con su duración leída en el navegador (o null si no se pudo). */
export type AudioPreparado = { archivo: Blob; tipoMime: TipoMimeAudio; duracionS: number | null }

const EXTENSION: Record<TipoMimeAudio, string> = { 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a' }

/** Ruta única dentro del bucket, p. ej. audios/punto-de-prueba-es-1762560000000.mp3. */
export function rutaAudio(
  slugPunto: string,
  idioma: IdiomaFicha,
  tipoMime: TipoMimeAudio,
  ahora = Date.now(),
): string {
  return `audios/${slugPunto}-${idioma}-${ahora}.${EXTENSION[tipoMime]}`
}

async function borrarMedio(medio: { id: string; ruta: string }): Promise<void> {
  const { error } = await supabase.from('medios').delete().eq('id', medio.id)
  if (error) throw new Error(`No se pudo borrar el audio: ${error.message}`)
  const { error: errorArchivo } = await supabase.storage.from(BUCKET_MEDIOS).remove([medio.ruta])
  if (errorArchivo) throw new Error(`No se pudo borrar el archivo: ${errorArchivo.message}`)
}

/** Apunta la ficha a otro audio (o a ninguno) y la devuelve a revisión si estaba publicada. */
async function cambiarAudioDeFicha(ficha: FichaGestor, idAudio: string | null) {
  return supabase
    .from('fichas')
    .update({ audio_id: idAudio, estado: estadoAlGuardar(ficha.estado) })
    .eq('id', ficha.id)
    .select(COLUMNAS_FICHA)
    .single()
}

/**
 * Sube la narración de la ficha y la deja apuntada. Si algo falla a medio camino, deshace lo hecho
 * para no dejar archivos ni registros huérfanos. La narración anterior, si había, se borra al final.
 */
export async function subirAudioFicha(
  punto: { id: string; slug: string },
  idioma: IdiomaFicha,
  ficha: FichaGestor,
  audio: AudioPreparado,
): Promise<FichaGestor> {
  const ruta = rutaAudio(punto.slug, idioma, audio.tipoMime)
  const subida = await supabase.storage
    .from(BUCKET_MEDIOS)
    .upload(ruta, audio.archivo, { contentType: audio.tipoMime })
  if (subida.error) throw new Error(`No se pudo subir el audio: ${subida.error.message}`)

  const registro = await supabase
    .from('medios')
    .insert({
      tipo: 'audio',
      ruta,
      punto_id: punto.id,
      idioma,
      duracion_s: audio.duracionS,
      peso_bytes: audio.archivo.size,
    })
    .select('id')
    .single()

  if (registro.error) {
    await supabase.storage.from(BUCKET_MEDIOS).remove([ruta])
    throw new Error(`No se pudo registrar el audio: ${registro.error.message}`)
  }

  const { data, error } = await cambiarAudioDeFicha(ficha, registro.data.id)
  if (error) {
    await borrarMedio({ id: registro.data.id, ruta }).catch(() => {})
    throw new Error(`No se pudo asociar el audio a la ficha: ${error.message}`)
  }

  // La ficha ya usa el audio nuevo. Si no se puede borrar el anterior solo queda un archivo sin uso;
  // no se avisa como error porque el cambio pedido sí se hizo.
  if (ficha.audio) await borrarMedio(ficha.audio).catch(() => {})
  return fichaGestor(data)
}

/** Quita la narración de la ficha y borra su archivo. */
export async function quitarAudioFicha(ficha: FichaGestor): Promise<FichaGestor> {
  const { data, error } = await cambiarAudioDeFicha(ficha, null)
  if (error) throw new Error(`No se pudo quitar el audio de la ficha: ${error.message}`)
  if (ficha.audio) await borrarMedio(ficha.audio)
  return fichaGestor(data)
}
