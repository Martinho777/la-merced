import { useEffect, useState } from 'react'
import { obtenerRecorrido, recorridoCargado, type Recorrido } from '@/datos/recorrido'
import type { Idioma } from '@/lib/preferencias'

export type EstadoRecorrido =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'sinZona' }
  | { tipo: 'listo'; recorrido: Recorrido }

function estadoDe(recorrido: Recorrido | null): EstadoRecorrido {
  return recorrido ? { tipo: 'listo', recorrido } : { tipo: 'sinZona' }
}

/**
 * Carga el recorrido de una zona con sus estados. Si ya se cargó en esta sesión se muestra de una vez.
 * Al cambiar de idioma se vuelve a pedir; mientras tanto se sigue mostrando el anterior.
 */
export function useRecorrido(slug: string | null, idioma: Idioma) {
  const [estado, setEstado] = useState<EstadoRecorrido>(() => {
    const cargado = slug ? recorridoCargado(slug, idioma) : undefined
    return cargado === undefined ? { tipo: 'cargando' } : estadoDe(cargado)
  })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    if (!slug) return
    let vigente = true
    obtenerRecorrido(slug, idioma)
      .then((recorrido) => {
        if (vigente) setEstado(estadoDe(recorrido))
      })
      .catch(() => {
        if (vigente) setEstado({ tipo: 'error' })
      })
    return () => {
      vigente = false
    }
  }, [slug, idioma, intento])

  function reintentar() {
    setEstado({ tipo: 'cargando' })
    setIntento((n) => n + 1)
  }

  return { estado, reintentar }
}
