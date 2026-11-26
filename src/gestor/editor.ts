import type { CamposFicha, FichaGestor, IDIOMAS_GESTOR } from '@/datos/gestor'

export type IdiomaGestor = (typeof IDIOMAS_GESTOR)[number]

/** Campos editables de una ficha; vacíos si todavía no existe. */
export function camposDe(ficha: FichaGestor | null): CamposFicha {
  return {
    titulo: ficha?.titulo ?? '',
    que_ves: ficha?.que_ves ?? '',
    historia: ficha?.historia ?? '',
    dato_santi: ficha?.dato_santi ?? '',
    transcripcion: ficha?.transcripcion ?? '',
  }
}

/** Campos del paso «Textos»; la transcripción se edita en «Narración», junto al audio. */
export const CAMPOS_TEXTOS = ['titulo', 'que_ves', 'historia', 'dato_santi'] as const
export const CAMPOS_NARRACION = ['transcripcion'] as const

/**
 * Si el borrador difiere de lo guardado (sin contar espacios al inicio o al final). Con `campos`, solo
 * mira esos campos.
 */
export function hayCambios(
  borrador: CamposFicha,
  ficha: FichaGestor | null,
  campos: readonly (keyof CamposFicha)[] = [...CAMPOS_TEXTOS, ...CAMPOS_NARRACION],
): boolean {
  const guardado = camposDe(ficha)
  return campos.some((campo) => borrador[campo].trim() !== guardado[campo].trim())
}

/**
 * Lo que se guarda desde un paso: los campos de ese paso con lo escrito y los demás con lo que ya está
 * guardado, para no guardar sin querer lo escrito en el otro paso.
 */
export function camposParaGuardar(
  borrador: CamposFicha,
  ficha: FichaGestor | null,
  campos: readonly (keyof CamposFicha)[],
): CamposFicha {
  const resultado = camposDe(ficha)
  for (const campo of campos) resultado[campo] = borrador[campo]
  return resultado
}
