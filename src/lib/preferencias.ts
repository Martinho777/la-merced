// Preferencias del visitante guardadas en el dispositivo (idioma y ruta). localStorage puede no
// existir o lanzar errores (modo privado, almacenamiento bloqueado o lleno), así que todo acceso va
// en try/catch: si falla, la app sigue con los valores por defecto y simplemente no recuerda nada.

import type { Enums } from '@/lib/tipos-db'

export type Idioma = Enums<'idioma'>
export type Ruta = 'recomendada' | 'esencial' | 'libre'

export const IDIOMAS: readonly Idioma[] = ['es', 'cak', 'en']
export const RUTAS: readonly Ruta[] = ['recomendada', 'esencial', 'libre']

export const IDIOMA_POR_DEFECTO: Idioma = 'es'
export const RUTA_POR_DEFECTO: Ruta = 'recomendada'

const CLAVE_IDIOMA = 'la-merced:idioma'
const CLAVE_RUTA = 'la-merced:ruta'

/** Lo mínimo de Storage que se usa; en las pruebas se pasa uno falso. */
type Almacen = Pick<Storage, 'getItem' | 'setItem'>

// Leer `window.localStorage` ya puede lanzar (p. ej. con cookies bloqueadas en Safari).
function almacenDelNavegador(): Almacen | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function leer<T extends string>(
  clave: string,
  validos: readonly T[],
  almacen: Almacen | null,
): T | null {
  try {
    const valor = almacen?.getItem(clave)
    return validos.find((v) => v === valor) ?? null
  } catch {
    return null
  }
}

function guardar(clave: string, valor: string, almacen: Almacen | null): void {
  try {
    almacen?.setItem(clave, valor)
  } catch {
    // Sin almacenamiento: la preferencia dura solo mientras la página esté abierta.
  }
}

/** Idioma guardado, o null si no hay uno válido o no se puede leer. */
export function leerIdioma(almacen = almacenDelNavegador()): Idioma | null {
  return leer(CLAVE_IDIOMA, IDIOMAS, almacen)
}

export function guardarIdioma(idioma: Idioma, almacen = almacenDelNavegador()): void {
  guardar(CLAVE_IDIOMA, idioma, almacen)
}

/** Ruta guardada, o null si no hay una válida o no se puede leer. */
export function leerRuta(almacen = almacenDelNavegador()): Ruta | null {
  return leer(CLAVE_RUTA, RUTAS, almacen)
}

export function guardarRuta(ruta: Ruta, almacen = almacenDelNavegador()): void {
  guardar(CLAVE_RUTA, ruta, almacen)
}

/** Clave de los puntos completados de una zona: cada zona lleva su propio progreso. */
export const claveCompletados = (zona: string) => `la-merced:completados:${zona}`
const CLAVE_AYUDA_MAPA = 'la-merced:ayuda-mapa-vista'

/**
 * Slugs de los puntos completados de una zona, sin repetidos. Si lo guardado no se puede leer o está
 * dañado, se empieza de cero. Solo se guardan los slugs: el contador siempre se calcula.
 */
export function leerCompletados(zona: string, almacen = almacenDelNavegador()): string[] {
  try {
    const datos: unknown = JSON.parse(almacen?.getItem(claveCompletados(zona)) ?? '[]')
    if (!Array.isArray(datos)) return []
    return [...new Set(datos.filter((id): id is string => typeof id === 'string' && id !== ''))]
  } catch {
    return []
  }
}

export function guardarCompletados(
  zona: string,
  slugs: readonly string[],
  almacen = almacenDelNavegador(),
): void {
  guardar(claveCompletados(zona), JSON.stringify(slugs), almacen)
}

/** Si el visitante ya cerró la ayuda inicial del mapa. Va aparte del progreso. */
export function leerAyudaMapaVista(almacen = almacenDelNavegador()): boolean {
  return leer(CLAVE_AYUDA_MAPA, ['1'], almacen) === '1'
}

export function guardarAyudaMapaVista(almacen = almacenDelNavegador()): void {
  guardar(CLAVE_AYUDA_MAPA, '1', almacen)
}
