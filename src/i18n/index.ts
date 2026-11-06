// Configuración de i18next. Todo texto de la interfaz sale de es.json, cak.json o en.json.
// Lo que falta en kaqchikel cae a español (fallbackLng) y se lista en PENDIENTE-cak.md.

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import {
  guardarIdioma,
  IDIOMA_POR_DEFECTO,
  IDIOMAS,
  leerIdioma,
  type Idioma,
} from '@/lib/preferencias'
import cak from './cak.json'
import en from './en.json'
import es from './es.json'

export const recursos = {
  es: { translation: es },
  cak: { translation: cak },
  en: { translation: en },
} as const

/** El idioma con que arranca la app: el guardado en el dispositivo o español. */
export function idiomaInicial(guardado: Idioma | null = leerIdioma()): Idioma {
  return guardado ?? IDIOMA_POR_DEFECTO
}

/** Idioma activo, acotado a los que tiene la app. */
export function idiomaActual(): Idioma {
  return IDIOMAS.find((idioma) => idioma === i18n.resolvedLanguage) ?? IDIOMA_POR_DEFECTO
}

function aplicarIdiomaAlDocumento(idioma: string) {
  if (typeof document !== 'undefined') document.documentElement.lang = idioma
}

// Cada cambio de idioma se guarda en el dispositivo y actualiza <html lang>.
i18n.on('languageChanged', (idioma) => {
  aplicarIdiomaAlDocumento(idioma)
  const conocido = IDIOMAS.find((i) => i === idioma)
  if (conocido) guardarIdioma(conocido)
})

void i18n.use(initReactI18next).init({
  resources: recursos,
  lng: idiomaInicial(),
  fallbackLng: IDIOMA_POR_DEFECTO,
  supportedLngs: IDIOMAS,
  interpolation: { escapeValue: false }, // React ya escapa el texto.
  initAsync: false,
})

aplicarIdiomaAlDocumento(i18n.language)

export default i18n
