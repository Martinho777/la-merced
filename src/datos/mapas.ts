// Cambiar la ilustración (el mapa) de una zona desde el gestor. Solo el admin puede (RLS de zonas: «admin
// gestiona zonas»); subir el archivo y crear el medio lo puede cualquier persona del equipo.
//
// El mapa del visitante y el editor de ubicaciones muestran la ilustración en proporción 2:1 y los
// puntos se guardan en fracciones de ella: una imagen de otra proporción los movería de lugar.

import { subirConProgreso } from '@/datos/subida'
import { urlPublica } from '@/lib/storage'
import { supabase } from '@/lib/supabase'

/** Proporción del mapa (ancho / alto) y cuánto puede apartarse una imagen nueva. */
export const PROPORCION_MAPA = 2
export const TOLERANCIA_PROPORCION = 0.03

export const TIPOS_MAPA: Readonly<Record<string, string>> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

export type ProblemaMapa = 'formato' | 'proporcion' | 'sinDescripcion'

/** Por qué una imagen no sirve como mapa, o null si sirve. */
export function problemaDeMapa(imagen: {
  tipo: string
  ancho: number
  alto: number
  descripcion: string
}): ProblemaMapa | null {
  if (!TIPOS_MAPA[imagen.tipo]) return 'formato'
  if (imagen.alto <= 0) return 'proporcion'
  const desvio = Math.abs(imagen.ancho / imagen.alto - PROPORCION_MAPA) / PROPORCION_MAPA
  if (desvio > TOLERANCIA_PROPORCION) return 'proporcion'
  if (!imagen.descripcion.trim()) return 'sinDescripcion'
  return null
}

export type MapaNuevo = {
  zonaSlug: string
  archivo: Blob
  tipo: string
  ancho: number
  alto: number
  /** Texto alternativo en español (la base lo exige para fotos e ilustraciones). */
  descripcion: string
}

/**
 * Sube la imagen, la registra como medio `ilustracion` y la pone como mapa de la zona. Lanza un `Error`
 * en español si algo falla; si la zona no se pudo cambiar, borra el medio recién creado. Devuelve la
 * URL pública de la imagen nueva.
 */
export async function cambiarMapaDeZona(
  mapa: MapaNuevo,
  alAvanzar?: (fraccion: number) => void,
): Promise<string> {
  const problema = problemaDeMapa(mapa)
  if (problema) throw new Error(`La imagen no sirve como mapa (${problema}).`)

  const ruta = `ilustraciones/${mapa.zonaSlug}-${Date.now()}.${TIPOS_MAPA[mapa.tipo]}`
  await subirConProgreso(ruta, mapa.archivo, mapa.tipo, alAvanzar)

  const { data: medio, error: errorMedio } = await supabase
    .from('medios')
    .insert({
      tipo: 'ilustracion',
      ruta,
      texto_alternativo: { es: mapa.descripcion.trim() },
      ancho: mapa.ancho,
      alto: mapa.alto,
      peso_bytes: mapa.archivo.size,
    })
    .select('id')
    .single()
  if (errorMedio) throw new Error(`No se pudo registrar la imagen: ${errorMedio.message}`)

  const { data: zonas, error: errorZona } = await supabase
    .from('zonas')
    .update({ ilustracion_id: medio.id })
    .eq('slug', mapa.zonaSlug)
    .select('slug')

  if (errorZona || zonas.length === 0) {
    // Sin permiso la base no da error: no cambia ninguna fila. No se deja un medio suelto.
    await supabase.from('medios').delete().eq('id', medio.id)
    throw new Error(
      errorZona
        ? `No se pudo cambiar el mapa: ${errorZona.message}`
        : 'No se pudo cambiar el mapa: solo un administrador puede hacerlo.',
    )
  }
  return urlPublica(ruta)
}
