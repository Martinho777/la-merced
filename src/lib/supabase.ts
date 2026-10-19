// Cliente único de Supabase. Solo src/datos/ y src/lib/ lo importan.

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/tipos-db'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const clavePublica = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !clavePublica) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. ' +
      'Copia .env.example a .env.local y llénalo con los datos del proyecto de Supabase ' +
      '(en Vercel, revisa Settings → Environment Variables).',
  )
}

export const supabase = createClient<Database>(url, clavePublica)
