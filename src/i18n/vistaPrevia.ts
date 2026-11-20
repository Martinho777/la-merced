// Vista previa del gestor: el editor de textos (src/gestor/EditorTextos.tsx) muestra la app real dentro
// de un iframe con ?vista-previa y le manda por postMessage los textos que el admin está escribiendo.
//
// Solo se activa dentro de un iframe, con el parámetro en la URL y con mensajes del mismo origen. En ese
// modo la app no guarda nada en el dispositivo (idioma ni copia de textos): el iframe comparte el
// localStorage con la app del admin.

import type { i18n as I18n } from 'i18next'
import type { FilaTexto } from '@/datos/textos'
import { IDIOMAS, type Idioma } from '@/lib/preferencias'
import { aplicarTextos, textosValidos } from './textosBase'

export const PARAM_VISTA_PREVIA = 'vista-previa'

/** Del gestor al iframe: los textos de la pantalla en un idioma y cuál resaltar. */
export type MensajeVistaPrevia = {
  tipo: 'textos'
  idioma: Idioma
  textos: Record<string, string>
  /** Texto visible que se marca en la pantalla (el del campo enfocado), o null. */
  resaltar: string | null
}

/** Del iframe al gestor: la app ya cargó y puede recibir textos. */
export type AvisoVistaPrevia = { tipo: 'lista' }

/** Atributo que marca el texto resaltado (estilo en src/app/estilos.css). */
export const ATRIBUTO_RESALTADO = 'data-vista-previa'

type Ventana = Pick<Window, 'parent' | 'location'>

/** Si esta ventana es la vista previa del gestor. */
export function esVistaPrevia(ventana: Ventana | undefined): boolean {
  if (!ventana || ventana.parent === ventana) return false
  return new URLSearchParams(ventana.location.search).has(PARAM_VISTA_PREVIA)
}

/** Se calcula una vez al abrir: después la app puede navegar y perder el parámetro. */
export const EN_VISTA_PREVIA = esVistaPrevia(typeof window === 'undefined' ? undefined : window)

/** Valida un mensaje recibido; null si no tiene la forma esperada. */
export function leerMensaje(datos: unknown): MensajeVistaPrevia | null {
  if (typeof datos !== 'object' || datos === null) return null
  const m = datos as Record<string, unknown>
  if (m.tipo !== 'textos') return null
  const idioma = IDIOMAS.find((i) => i === m.idioma)
  if (!idioma || typeof m.textos !== 'object' || m.textos === null) return null
  const textos = Object.fromEntries(
    Object.entries(m.textos).filter((par): par is [string, string] => typeof par[1] === 'string'),
  )
  const resaltar = typeof m.resaltar === 'string' && m.resaltar.trim() ? m.resaltar : null
  return { tipo: 'textos', idioma, textos, resaltar }
}

/** Marca el elemento cuyo texto es exactamente `texto` (y quita la marca anterior). */
export function resaltarTexto(documento: Document, texto: string | null): void {
  for (const marcado of documento.querySelectorAll(`[${ATRIBUTO_RESALTADO}]`)) {
    marcado.removeAttribute(ATRIBUTO_RESALTADO)
  }
  if (!texto) return
  const buscado = texto.trim()
  const recorrido = documento.createTreeWalker(documento.body, NodeFilter.SHOW_TEXT)
  for (let nodo = recorrido.nextNode(); nodo; nodo = recorrido.nextNode()) {
    const elemento = nodo.parentElement
    if (elemento && nodo.nodeValue?.trim() === buscado) {
      elemento.setAttribute(ATRIBUTO_RESALTADO, '')
      // Solo dentro de la vista previa: scrollIntoView movería también la página del gestor.
      const caja = elemento.getBoundingClientRect()
      const ventana = documento.defaultView
      if (ventana && (caja.top < 0 || caja.bottom > ventana.innerHeight)) {
        ventana.scrollBy({ top: caja.top - ventana.innerHeight / 3 })
      }
      return
    }
  }
}

/**
 * Escucha los textos del gestor. Espera a que termine la carga de los textos de la base (`base`) para
 * que no pisen lo que el admin escribe, y entonces avisa al gestor que está lista.
 */
export function iniciarVistaPrevia(i18n: I18n, base: Promise<unknown>, ventana: Window = window) {
  const origen = ventana.location.origin
  let ultimo: MensajeVistaPrevia | null = null
  let lista = false

  const aplicar = (mensaje: MensajeVistaPrevia) => {
    const filas: FilaTexto[] = Object.entries(mensaje.textos).map(([clave, texto]) => ({
      clave,
      idioma: mensaje.idioma,
      texto,
    }))
    aplicarTextos(i18n, textosValidos(filas))
    // Dos cuadros: el primero deja que React pinte el texto nuevo.
    const resaltar = () =>
      ventana.requestAnimationFrame(() =>
        ventana.requestAnimationFrame(() => resaltarTexto(ventana.document, mensaje.resaltar)),
      )
    if (i18n.language === mensaje.idioma) resaltar()
    else void i18n.changeLanguage(mensaje.idioma).then(resaltar)
  }

  ventana.addEventListener('message', (evento: MessageEvent) => {
    if (evento.origin !== origen || evento.source !== ventana.parent) return
    const mensaje = leerMensaje(evento.data)
    if (!mensaje) return
    ultimo = mensaje
    if (lista) aplicar(mensaje)
  })

  void base.finally(() => {
    lista = true
    if (ultimo) aplicar(ultimo)
    const aviso: AvisoVistaPrevia = { tipo: 'lista' }
    ventana.parent.postMessage(aviso, origen)
  })
}
