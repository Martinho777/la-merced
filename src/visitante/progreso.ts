// Puntos completados y ayuda inicial del mapa: en el teléfono cuando se puede y, siempre, en memoria
// durante la sesión. Así, sin almacenamiento disponible, el visitante sigue avanzando hasta recargar.
//
// Solo se guardan identificadores estables (`slug`). El contador "3/12" se calcula con `progreso()`
// de `mapa.ts` sobre los puntos actuales, por lo que un identificador que ya no existe no cuenta.

import { useSyncExternalStore } from 'react'
import {
  claveCompletados,
  guardarAyudaMapaVista,
  guardarCompletados,
  leerAyudaMapaVista,
  leerCompletados,
} from '@/lib/preferencias'

const NINGUNO: ReadonlySet<string> = new Set()

const memoria = new Map<string, ReadonlySet<string>>()
const oyentes = new Set<() => void>()
let ayudaCerrada = false

const avisar = () => oyentes.forEach((oyente) => oyente())

export function completadosDe(zona: string): ReadonlySet<string> {
  let completados = memoria.get(zona)
  if (!completados) {
    completados = new Set(leerCompletados(zona))
    memoria.set(zona, completados)
  }
  return completados
}

/** Marca un punto como completado. Repetirlo no cambia nada. */
export function completarPunto(zona: string, slug: string): void {
  const completados = completadosDe(zona)
  if (completados.has(slug)) return
  const nuevos = new Set(completados).add(slug)
  memoria.set(zona, nuevos)
  guardarCompletados(zona, [...nuevos])
  avisar()
}

// Otra pestaña cambió el progreso: se vuelve a leer lo guardado. Si se borró todo (`clave` null),
// también. Las zonas sin cambios conservan su conjunto.
function alCambiarAlmacen(evento: StorageEvent) {
  for (const zona of memoria.keys()) {
    if (evento.key === null || evento.key === claveCompletados(zona)) memoria.delete(zona)
  }
  avisar()
}

function suscribir(oyente: () => void): () => void {
  if (oyentes.size === 0) window.addEventListener('storage', alCambiarAlmacen)
  oyentes.add(oyente)
  return () => {
    oyentes.delete(oyente)
    if (oyentes.size === 0) window.removeEventListener('storage', alCambiarAlmacen)
  }
}

/** Slugs completados de una zona. Sin zona, o fuera del navegador, ninguno. */
export function useCompletados(zona: string | null): ReadonlySet<string> {
  return useSyncExternalStore(
    suscribir,
    () => (zona ? completadosDe(zona) : NINGUNO),
    () => NINGUNO,
  )
}

/** Si hay que mostrar la ayuda inicial del mapa. */
export function debeMostrarseAyudaMapa(): boolean {
  return !ayudaCerrada && !leerAyudaMapaVista()
}

export function cerrarAyudaMapa(): void {
  ayudaCerrada = true
  guardarAyudaMapaVista()
}
