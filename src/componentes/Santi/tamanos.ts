export type TamanoSanti = 'sm' | 'head' | 'md' | 'lg'

/** Valores de los tokens --santi-sm/head/md/lg en px. `width`, `height` y `sizes` de una <img> no
 *  aceptan var(); la prueba de src/assets/santi revisa que coincidan con tokens.json. */
export const TAMANOS_SANTI: Record<TamanoSanti, number> = { sm: 64, head: 88, md: 160, lg: 320 }
