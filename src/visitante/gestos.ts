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

/** Cuánto más que "cubrir" acerca el zoom automático al tocar un punto. */
const ACERCAMIENTO_PUNTO = 1.6

/** Paso de los botones de acercar y alejar. */
export const FACTOR_CONTROL = 1.5

/** Margen (px) con el borde del lienzo para considerar que un punto se ve bien. */
const MARGEN_VISIBLE = 48

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

/** Coloca en el centro un punto de la escena (x e y de 0 a 1), a la escala dada y dentro de límites. */
function centrarEn(escala: number, lienzo: Lienzo, x: number, y: number): Vista {
  const base = tamanoBase(lienzo)
  return acotar(
    {
      escala,
      x: lienzo.ancho / 2 - x * base.ancho * escala,
      y: lienzo.alto / 2 - y * base.alto * escala,
    },
    lienzo,
  )
}

/**
 * Zoom automático al tocar un punto: lo centra y acerca, sin alejar si ya se estaba más cerca. Cerca
 * de un borde, `acotar` no lo deja en el centro pero sigue dentro del lienzo.
 */
export function enfocarPunto(vista: Vista, lienzo: Lienzo, x: number, y: number): Vista {
  const { cubrir, maxima } = escalas(lienzo)
  const escala = Math.min(maxima, Math.max(vista.escala, cubrir * ACERCAMIENTO_PUNTO))
  return centrarEn(escala, lienzo, x, y)
}

/** Si el punto quedó fuera de la vista (o pegado al borde), lo centra sin cambiar la escala. */
export function traerAVista(vista: Vista, lienzo: Lienzo, x: number, y: number): Vista {
  const base = tamanoBase(lienzo)
  const px = vista.x + x * base.ancho * vista.escala
  const py = vista.y + y * base.alto * vista.escala
  const visible =
    px >= MARGEN_VISIBLE &&
    px <= lienzo.ancho - MARGEN_VISIBLE &&
    py >= MARGEN_VISIBLE &&
    py <= lienzo.alto - MARGEN_VISIBLE
  return visible ? vista : centrarEn(vista.escala, lienzo, x, y)
}

/**
 * El lienzo cambió de tamaño (girar el teléfono, aparece o se cierra algo a su alrededor): conserva
 * el mismo lugar de la fachada en el centro y la misma proporción respecto a "cubrir".
 */
export function reajustar(vista: Vista, antes: Lienzo, ahora: Lienzo): Vista {
  const base = tamanoBase(antes)
  if (base.ancho <= 0 || base.alto <= 0) return vistaInicial(ahora)
  const x = (antes.ancho / 2 - vista.x) / (base.ancho * vista.escala)
  const y = (antes.alto / 2 - vista.y) / (base.alto * vista.escala)
  const escala = (vista.escala * escalas(ahora).cubrir) / escalas(antes).cubrir
  return centrarEn(escala, ahora, x, y)
}

/** Dos vistas son la misma salvo errores de redondeo. */
export function mismaVista(a: Vista, b: Vista): boolean {
  return (
    Math.abs(a.escala - b.escala) < 0.001 && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5
  )
}
