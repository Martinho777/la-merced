import type { CamposFicha, FichaGestor, IDIOMAS_GESTOR } from '@/datos/gestor'

export type IdiomaGestor = (typeof IDIOMAS_GESTOR)[number]

/** Campos editables de una ficha; vacíos si todavía no existe. */
export function camposDe(ficha: FichaGestor | null): CamposFicha {
  return {
    titulo: ficha?.titulo ?? '',
    que_ves: ficha?.que_ves ?? '',
    historia: ficha?.historia ?? '',
    dato_santi: ficha?.dato_santi ?? '',
  }
}

/** Si el borrador difiere de lo guardado (sin contar espacios al inicio o al final). */
export function hayCambios(borrador: CamposFicha, ficha: FichaGestor | null): boolean {
  const guardado = camposDe(ficha)
  return (Object.keys(guardado) as (keyof CamposFicha)[]).some(
    (campo) => borrador[campo].trim() !== guardado[campo].trim(),
  )
}
