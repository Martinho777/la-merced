// Respaldo estático de la app del visitante. Si la base falla o no responde en `ESPERA_BASE_MS`, las
// funciones de src/datos/ leen la última publicación desplegada con la app (/respaldo/publicacion.json,
// generada por «Publicar»). Ese archivo lo sirve Vercel junto con la app: no depende de la base.
// Los medios siguen en su URL pública de Storage.

import type { NivelConfianza } from '@/componentes/nivelConfianza'
import type { PuntoConFicha } from '@/datos/puntos'
import type { ResumenZona, ZonaConContorno } from '@/datos/zonas'
import {
  esInstantanea,
  RUTA_INSTANTANEA,
  type IdiomaPublico,
  type Instantanea,
  type TextosPorIdioma,
} from '@/publicacion/instantanea'

/** Cuánto se espera a la base antes de usar el respaldo. */
export const ESPERA_BASE_MS = 6000

export type OrigenDatos = 'base' | 'respaldo'
let origen: OrigenDatos = 'base'

/** De dónde salieron los últimos datos del visitante (para diagnóstico y pruebas). */
export const origenDatos = () => origen

let pedido: Promise<Instantanea> | null = null

/** La instantánea desplegada con la app. Se pide una vez por sesión; un fallo se puede reintentar. */
export function leerInstantanea(llamar: typeof fetch = fetch): Promise<Instantanea> {
  pedido ??= llamar(RUTA_INSTANTANEA, { cache: 'no-cache' })
    .then(async (respuesta) => {
      if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)
      const datos: unknown = await respuesta.json()
      if (!esInstantanea(datos)) throw new Error('formato desconocido')
      return datos
    })
    .catch((error: unknown) => {
      pedido = null
      throw new Error(`No hay respaldo estático disponible: ${(error as Error).message}`)
    })
  return pedido
}

/** Para las pruebas: olvida la instantánea leída. */
export function reiniciarRespaldo() {
  pedido = null
  origen = 'base'
}

/**
 * Pide a la base; si falla o tarda más de `espera`, usa el respaldo. Si el respaldo tampoco está,
 * lanza el error de la base (la pantalla muestra su estado de error con «Reintentar»).
 */
export async function conRespaldo<T>(
  desdeBase: (senal: AbortSignal) => Promise<T>,
  desdeRespaldo: (instantanea: Instantanea) => T,
  opciones: { espera?: number; leer?: () => Promise<Instantanea> } = {},
): Promise<T> {
  const control = new AbortController()
  const espera = opciones.espera ?? ESPERA_BASE_MS
  let temporizador: ReturnType<typeof setTimeout> | undefined
  const tiempo = new Promise<never>((_, rechazar) => {
    temporizador = setTimeout(() => {
      control.abort()
      rechazar(new Error(`La base no respondió en ${espera} ms.`))
    }, espera)
  })
  try {
    const resultado = await Promise.race([desdeBase(control.signal), tiempo])
    origen = 'base'
    return resultado
  } catch (errorBase) {
    try {
      const instantanea = await (opciones.leer ?? leerInstantanea)()
      origen = 'respaldo'
      console.info(
        `[La Merced] La base no respondió; se usa la publicación ${instantanea.version} (${instantanea.generadoEn}).`,
      )
      return desdeRespaldo(instantanea)
    } catch {
      throw errorBase
    }
  } finally {
    clearTimeout(temporizador)
  }
}

// ---------------------------------------------------------------------------
// De la instantánea a lo que esperan las pantallas
// ---------------------------------------------------------------------------

const enIdioma = (textos: TextosPorIdioma, idioma: IdiomaPublico) =>
  textos[idioma] ?? textos.es ?? ''

export function zonasDesdeInstantanea(instantanea: Instantanea): ResumenZona[] {
  return instantanea.zonas.map((zona) => ({
    slug: zona.slug,
    orden: zona.orden,
    disponible: zona.disponible,
    totalPuntos: zona.totalPuntos,
    ilustracion: zona.ilustracion
      ? { url: zona.ilustracion.url, textoAlternativo: zona.ilustracion.textoAlternativo }
      : null,
  }))
}

export function zonaDesdeInstantanea(
  instantanea: Instantanea,
  slug: string,
): ZonaConContorno | null {
  const zona = instantanea.zonas.find((z) => z.slug === slug)
  if (!zona) return null
  return {
    slug: zona.slug,
    usa_camara: zona.usa_camara,
    urlContorno: zona.urlContorno,
    urlIlustracion: zona.ilustracion?.url ?? null,
  }
}

/** Puntos de la zona con su ficha en `idioma` (o en español si no hay), como los da la base. */
export function puntosDesdeInstantanea(
  instantanea: Instantanea,
  slugZona: string,
  idioma: IdiomaPublico,
): PuntoConFicha[] {
  return instantanea.puntos
    .filter((p) => p.zona === slugZona)
    .sort((a, b) => a.orden - b.orden)
    .map((punto) => {
      const ficha =
        punto.fichas.find((f) => f.idioma === idioma) ??
        punto.fichas.find((f) => f.idioma === 'es') ??
        null
      return {
        id: punto.id,
        slug: punto.slug,
        orden: punto.orden,
        es_esencial: punto.es_esencial,
        pos_x: punto.pos_x,
        pos_y: punto.pos_y,
        tiene_3d: punto.tiene_3d,
        ficha: ficha && {
          idioma: ficha.idioma,
          titulo: ficha.titulo,
          que_ves: ficha.que_ves,
          historia: ficha.historia,
          dato_santi: ficha.dato_santi,
          transcripcion: ficha.transcripcion,
          // En el respaldo el audio ya viene resuelto; el id no hace falta.
          audio_id: null,
        },
        foto: punto.foto
          ? { url: punto.foto.url, textoAlternativo: enIdioma(punto.foto.textoAlternativo, idioma) }
          : null,
        audio: ficha?.audio ?? null,
        archivo: punto.archivo.map((registro) => ({
          id: registro.id,
          url: registro.url,
          textoAlternativo: enIdioma(registro.textoAlternativo, idioma),
          fecha: registro.fecha,
          credito: registro.credito,
        })),
        fuentes: punto.fuentes.map((f) => ({
          cita: f.cita,
          url: f.url,
          nivel: f.nivel as NivelConfianza,
          nota: f.nota,
        })),
      }
    })
}

export function textosDesdeInstantanea(instantanea: Instantanea) {
  return instantanea.textos.map((t) => ({ clave: t.clave, idioma: t.idioma, texto: t.texto }))
}
