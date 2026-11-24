// Textos de la interfaz guardados en la base (tabla textos_interfaz). La app los pone encima de los
// JSON de src/i18n (ver src/i18n/textosBase.ts); el admin los edita desde el gestor.

import { supabase } from '@/lib/supabase'
import type { Enums } from '@/lib/tipos-db'

export type FilaTexto = { clave: string; idioma: Enums<'idioma'>; texto: string }

/** Si la base tarda más que esto, la app sigue con los textos de los JSON. */
export const ESPERA_MAXIMA_MS = 5000

/** Todos los textos de la interfaz. Lanza un Error si la base no responde a tiempo o falla. */
export async function leerTextosInterfaz(): Promise<FilaTexto[]> {
  const { data, error } = await supabase
    .from('textos_interfaz')
    .select('clave, idioma, texto')
    .abortSignal(AbortSignal.timeout(ESPERA_MAXIMA_MS))

  if (error) throw new Error(`No se pudieron leer los textos de la interfaz: ${error.message}`)
  return data
}

/**
 * Guarda (crea o reemplaza) el texto de una clave en un idioma. Solo el admin puede (RLS); la base anota
 * quién y cuándo. El visitante lo ve la próxima vez que abre la app.
 */
export async function guardarTextoInterfaz(fila: FilaTexto): Promise<void> {
  const { error } = await supabase
    .from('textos_interfaz')
    .upsert(fila, { onConflict: 'clave,idioma' })

  if (error) throw new Error(`No se pudo guardar el texto: ${error.message}`)
}

/** Borra el texto de la base: la app vuelve a mostrar el de los JSON. */
export async function restaurarTextoInterfaz(
  clave: string,
  idioma: FilaTexto['idioma'],
): Promise<void> {
  const { data, error } = await supabase
    .from('textos_interfaz')
    .delete()
    .eq('clave', clave)
    .eq('idioma', idioma)
    .select('clave')

  if (error) throw new Error(`No se pudo restaurar el texto: ${error.message}`)
  // Sin permiso, la base no borra nada pero tampoco da error.
  if (data.length === 0) throw new Error('No se pudo restaurar el texto: la base no lo borró')
}
