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
