// Pantalla temporal del Sprint 2: comprueba de punta a punta que la app lee de Supabase.
// La reemplaza la bienvenida (bloque 4).

import { useEffect, useState } from 'react'
import { obtenerPuntosDeZona, type PuntoConFicha } from '@/datos/puntos'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error'; mensaje: string }
  | { tipo: 'listo'; puntos: PuntoConFicha[] }

export function PantallaPrueba() {
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })

  useEffect(() => {
    let vigente = true
    obtenerPuntosDeZona('fachada-principal', 'es')
      .then((puntos) => vigente && setEstado({ tipo: 'listo', puntos }))
      .catch(
        (error: unknown) =>
          vigente &&
          setEstado({
            tipo: 'error',
            mensaje: error instanceof Error ? error.message : 'Error desconocido',
          }),
      )
    return () => {
      vigente = false
    }
  }, [])

  if (estado.tipo === 'cargando') {
    return <p aria-live="polite">Cargando…</p>
  }

  if (estado.tipo === 'error') {
    return (
      <div role="alert">
        <h1>No se pudo cargar el contenido</h1>
        <p className="error">{estado.mensaje}</p>
      </div>
    )
  }

  const puntoDePrueba = estado.puntos.find((p) => p.ficha)
  if (!puntoDePrueba?.ficha) {
    return (
      <div>
        <h1>Sin contenido todavía</h1>
        <p>La fachada principal no tiene puntos con una ficha aprobada.</p>
      </div>
    )
  }

  return (
    <article>
      <h1>{puntoDePrueba.ficha.titulo}</h1>
      <h2>Qué ves</h2>
      <p>{puntoDePrueba.ficha.que_ves}</p>
    </article>
  )
}
