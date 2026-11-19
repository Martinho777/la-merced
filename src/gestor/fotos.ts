import type { DatosFoto, FotoGestor } from '@/datos/fotos'

export const datosVacios: DatosFoto = {
  textoAlternativoEs: '',
  textoAlternativoEn: '',
  credito: '',
  fechaOriginal: '',
  derechos: '',
}

/** Orden de una foto nueva: después de la última. */
export function siguienteOrden(fotos: readonly Pick<FotoGestor, 'orden'>[]): number {
  return fotos.reduce((maximo, foto) => Math.max(maximo, foto.orden + 1), 0)
}

export type DatoFoto = 'textoAlternativo' | 'credito' | 'derechos'

/**
 * Datos que le faltan a una foto. El texto alternativo siempre (accesibilidad); el crédito y el
 * permiso de publicación, solo en las históricas (vienen de un archivo o colección).
 */
export function faltantesFoto(
  foto: Pick<FotoGestor, 'tipo' | 'textoAlternativoEs' | 'credito' | 'derechos'>,
): DatoFoto[] {
  const faltan: DatoFoto[] = []
  if (!foto.textoAlternativoEs.trim()) faltan.push('textoAlternativo')
  if (foto.tipo === 'foto_historica') {
    if (!foto.credito.trim()) faltan.push('credito')
    if (!foto.derechos.trim()) faltan.push('derechos')
  }
  return faltan
}
