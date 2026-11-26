// Seguimiento de una publicación desde el gestor. Va aparte de la pantalla para probarlo sin DOM.
//
// «Publicar» tiene tres momentos y la pantalla solo dice «Publicada» al final:
//   generando   el servidor arma la instantánea (la respuesta de /api/publicar)
//   desplegando Vercel construye la app; se consulta el sitio cada `INTERVALO_MS`
//   publicada   el sitio ya sirve /respaldo/publicacion.json con la huella de esta publicación
// Si pasa `LIMITE_MS` sin verlo, la publicación queda fallida y producción sigue con la anterior.

import type { Desplegada } from '@/datos/publicacion'

export const INTERVALO_MS = 10_000
export const LIMITE_MS = 15 * 60 * 1000

export type Comprobacion = 'publicada' | 'esperando' | 'vencida'

/** Compara lo que sirve el sitio con la publicación esperada. Solo cuenta la huella exacta. */
export function comprobarDespliegue(
  desplegada: Desplegada,
  esperada: { version: number; sha256: string },
  transcurridoMs: number,
): Comprobacion {
  if (desplegada && desplegada.version === esperada.version) {
    // Misma versión con otra huella: el despliegue no lleva el JSON generado.
    if (desplegada.sha256 === esperada.sha256) return 'publicada'
  }
  return transcurridoMs >= LIMITE_MS ? 'vencida' : 'esperando'
}
