// Pasos del editor de un punto y qué le falta a cada uno. Va aparte de la pantalla para probarlo sin
// DOM. Lo "obligatorio" es lo que el visitante necesita para ver la ficha completa; la base no lo
// exige, así que la lista avisa pero no bloquea enviar a revisión.

import type { CamposFicha, DetallePunto } from '@/datos/gestor'

export const PASOS = ['textos', 'narracion', 'fotos', 'fuentes', 'revision'] as const
export type Paso = (typeof PASOS)[number]

/** Completo: hecho. Pendiente: falta algo obligatorio. Opcional: falta, pero no es obligatorio. */
export type EstadoPaso = 'completo' | 'pendiente' | 'opcional'

/** Lo que se sabe de las fotos y las fuentes (null mientras cargan). */
export type ResumenMedios = {
  fotos: { detalle: boolean; historicas: number } | null
  fuentes: number | null
}

export type ClaveRequisito =
  | 'nombreEs'
  | 'queVesEs'
  | 'historiaEs'
  | 'datoSantiEs'
  | 'fichaEn'
  | 'fichaCak'
  | 'narracionEs'
  | 'transcripcionEs'
  | 'fotoDetalle'
  | 'fotosHistoricas'
  | 'fuentes'

export type Requisito = {
  clave: ClaveRequisito
  paso: Paso
  obligatorio: boolean
  cumplido: boolean
}

const lleno = (texto: string | null | undefined) => Boolean(texto?.trim())

/** Lista de lo que tiene y lo que le falta al punto, en el orden de los pasos. */
export function requisitos(punto: DetallePunto, medios: ResumenMedios): Requisito[] {
  const es = punto.fichas.es
  const en = punto.fichas.en
  const cak = punto.fichas.cak
  return [
    { clave: 'nombreEs', paso: 'textos', obligatorio: true, cumplido: lleno(es?.titulo) },
    { clave: 'queVesEs', paso: 'textos', obligatorio: true, cumplido: lleno(es?.que_ves) },
    { clave: 'historiaEs', paso: 'textos', obligatorio: true, cumplido: lleno(es?.historia) },
    { clave: 'datoSantiEs', paso: 'textos', obligatorio: false, cumplido: lleno(es?.dato_santi) },
    { clave: 'fichaEn', paso: 'textos', obligatorio: false, cumplido: lleno(en?.titulo) },
    { clave: 'fichaCak', paso: 'textos', obligatorio: false, cumplido: lleno(cak?.titulo) },
    { clave: 'narracionEs', paso: 'narracion', obligatorio: false, cumplido: Boolean(es?.audio) },
    {
      clave: 'transcripcionEs',
      paso: 'narracion',
      obligatorio: false,
      cumplido: lleno(es?.transcripcion),
    },
    {
      clave: 'fotoDetalle',
      paso: 'fotos',
      obligatorio: true,
      cumplido: medios.fotos?.detalle ?? false,
    },
    {
      clave: 'fotosHistoricas',
      paso: 'fotos',
      obligatorio: false,
      cumplido: (medios.fotos?.historicas ?? 0) > 0,
    },
    { clave: 'fuentes', paso: 'fuentes', obligatorio: true, cumplido: (medios.fuentes ?? 0) > 0 },
  ]
}

/**
 * Estado de un paso: completo si cumple todo lo suyo; pendiente si le falta algo obligatorio;
 * opcional si solo le falta lo opcional. La revisión está completa cuando la ficha en español está
 * aprobada.
 */
export function estadoDePaso(paso: Paso, punto: DetallePunto, medios: ResumenMedios): EstadoPaso {
  if (paso === 'revision') return punto.fichas.es?.estado === 'aprobado' ? 'completo' : 'pendiente'
  const delPaso = requisitos(punto, medios).filter((r) => r.paso === paso)
  if (delPaso.every((r) => r.cumplido)) return 'completo'
  return delPaso.some((r) => r.obligatorio && !r.cumplido) ? 'pendiente' : 'opcional'
}

/** El paso de la URL (?paso=…), o el primero si falta o no existe. */
export function pasoDe(valor: string | null): Paso {
  return PASOS.find((paso) => paso === valor) ?? 'textos'
}

/**
 * Avance del punto para la línea de progreso: cuántos de los requisitos (obligatorios y opcionales)
 * cumple. Llega al total solo cuando todo está lleno.
 */
export function avanceDe(
  punto: DetallePunto,
  medios: ResumenMedios,
): { hechos: number; total: number } {
  const lista = requisitos(punto, medios)
  return { hechos: lista.filter((r) => r.cumplido).length, total: lista.length }
}

/**
 * El punto con lo escrito en los textos aunque todavía no esté guardado, para que la línea de
 * progreso avance mientras se llenan los campos.
 */
export function conBorradores(
  punto: DetallePunto,
  borradores: Record<keyof DetallePunto['fichas'], CamposFicha> | null,
): DetallePunto {
  if (!borradores) return punto
  const fichas = { ...punto.fichas }
  for (const idioma of Object.keys(fichas) as (keyof DetallePunto['fichas'])[]) {
    const ficha = fichas[idioma]
    const borrador = borradores[idioma]
    fichas[idioma] = ficha
      ? { ...ficha, ...borrador }
      : borrador.titulo.trim()
        ? {
            id: '',
            estado: 'borrador',
            revision: null,
            audio: null,
            ...borrador,
          }
        : null
  }
  return { ...punto, fichas }
}
