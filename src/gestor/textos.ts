// Lógica del editor de textos de las pantallas (EditorTextos.tsx), sin React para poder probarla.
//
// Cada texto tiene tres capas, de abajo arriba: el JSON de src/i18n (el original), la fila de la base
// (textos_interfaz, lo publicado) y el borrador que el admin está escribiendo. En kaqchikel puede no
// haber ninguna de las dos primeras: entonces la app muestra el español.

import type { FilaTexto } from '@/datos/textos'
import cak from '@/i18n/cak.json'
import en from '@/i18n/en.json'
import es from '@/i18n/es.json'
import { marcadores } from '@/i18n/textosBase'
import type { Idioma } from '@/lib/preferencias'

/** Las pantallas que se pueden editar, en el orden del recorrido, con sus textos. */
export const PANTALLAS_EDITABLES = [
  {
    id: 'bienvenida',
    ruta: '/',
    claves: ['bienvenida.titulo', 'bienvenida.subtitulo', 'bienvenida.empezar'],
  },
  { id: 'idioma', ruta: '/idioma', claves: ['idioma.titulo'] },
  { id: 'ruta', ruta: '/ruta', claves: ['ruta.titulo', 'ruta.intro'] },
  { id: 'zona', ruta: '/zona', claves: ['zona.titulo'] },
  { id: 'confirmacion', ruta: '/confirmacion', claves: ['punto.confirmacion.pregunta'] },
] as const

export type PantallaEditable = (typeof PANTALLAS_EDITABLES)[number]
export type IdPantalla = PantallaEditable['id']
export type ClaveEditable = PantallaEditable['claves'][number]

export const CLAVES_EDITABLES: readonly ClaveEditable[] = PANTALLAS_EDITABLES.flatMap(
  (p) => p.claves,
)

/** La pantalla con ese id, o la primera si no existe. */
export function pantallaDe(id: string | null): PantallaEditable {
  return PANTALLAS_EDITABLES.find((p) => p.id === id) ?? PANTALLAS_EDITABLES[0]
}

type Arbol = { [clave: string]: string | Arbol }
const JSON_POR_IDIOMA: Record<Idioma, Arbol> = { es, en, cak }

/** Texto de una clave en el JSON de un idioma, o null si ese idioma no la tiene. */
export function textoOriginal(idioma: Idioma, clave: string): string | null {
  let nodo: string | Arbol | undefined = JSON_POR_IDIOMA[idioma]
  for (const parte of clave.split('.')) {
    if (typeof nodo !== 'object') return null
    nodo = nodo[parte]
  }
  return typeof nodo === 'string' ? nodo : null
}

/** Textos por idioma y clave. */
export type Textos = Partial<Record<Idioma, Partial<Record<string, string>>>>

/** Las filas de la base que son de las pantallas editables. */
export function textosDeLaBase(filas: readonly FilaTexto[]): Textos {
  const resultado: Textos = {}
  for (const { clave, idioma, texto } of filas) {
    if (CLAVES_EDITABLES.some((c) => c === clave)) (resultado[idioma] ??= {})[clave] = texto
  }
  return resultado
}

/** Lo que ve hoy el visitante en ese idioma (base o JSON), o null si cae al español. */
export function textoPublicado(base: Textos, idioma: Idioma, clave: string): string | null {
  return base[idioma]?.[clave] ?? textoOriginal(idioma, clave)
}

/** Valor del campo: el borrador si lo hay; si no, lo publicado (vacío si falta la traducción). */
export function valorCampo(
  base: Textos,
  borradores: Textos,
  idioma: Idioma,
  clave: string,
): string {
  return borradores[idioma]?.[clave] ?? textoPublicado(base, idioma, clave) ?? ''
}

export type Problema = 'vacio' | 'marcadores'

/** Por qué no se puede guardar un texto, o null si está bien. */
export function problemaDe(clave: string, texto: string): Problema | null {
  if (!texto.trim()) return 'vacio'
  const referencia = textoOriginal('es', clave) ?? ''
  return marcadores(texto) === marcadores(referencia) ? null : 'marcadores'
}

/** Si el campo tiene un cambio sin guardar. */
export function estaCambiado(
  base: Textos,
  borradores: Textos,
  idioma: Idioma,
  clave: string,
): boolean {
  const borrador = borradores[idioma]?.[clave]
  return borrador !== undefined && borrador !== (textoPublicado(base, idioma, clave) ?? '')
}

/** Las claves de la lista con cambios sin guardar. */
export function cambiosDe(
  base: Textos,
  borradores: Textos,
  idioma: Idioma,
  claves: readonly string[],
): string[] {
  return claves.filter((clave) => estaCambiado(base, borradores, idioma, clave))
}

/**
 * Cómo está el texto publicado: el del JSON, uno cambiado en la base o, en kaqchikel, ninguno
 * (la app muestra el español).
 */
export type Origen = 'original' | 'editado' | 'sinTraduccion'

export function origenDe(base: Textos, idioma: Idioma, clave: string): Origen {
  if (base[idioma]?.[clave] !== undefined) return 'editado'
  return textoOriginal(idioma, clave) === null ? 'sinTraduccion' : 'original'
}

/**
 * Lo que la vista previa debe mostrar para cada clave: el borrador si es válido; si no, lo publicado;
 * y si el idioma no tiene el texto, el español (como hace la app).
 */
export function textosParaVistaPrevia(
  base: Textos,
  borradores: Textos,
  idioma: Idioma,
  claves: readonly string[],
): Record<string, string> {
  return Object.fromEntries(
    claves.map((clave) => {
      const borrador = borradores[idioma]?.[clave]
      const valido = borrador !== undefined && problemaDe(clave, borrador) === null
      const texto = valido
        ? borrador
        : (textoPublicado(base, idioma, clave) ?? textoPublicado(base, 'es', clave) ?? '')
      return [clave, texto]
    }),
  )
}

/** Copia de `textos` con `clave` en `idioma` cambiada (o quitada, con undefined). */
export function conTexto(
  textos: Textos,
  idioma: Idioma,
  clave: string,
  texto: string | undefined,
): Textos {
  const delIdioma = { ...textos[idioma] }
  if (texto === undefined) delete delIdioma[clave]
  else delIdioma[clave] = texto
  return { ...textos, [idioma]: delIdioma }
}
