// Textos del gestor. Van en su propio namespace ("gestor") y se registran al cargar el chunk del
// gestor, así la app del visitante no los descarga. Por ahora solo en español (decisión del equipo,
// nov. 2026); kaqchikel e inglés se agregan con un archivo por idioma cuando haya traducción.

import i18n from '@/i18n'
import es from './es.json'

export const NAMESPACE_GESTOR = 'gestor'

// deep + overwrite: si el archivo cambia (recarga en caliente), se registra la versión nueva.
i18n.addResourceBundle('es', NAMESPACE_GESTOR, es, true, true)
