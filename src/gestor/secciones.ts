// Secciones del gestor y quién las ve. Va aparte de la pantalla para probarlo sin DOM.
// Solo decide qué se muestra: la escritura la protegen las reglas de acceso (RLS) de la base.
//
// El gestor abre en un inicio con una tarjeta por tarea (InicioGestor): pensado para personas que no
// conocen los nombres técnicos. Cada sección tiene su propia dirección y vuelve al inicio.

import type { Rol } from '@/datos/sesion'

export type Seccion = 'fichas' | 'ubicacion' | 'faltantes' | 'textos' | 'publicar'

export const RUTA_INICIO = '/gestor'

export const RUTA_SECCION: Record<Seccion, string> = {
  fichas: '/gestor/puntos',
  ubicacion: '/gestor/ubicaciones',
  faltantes: '/gestor/faltantes',
  textos: '/gestor/textos',
  publicar: '/gestor/publicar',
}

/**
 * Secciones que ve cada rol: editor y revisor, fichas, ubicación y faltantes; admin, además, los
 * textos y «Publicar». Sin rol, ninguna. Ocultar no protege: el servidor y la base vuelven a revisar.
 */
export function seccionesVisibles(rol: Rol | null): Seccion[] {
  if (!rol) return []
  const comunes: Seccion[] = ['fichas', 'ubicacion', 'faltantes']
  return rol === 'admin' ? [...comunes, 'textos', 'publicar'] : comunes
}

const enRuta = (pathname: string, ruta: string) =>
  pathname === ruta || pathname.startsWith(`${ruta}/`)

/**
 * Dónde está el usuario. `punto` es la edición de una ficha (tiene su propio botón de volver a la
 * lista). Cualquier dirección desconocida del gestor muestra el inicio.
 */
export function seccionDe(pathname: string): Seccion | 'punto' | 'inicio' {
  if (enRuta(pathname, '/gestor/punto')) return 'punto'
  for (const seccion of Object.keys(RUTA_SECCION) as Seccion[]) {
    if (enRuta(pathname, RUTA_SECCION[seccion])) return seccion
  }
  return 'inicio'
}
