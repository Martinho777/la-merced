// Imágenes locales de las zonas, mientras no estén en la base (zonas.ilustracion_id):
//
// - Foto del selector: <slug>.avif (la que bajan casi todos los teléfonos) y <slug>.webp (respaldo
//   para Safari anterior a iOS 16).
// - Ilustración del mapa: <slug>-ilustracion-{1600,3200}.webp.
//
// La ilustración de la fachada principal la genera scripts/preparar-fachada.mjs
// desde ilustraciones-originales/; no se edita a mano.

// Vite exige las opciones de import.meta.glob escritas en cada llamada (no en una variable).
const fotosAvif = import.meta.glob<string>('./*.avif', { eager: true, import: 'default' })
const fotosWebp = import.meta.glob<string>(['./*.webp', '!./*-ilustracion-*.webp'], {
  eager: true,
  import: 'default',
})
const ilustraciones = import.meta.glob<string>('./*-ilustracion-*.webp', {
  eager: true,
  import: 'default',
})

/** Anchos de la ilustración del mapa, de menor a mayor. */
export const ANCHOS_ILUSTRACION = [1600, 3200] as const

export type FotoZona = { avif: string; webp: string }

/** Foto local de una zona, o null si no hay (o si falta alguno de los dos formatos). */
export function fotoLocalDeZona(slug: string): FotoZona | null {
  const urlAvif = fotosAvif[`./${slug}.avif`]
  const urlWebp = fotosWebp[`./${slug}.webp`]
  return urlAvif && urlWebp ? { avif: urlAvif, webp: urlWebp } : null
}

/** Ilustración local del mapa de una zona (`src` el ancho menor, `srcSet` todos), o null. */
export function ilustracionLocalDeZona(slug: string): { src: string; srcSet: string } | null {
  const urls = ANCHOS_ILUSTRACION.map(
    (ancho) => ilustraciones[`./${slug}-ilustracion-${ancho}.webp`],
  )
  if (urls.some((url) => url === undefined)) return null
  return {
    src: urls[0]!,
    srcSet: urls.map((url, i) => `${url} ${ANCHOS_ILUSTRACION[i]}w`).join(', '),
  }
}
