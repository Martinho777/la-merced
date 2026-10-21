// Imágenes de Santi. Los WebP los genera `npm run santi` desde santi-originales/; aquí solo se
// cargan con import.meta.glob y se exponen con tipos. Si agregas un original, agrega su pose a POSES
// (la prueba de este módulo falla si la lista y los archivos no coinciden).

export const POSES = [
  'celebrate',
  'celebrate-fx',
  'encourage',
  'excited',
  'excited-fx',
  'goodbye',
  'head-love',
  'head-sad',
  'head-smile',
  'head-surprised',
  'head-talk-0',
  'head-talk-1',
  'head-talk-2',
  'head-talk-3',
  'head-talk-closed',
  'head-talk-o',
  'head-wink',
  'idle',
  'oops',
  'phone',
  'point',
  'reading',
  'selfie',
  'shh',
  'sleep',
  'sleep-fx',
  'talk-0',
  'talk-1',
  'talk-2',
  'talk-3',
  'talk-o',
  'thinking',
  'thinking-fx',
  'wave',
] as const

export type SantiPose = (typeof POSES)[number]

/** Anchos generados por scripts/optimizar-santi.mjs, de menor a mayor. */
export const ANCHOS_SANTI = [384, 768] as const

/** Cuadros de habla del cuerpo completo, en orden (talk-0 es el pico cerrado, igual que idle). */
export const HABLA = [
  'talk-0',
  'talk-1',
  'talk-2',
  'talk-3',
] as const satisfies readonly SantiPose[]
/** Cuadro de la "o", aparte de la secuencia. */
export const HABLA_O = 'talk-o' satisfies SantiPose

/** Cuadros de habla de la cabeza, en orden (head-talk-0 es la sonrisa abierta, igual que head-smile). */
export const HABLA_CABEZA = [
  'head-talk-0',
  'head-talk-1',
  'head-talk-2',
  'head-talk-3',
] as const satisfies readonly SantiPose[]
export const HABLA_CABEZA_O = 'head-talk-o' satisfies SantiPose
/** Pico cerrado de la cabeza. */
export const HABLA_CABEZA_CERRADA = 'head-talk-closed' satisfies SantiPose

// Parpadeo: todavía no hay cuadros en santi-originales/; se agregan aquí cuando lleguen.

export const archivosSanti = import.meta.glob<string>('./*.webp', {
  eager: true,
  import: 'default',
})

function url(pose: SantiPose, ancho: number) {
  const archivo = archivosSanti[`./${pose}-${ancho}.webp`]
  if (!archivo) throw new Error(`Falta la imagen de Santi ${pose}-${ancho}.webp`)
  return archivo
}

/** `src` (el ancho menor) y `srcSet` con todos los anchos de una pose. */
export function imagenSanti(pose: SantiPose): { src: string; srcSet: string } {
  return {
    src: url(pose, ANCHOS_SANTI[0]),
    srcSet: ANCHOS_SANTI.map((ancho) => `${url(pose, ancho)} ${ancho}w`).join(', '),
  }
}
