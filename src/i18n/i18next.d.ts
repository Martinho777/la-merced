// Tipos de las claves de traducción: t('clave') falla en typecheck si la clave no existe en es.json.

import 'i18next'
import type es from './es.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof es }
  }
}
