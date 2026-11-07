// Prepara una foto antes de subirla: la reduce y la convierte a WebP en el navegador, sin
// bibliotecas (decisión del equipo, nov. 2026). Así pesa poco para el visitante y cumple los tipos
// que acepta el bucket (JPEG, WebP, SVG). Los originales en máxima resolución se guardan aparte.

import type { ImagenPreparada } from '@/datos/fotos'

/** Lado más largo de la imagen subida, en píxeles. */
export const LADO_MAXIMO = 2000

/** Calidad de compresión (0 a 1). */
const CALIDAD = 0.85

/** Formatos que el navegador puede abrir para convertir. HEIC y TIFF hay que pasarlos antes a JPEG. */
export const TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp'] as const

export type MotivoErrorImagen = 'formato' | 'conversion'

export class ErrorImagen extends Error {
  readonly motivo: MotivoErrorImagen

  constructor(motivo: MotivoErrorImagen) {
    super(`No se pudo preparar la imagen (${motivo}).`)
    this.name = 'ErrorImagen'
    this.motivo = motivo
  }
}

/** Medidas reducidas para que el lado más largo no pase de `maximo`; nunca agranda. */
export function medidasReducidas(ancho: number, alto: number, maximo = LADO_MAXIMO) {
  const escala = Math.min(1, maximo / Math.max(ancho, alto))
  return { ancho: Math.round(ancho * escala), alto: Math.round(alto * escala) }
}

export function esFormatoAceptado(tipo: string): boolean {
  return (TIPOS_ACEPTADOS as readonly string[]).includes(tipo)
}

function aBlob(lienzo: HTMLCanvasElement, tipo: string): Promise<Blob | null> {
  return new Promise((resolver) => lienzo.toBlob(resolver, tipo, CALIDAD))
}

/** Reduce la imagen y la convierte a WebP (o a JPEG si el navegador no sabe generar WebP). */
export async function prepararImagen(archivo: File): Promise<ImagenPreparada> {
  if (!esFormatoAceptado(archivo.type)) throw new ErrorImagen('formato')

  let mapa: ImageBitmap
  try {
    mapa = await createImageBitmap(archivo)
  } catch {
    throw new ErrorImagen('formato')
  }

  const { ancho, alto } = medidasReducidas(mapa.width, mapa.height)
  const lienzo = document.createElement('canvas')
  lienzo.width = ancho
  lienzo.height = alto
  const contexto = lienzo.getContext('2d')
  if (!contexto) throw new ErrorImagen('conversion')
  contexto.drawImage(mapa, 0, 0, ancho, alto)
  mapa.close()

  const webp = await aBlob(lienzo, 'image/webp')
  if (webp?.type === 'image/webp') return { archivo: webp, tipoMime: 'image/webp', ancho, alto }

  // Safari anterior a la versión 17 no genera WebP: se usa JPEG, que el bucket también acepta.
  const jpeg = await aBlob(lienzo, 'image/jpeg')
  if (jpeg?.type === 'image/jpeg') return { archivo: jpeg, tipoMime: 'image/jpeg', ancho, alto }
  throw new ErrorImagen('conversion')
}
