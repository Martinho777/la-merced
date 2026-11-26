// Secciones de la barra del gestor y quién las ve. Va aparte de la pantalla para probarlo sin DOM.
// Solo decide qué se muestra: la escritura la protegen las reglas de acceso (RLS) de la base.

import type { Rol } from '@/datos/sesion'

export type Seccion = 'fichas' | 'ubicacion' | 'faltantes' | 'textos' | 'publicar'

export const RUTA_SECCION: Record<Seccion, string> = {
  fichas: '/gestor',
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
 * Sección a la que pertenece una dirección. `punto` es la edición de una ficha: no forma parte de la
 * barra. Cualquier dirección desconocida del gestor muestra la lista de fichas.
 */
export function seccionDe(pathname: string): Seccion | 'punto' {
  if (enRuta(pathname, '/gestor/punto')) return 'punto'
  if (enRuta(pathname, RUTA_SECCION.ubicacion)) return 'ubicacion'
  if (enRuta(pathname, RUTA_SECCION.textos)) return 'textos'
  if (enRuta(pathname, RUTA_SECCION.faltantes)) return 'faltantes'
  if (enRuta(pathname, RUTA_SECCION.publicar)) return 'publicar'
  return 'fichas'
}
