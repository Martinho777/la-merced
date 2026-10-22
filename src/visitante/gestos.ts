// Vista del mapa con gestos (pellizcar para el zoom, un dedo para moverse), aparte de la pantalla
// para poder probarla sin DOM. Todas las medidas en píxeles CSS del lienzo.
//
// La escena (la ilustración, 2:1) mide a escala 1 el ancho del lienzo. La vista es su escala y su
// desplazamiento (x, y) desde la esquina superior izquierda del lienzo.

export type Vista = { escala: number; x: number; y: number }
export type Lienzo = { ancho: number; alto: number }
type Punto = { x: number; y: number }

/** Ancho / alto de la ilustración. */
export const PROPORCION = 2

/** Cuánto más que "cubrir" se puede acercar. */
const ACERCAMIENTO_MAXIMO = 3

const tamanoBase = (lienzo: Lienzo) => ({ ancho: lienzo.ancho, alto: lienzo.ancho / PROPORCION })

/**
 * Escalas útiles: `contener` deja ver la fachada entera; `cubrir` llena el lienzo (la vista inicial);
 * la máxima permite acercarse a los detalles.
 */
export function escalas(lienzo: Lienzo): { contener: number; cubrir: number; maxima: number } {
  const base = tamanoBase(lienzo)
  if (base.ancho <= 0 || base.alto <= 0) return { contener: 1, cubrir: 1, maxima: 1 }
  const contener = Math.min(lienzo.ancho / base.ancho, lienzo.alto / base.alto)
  const cubrir = Math.max(lienzo.ancho / base.ancho, lienzo.alto / base.alto)
  return { contener, cubrir, maxima: cubrir * ACERCAMIENTO_MAXIMO }
}

/** Ajusta una vista a sus límites: escala permitida y sin dejar huecos a los lados de la fachada. */
export function acotar(vista: Vista, lienzo: Lienzo): Vista {
  const { contener, maxima } = escalas(lienzo)
  const escala = Math.min(maxima, Math.max(contener, vista.escala))
  const base = tamanoBase(lienzo)
  // Si la escena es más chica que el lienzo en un eje, se centra; si es más grande, no se despega
  // de los bordes.
  const eje = (posicion: number, tamano: number, disponible: number) =>
    tamano <= disponible
      ? (disponible - tamano) / 2
      : Math.min(0, Math.max(disponible - tamano, posicion))
  return {
    escala,
    x: eje(vista.x, base.ancho * escala, lienzo.ancho),
    y: eje(vista.y, base.alto * escala, lienzo.alto),
  }
}

/** Vista inicial: la fachada llena el lienzo, centrada. */
export function vistaInicial(lienzo: Lienzo): Vista {
  const { cubrir } = escalas(lienzo)
  const base = tamanoBase(lienzo)
  return acotar(
    {
      escala: cubrir,
      x: (lienzo.ancho - base.ancho * cubrir) / 2,
      y: (lienzo.alto - base.alto * cubrir) / 2,
    },
    lienzo,
  )
}

export function mover(vista: Vista, lienzo: Lienzo, dx: number, dy: number): Vista {
  return acotar({ ...vista, x: vista.x + dx, y: vista.y + dy }, lienzo)
}

/** Cambia la escala por `factor` dejando quieto `punto` (bajo los dedos o el cursor). */
export function zoomEn(vista: Vista, lienzo: Lienzo, punto: Punto, factor: number): Vista {
  const { contener, maxima } = escalas(lienzo)
  const escala = Math.min(maxima, Math.max(contener, vista.escala * factor))
  const relacion = escala / vista.escala
  return acotar(
    {
      escala,
      x: punto.x - (punto.x - vista.x) * relacion,
      y: punto.y - (punto.y - vista.y) * relacion,
    },
    lienzo,
  )
}

/**
 * Doble toque: desde la fachada entera, acerca a "cubrir" en el punto tocado; desde cualquier otra
 * escala, muestra la fachada entera. Así todos los puntos se alcanzan sin arrastrar (WCAG 2.5.7).
 */
export function alternarZoom(vista: Vista, lienzo: Lienzo, punto: Punto): Vista {
  const { contener, cubrir } = escalas(lienzo)
  const objetivo = vista.escala <= contener + 0.01 ? cubrir : contener
  return zoomEn(vista, lienzo, punto, objetivo / vista.escala)
}
