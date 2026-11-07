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
