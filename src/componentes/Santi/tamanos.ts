export type TamanoSanti = 'sm' | 'md' | 'lg'

/** Valores de los tokens --santi-sm/md/lg en px. `width`, `height` y `sizes` de una <img> no
 *  aceptan var(); la prueba de src/assets/santi revisa que coincidan con tokens.json. */
export const TAMANOS_SANTI: Record<TamanoSanti, number> = { sm: 64, md: 120, lg: 200 }
