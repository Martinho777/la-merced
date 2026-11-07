// Fotos de un punto en el gestor: la foto del detalle (pantalla de confirmación) y las fotos
// históricas (galería de la ficha). El archivo va al bucket "medios" (carpeta fotos/) y sus datos a la
// tabla medios, que es lo que lee la app del visitante (src/datos/puntos.ts → mediosDePunto).

import { BUCKET_MEDIOS, urlPublica } from '@/lib/storage'
import { supabase } from '@/lib/supabase'
import type { Json } from '@/lib/tipos-db'

export type TipoFoto = 'foto' | 'foto_historica'

/** Datos editables de una foto. El texto alternativo en español es obligatorio (accesibilidad). */
export type DatosFoto = {
  textoAlternativoEs: string
  textoAlternativoEn: string
  credito: string
  fechaOriginal: string
  derechos: string
}

export type FotoGestor = DatosFoto & {
  id: string
  tipo: TipoFoto
  ruta: string
  url: string
  orden: number
}

/** Archivo ya preparado para subir (reducido, en WebP o JPEG) con sus medidas. */
export type ImagenPreparada = {
  archivo: Blob
  tipoMime: 'image/webp' | 'image/jpeg'
  ancho: number
  alto: number
}

type FilaMedio = {
  id: string
  tipo: string
  ruta: string
  orden: number
  credito: string | null
  fecha_original: string | null
  derechos: string | null
  texto_alternativo: Json
}

const COLUMNAS = 'id, tipo, ruta, orden, credito, fecha_original, derechos, texto_alternativo'

function textoDe(textos: Json, idioma: 'es' | 'en'): string {
  if (typeof textos !== 'object' || textos === null || Array.isArray(textos)) return ''
  const texto = textos[idioma]
  return typeof texto === 'string' ? texto : ''
}

function fotoGestor(fila: FilaMedio): FotoGestor {
  return {
    id: fila.id,
    tipo: fila.tipo === 'foto' ? 'foto' : 'foto_historica',
    ruta: fila.ruta,
    url: urlPublica(fila.ruta),
    orden: fila.orden,
    credito: fila.credito ?? '',
    fechaOriginal: fila.fecha_original ?? '',
    derechos: fila.derechos ?? '',
    textoAlternativoEs: textoDe(fila.texto_alternativo, 'es'),
    textoAlternativoEn: textoDe(fila.texto_alternativo, 'en'),
  }
}

/** Columnas de la tabla medios a partir de los datos del formulario. */
export function columnasDe(datos: DatosFoto) {
  const opcional = (texto: string) => texto.trim() || null
  const textoAlternativo: Record<string, string> = { es: datos.textoAlternativoEs.trim() }
  if (datos.textoAlternativoEn.trim()) textoAlternativo.en = datos.textoAlternativoEn.trim()
  return {
    texto_alternativo: textoAlternativo,
    credito: opcional(datos.credito),
    fecha_original: opcional(datos.fechaOriginal),
    derechos: opcional(datos.derechos),
  }
}

/** Ruta única dentro del bucket, p. ej. fotos/punto-de-prueba-historica-1762560000000.webp. */
export function rutaNueva(
  slugPunto: string,
  tipo: TipoFoto,
  tipoMime: ImagenPreparada['tipoMime'],
  ahora = Date.now(),
): string {
  const sufijo = tipo === 'foto' ? 'detalle' : 'historica'
  const extension = tipoMime === 'image/webp' ? 'webp' : 'jpg'
  return `fotos/${slugPunto}-${sufijo}-${ahora}.${extension}`
}

/** Fotos del punto: la del detalle primero y luego las históricas, en su orden. */
export async function listarFotosPunto(idPunto: string): Promise<FotoGestor[]> {
  const { data, error } = await supabase
    .from('medios')
    .select(COLUMNAS)
    .eq('punto_id', idPunto)
    .in('tipo', ['foto', 'foto_historica'])
    .order('orden', { ascending: true })

  if (error) throw new Error(`No se pudieron leer las fotos: ${error.message}`)
  return data
    .map(fotoGestor)
    .sort((a, b) => Number(a.tipo === 'foto_historica') - Number(b.tipo === 'foto_historica'))
}

/**
 * Sube la imagen al bucket y registra la foto. Si el registro falla, borra el archivo subido para no
 * dejar huérfanos. La foto del detalle es una sola: la anterior se borra al subir la nueva.
 */
export async function subirFoto(
  punto: { id: string; slug: string },
  tipo: TipoFoto,
  imagen: ImagenPreparada,
  datos: DatosFoto,
  orden: number,
  anterior: FotoGestor | null = null,
): Promise<FotoGestor> {
  if (!datos.textoAlternativoEs.trim()) {
    throw new Error('La foto necesita un texto alternativo en español.')
  }

  const ruta = rutaNueva(punto.slug, tipo, imagen.tipoMime)
  const subida = await supabase.storage
    .from(BUCKET_MEDIOS)
    .upload(ruta, imagen.archivo, { contentType: imagen.tipoMime })
  if (subida.error) throw new Error(`No se pudo subir la imagen: ${subida.error.message}`)

  const { data, error } = await supabase
    .from('medios')
    .insert({
      ...columnasDe(datos),
      tipo,
      ruta,
      punto_id: punto.id,
      orden,
      ancho: imagen.ancho,
      alto: imagen.alto,
      peso_bytes: imagen.archivo.size,
    })
    .select(COLUMNAS)
    .single()

  if (error) {
    await supabase.storage.from(BUCKET_MEDIOS).remove([ruta])
    throw new Error(`No se pudo registrar la foto: ${error.message}`)
  }

  if (anterior) await borrarFoto(anterior)
  return fotoGestor(data)
}

/** Guarda los datos de una foto (créditos, fecha, derechos y textos alternativos). */
export async function actualizarFoto(id: string, datos: DatosFoto): Promise<FotoGestor> {
  if (!datos.textoAlternativoEs.trim()) {
    throw new Error('La foto necesita un texto alternativo en español.')
  }
  const { data, error } = await supabase
    .from('medios')
    .update(columnasDe(datos))
    .eq('id', id)
    .select(COLUMNAS)
    .single()

  if (error) throw new Error(`No se pudieron guardar los datos de la foto: ${error.message}`)
  return fotoGestor(data)
}

/** Borra el registro de la foto y su archivo del bucket. */
export async function borrarFoto(foto: Pick<FotoGestor, 'id' | 'ruta'>): Promise<void> {
  const { error } = await supabase.from('medios').delete().eq('id', foto.id)
  if (error) throw new Error(`No se pudo borrar la foto: ${error.message}`)

  const { error: errorArchivo } = await supabase.storage.from(BUCKET_MEDIOS).remove([foto.ruta])
  if (errorArchivo) throw new Error(`No se pudo borrar el archivo: ${errorArchivo.message}`)
}
