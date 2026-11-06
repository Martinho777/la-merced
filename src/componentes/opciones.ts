import type { ReactNode } from 'react'

// Tipos y reglas de las opciones de GrupoOpciones (aparte para que el componente solo exporte componentes).

export type Opcion<T extends string> = {
  valor: T
  titulo: string
  subtitulo?: string
  /** Contenido debajo del título (p. ej. la imagen de una zona). */
  contenido?: ReactNode
  /** Texto de la insignia de no disponible ("Próximamente"). Si se pasa, la opción no se puede elegir. */
  etiquetaNoDisponible?: string
  /** Ocupa todo el ancho en la disposición de cuadrícula. */
  destacada?: boolean
}

/** Solo las opciones sin etiqueta de no disponible se pueden elegir. */
export function esSeleccionable<T extends string>(opcion: Opcion<T>): boolean {
  return opcion.etiquetaNoDisponible === undefined
}
