// Textos de la base encima de los JSON. Al abrir la app:
//   1. Se aplica la última copia guardada en el dispositivo (si hay): así el visitante que vuelve no
//      ve el texto cambiar de golpe.
//   2. Se piden los textos a la base. Si responden, se aplican y se guarda la copia.
//   3. Si la base no responde o falla, la app sigue con lo que ya tiene (los JSON, o la copia).
// Un texto de la base solo se usa si su clave existe en es.json y conserva los mismos marcadores
// ({{count}}, {{zona}}…): un texto mal escrito en el gestor nunca rompe una pantalla.

import type { i18n as I18n } from 'i18next'
import type { FilaTexto } from '@/datos/textos'
import { IDIOMAS, type Idioma } from '@/lib/preferencias'
import es from './es.json'

type Arbol = { [clave: string]: string | Arbol }
export type TextosPorIdioma = Partial<Record<Idioma, Record<string, string>>>

const CLAVE_COPIA = 'la-merced:textos'
type Almacen = Pick<Storage, 'getItem' | 'setItem'>

function aplanar(arbol: Arbol, prefijo = ''): [string, string][] {
  return Object.entries(arbol).flatMap(([clave, valor]) => {
    const ruta = prefijo ? `${prefijo}.${clave}` : clave
    return typeof valor === 'string' ? [[ruta, valor]] : aplanar(valor, ruta)
  })
}

/** Texto de referencia (español) de cada clave que usa la app. */
const REFERENCIA = new Map(aplanar(es))

/** Marcadores {{…}} de un texto, ordenados, para comparar. */
export function marcadores(texto: string): string {
  return [...texto.matchAll(/\{\{\s*([^}\s]+)\s*\}\}/g)]
    .map((m) => m[1])
    .sort()
    .join(',')
}

/** Filtra las filas de la base: solo claves conocidas, texto no vacío y los mismos marcadores. */
export function textosValidos(filas: readonly FilaTexto[]): TextosPorIdioma {
  const resultado: TextosPorIdioma = {}
  for (const { clave, idioma, texto } of filas) {
    const referencia = REFERENCIA.get(clave)
    if (referencia === undefined || !texto.trim()) continue
    if (marcadores(texto) !== marcadores(referencia)) continue
    ;(resultado[idioma] ??= {})[clave] = texto
  }
  return resultado
}

/** { 'a.b': 'x' } → { a: { b: 'x' } }, la forma de los recursos de i18next. */
export function anidar(planos: Record<string, string>): Arbol {
  const arbol: Arbol = {}
  for (const [ruta, texto] of Object.entries(planos)) {
    const partes = ruta.split('.')
    const ultima = partes.pop()
    if (!ultima) continue
    let nodo = arbol
    for (const parte of partes) {
      const siguiente = nodo[parte]
      if (typeof siguiente === 'string') break
      nodo = siguiente ?? (nodo[parte] = {})
    }
    nodo[ultima] = texto
  }
  return arbol
}

/** Pone los textos encima de los recursos de cada idioma (las claves que no vienen no cambian). */
export function aplicarTextos(i18n: I18n, textos: TextosPorIdioma): void {
  for (const idioma of IDIOMAS) {
    const planos = textos[idioma]
    if (planos && Object.keys(planos).length > 0) {
      i18n.addResourceBundle(idioma, 'translation', anidar(planos), true, true)
    }
  }
}

function almacenDelNavegador(): Almacen | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** Copia guardada en el dispositivo, o null si no hay o está dañada. */
export function leerCopia(almacen: Almacen | null): TextosPorIdioma | null {
  try {
    const guardada = almacen?.getItem(CLAVE_COPIA)
    if (!guardada) return null
    const filas = Object.entries(JSON.parse(guardada) as Record<string, Record<string, string>>)
      .filter(([idioma]) => IDIOMAS.some((i) => i === idioma))
      .flatMap(([idioma, planos]) =>
        Object.entries(planos).map(([clave, texto]) => ({ clave, idioma, texto }) as FilaTexto),
      )
      .filter((f) => typeof f.texto === 'string')
    return textosValidos(filas)
  } catch {
    return null
  }
}

function guardarCopia(textos: TextosPorIdioma, almacen: Almacen | null): void {
  try {
    almacen?.setItem(CLAVE_COPIA, JSON.stringify(textos))
  } catch {
    // Sin almacenamiento: la próxima vez se vuelve a pedir a la base.
  }
}

/**
 * Aplica la copia del dispositivo y luego los textos de la base. Nunca lanza: si la base falla, la
 * app sigue con los JSON (o con la copia). Devuelve si se pudieron usar los textos de la base.
 */
export async function cargarTextosDeLaBase(
  i18n: I18n,
  leer: () => Promise<FilaTexto[]>,
  almacen: Almacen | null = almacenDelNavegador(),
): Promise<boolean> {
  const copia = leerCopia(almacen)
  if (copia) aplicarTextos(i18n, copia)

  try {
    const textos = textosValidos(await leer())
    aplicarTextos(i18n, textos)
    guardarCopia(textos, almacen)
    return true
  } catch (error) {
    console.warn('Se usan los textos de los JSON:', error)
    return false
  }
}
