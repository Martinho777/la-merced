// Lo que una pantalla del gestor muestra en el encabezado, junto a "Gestor de fichas": hoy, el punto
// que se está editando. Así el título del punto queda en la misma fila que la marca y no compite con
// los títulos de cada paso.

import { createContext } from 'react'
import type { Rol } from '@/datos/sesion'

export type ContextoEncabezado = {
  titulo: string
  detalle: string
}

/** Cambia (o quita, con null) lo que muestra el encabezado. */
export const FijarEncabezado = createContext<(contexto: ContextoEncabezado | null) => void>(
  () => {},
)

/** Rol de quien usa el gestor, para textos que cambian según lo que puede hacer (p. ej. publicar). */
export const RolGestor = createContext<Rol | null>(null)
