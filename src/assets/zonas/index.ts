// Fotos locales de las zonas para el selector, mientras la zona no tenga ilustración en la base
// (zonas.ilustracion_id). Cada zona va como <slug>.avif (la que bajan casi todos los teléfonos) y
// <slug>.webp (respaldo para Safari anterior a iOS 16).

const avif = import.meta.glob<string>('./*.avif', { eager: true, import: 'default' })
const webp = import.meta.glob<string>('./*.webp', { eager: true, import: 'default' })

export type FotoZona = { avif: string; webp: string }

/** Foto local de una zona, o null si no hay (o si falta alguno de los dos formatos). */
export function fotoLocalDeZona(slug: string): FotoZona | null {
  const urlAvif = avif[`./${slug}.avif`]
  const urlWebp = webp[`./${slug}.webp`]
  return urlAvif && urlWebp ? { avif: urlAvif, webp: urlWebp } : null
}
