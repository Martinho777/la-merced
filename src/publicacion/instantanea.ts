// Instantánea pública de la guía: el JSON estático que genera «Publicar», que se despliega con la app
// en /respaldo/publicacion.json y que la app del visitante lee si la base falla o no responde.
//
// Este archivo no importa nada (ni alias `@/`): lo usan la app, la función de Vercel `api/publicar.ts`
// y las pruebas. Solo arma el JSON a partir de filas que ya vienen filtradas por las reglas de acceso
// del visitante (fichas aprobadas); aun así vuelve a filtrar por estado, por si acaso.

export const FORMATO_INSTANTANEA = 1
export const RUTA_INSTANTANEA = '/respaldo/publicacion.json'

export type IdiomaPublico = 'es' | 'cak' | 'en'
export const IDIOMAS_PUBLICOS: readonly IdiomaPublico[] = ['es', 'cak', 'en']
export type NivelPublico = 'documentado' | 'probable' | 'especulativo'
const NIVELES: readonly NivelPublico[] = ['documentado', 'probable', 'especulativo']

// ---------------------------------------------------------------------------
// Entrada: filas tal como las devuelve la base a la clave pública
// ---------------------------------------------------------------------------

export type FilaZonaPublica = {
  slug: string
  orden: number
  disponible: boolean
  usa_camara: boolean
  contorno: { ruta: string } | null
  ilustracion: { ruta: string; texto_alternativo: unknown } | null
}

export type FilaMedioPublico = {
  id: string
  tipo: string
  ruta: string
  idioma: string | null
  orden: number
  credito: string | null
  fecha_original: string | null
  derechos: string | null
  duracion_s: number | null
  texto_alternativo: unknown
}

export type FilaFichaPublica = {
  idioma: string
  estado: string
  titulo: string
  que_ves: string | null
  historia: string | null
  dato_santi: string | null
  transcripcion: string | null
  audio_id: string | null
}

export type FilaPuntoPublico = {
  id: string
  slug: string
  orden: number
  es_esencial: boolean
  pos_x: number | null
  pos_y: number | null
  tiene_3d: boolean
  zona: string
  fichas: FilaFichaPublica[]
  medios: FilaMedioPublico[]
  fuentes: { nivel_confianza: string; nota: string | null; cita: string; url: string | null }[]
}

export type FilaTextoPublico = { clave: string; idioma: string; texto: string }

export type DatosPublicos = {
  zonas: FilaZonaPublica[]
  puntos: FilaPuntoPublico[]
  textos: FilaTextoPublico[]
}

// ---------------------------------------------------------------------------
// Salida: la instantánea
// ---------------------------------------------------------------------------

export type TextosPorIdioma = Partial<Record<IdiomaPublico, string>>

export type ZonaPublicada = {
  slug: string
  orden: number
  disponible: boolean
  usa_camara: boolean
  totalPuntos: number
  urlContorno: string | null
  ilustracion: { url: string; textoAlternativo: TextosPorIdioma } | null
}

export type FichaPublicada = {
  idioma: IdiomaPublico
  titulo: string
  que_ves: string | null
  historia: string | null
  dato_santi: string | null
  transcripcion: string | null
  audio: { url: string; duracionS: number | null } | null
}

export type FotoPublicada = {
  url: string
  textoAlternativo: TextosPorIdioma
  credito: string | null
  fecha: string | null
  derechos: string | null
}

export type PuntoPublicado = {
  id: string
  slug: string
  zona: string
  orden: number
  es_esencial: boolean
  pos_x: number | null
  pos_y: number | null
  tiene_3d: boolean
  /** Solo las fichas aprobadas, una por idioma. */
  fichas: FichaPublicada[]
  /** Fotos y fuentes solo si el punto tiene al menos una ficha aprobada. */
  foto: FotoPublicada | null
  archivo: (FotoPublicada & { id: string })[]
  fuentes: { cita: string; url: string | null; nivel: NivelPublico; nota: string | null }[]
}

export type Instantanea = {
  formato: typeof FORMATO_INSTANTANEA
  version: number
  generadoEn: string
  idiomas: IdiomaPublico[]
  zonas: ZonaPublicada[]
  puntos: PuntoPublicado[]
  textos: { clave: string; idioma: IdiomaPublico; texto: string }[]
}

export type ResumenInstantanea = {
  zonas: number
  puntos: number
  fichas: number
  fichasPorIdioma: Record<IdiomaPublico, number>
  fotos: number
  audios: number
  fuentes: number
  textos: number
}

// ---------------------------------------------------------------------------

const esIdioma = (valor: unknown): valor is IdiomaPublico =>
  typeof valor === 'string' && (IDIOMAS_PUBLICOS as readonly string[]).includes(valor)

const limpio = (texto: string | null | undefined) => texto?.trim() || null

function textosPorIdioma(valor: unknown): TextosPorIdioma {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return {}
  const resultado: TextosPorIdioma = {}
  for (const [idioma, texto] of Object.entries(valor)) {
    if (esIdioma(idioma) && typeof texto === 'string' && texto.trim()) {
      resultado[idioma] = texto.trim()
    }
  }
  return resultado
}

function fotoPublicada(medio: FilaMedioPublico, aUrl: (ruta: string) => string): FotoPublicada {
  return {
    url: aUrl(medio.ruta),
    textoAlternativo: textosPorIdioma(medio.texto_alternativo),
    credito: limpio(medio.credito),
    fecha: limpio(medio.fecha_original),
    derechos: limpio(medio.derechos),
  }
}

function puntoPublicado(punto: FilaPuntoPublico, aUrl: (ruta: string) => string): PuntoPublicado {
  const medios = [...punto.medios].sort((a, b) => a.orden - b.orden || a.id.localeCompare(b.id))
  const fichas: FichaPublicada[] = []

  for (const idioma of IDIOMAS_PUBLICOS) {
    const ficha = punto.fichas.find((f) => f.idioma === idioma && f.estado === 'aprobado')
    if (!ficha || !ficha.titulo.trim()) continue
    // El audio solo si es el que apunta la ficha y está en su mismo idioma.
    const audio = ficha.audio_id
      ? medios.find((m) => m.id === ficha.audio_id && m.tipo === 'audio' && m.idioma === idioma)
      : undefined
    fichas.push({
      idioma,
      titulo: ficha.titulo.trim(),
      que_ves: limpio(ficha.que_ves),
      historia: limpio(ficha.historia),
      dato_santi: limpio(ficha.dato_santi),
      transcripcion: limpio(ficha.transcripcion),
      audio: audio ? { url: aUrl(audio.ruta), duracionS: audio.duracion_s } : null,
    })
  }

  // Un punto sin ninguna ficha aprobada aparece en el mapa, pero sin fotos ni fuentes: lo que
  // todavía está en revisión no se adelanta al público.
  const conFicha = fichas.length > 0
  const foto = conFicha ? medios.find((m) => m.tipo === 'foto') : undefined
  return {
    id: punto.id,
    slug: punto.slug,
    zona: punto.zona,
    orden: punto.orden,
    es_esencial: punto.es_esencial,
    pos_x: punto.pos_x,
    pos_y: punto.pos_y,
    tiene_3d: punto.tiene_3d,
    fichas,
    foto: foto ? fotoPublicada(foto, aUrl) : null,
    archivo: conFicha
      ? medios
          .filter((m) => m.tipo === 'foto_historica')
          .map((m) => ({ ...fotoPublicada(m, aUrl), id: m.id }))
      : [],
    fuentes: conFicha
      ? punto.fuentes
          .filter((f) => (NIVELES as readonly string[]).includes(f.nivel_confianza))
          .map((f) => ({
            cita: f.cita.trim(),
            url: limpio(f.url),
            nivel: f.nivel_confianza as NivelPublico,
            nota: limpio(f.nota),
          }))
          .sort(
            (a, b) =>
              NIVELES.indexOf(a.nivel) - NIVELES.indexOf(b.nivel) ||
              a.cita.localeCompare(b.cita, 'es'),
          )
      : [],
  }
}

/** Arma la instantánea. Determinista: los mismos datos dan el mismo JSON (salvo versión y fecha). */
export function construirInstantanea(
  datos: DatosPublicos,
  opciones: { version: number; generadoEn: string; aUrl: (ruta: string) => string },
): Instantanea {
  const { aUrl } = opciones
  const puntos = [...datos.puntos]
    .sort((a, b) => a.zona.localeCompare(b.zona) || a.orden - b.orden)
    .map((p) => puntoPublicado(p, aUrl))

  const zonas = [...datos.zonas]
    .sort((a, b) => a.orden - b.orden)
    .map((zona) => ({
      slug: zona.slug,
      orden: zona.orden,
      disponible: zona.disponible,
      usa_camara: zona.usa_camara,
      totalPuntos: puntos.filter((p) => p.zona === zona.slug).length,
      urlContorno: zona.contorno ? aUrl(zona.contorno.ruta) : null,
      ilustracion: zona.ilustracion
        ? {
            url: aUrl(zona.ilustracion.ruta),
            textoAlternativo: textosPorIdioma(zona.ilustracion.texto_alternativo),
          }
        : null,
    }))

  const textos = datos.textos
    .filter((t) => esIdioma(t.idioma) && t.texto.trim())
    .map((t) => ({ clave: t.clave, idioma: t.idioma as IdiomaPublico, texto: t.texto }))
    .sort((a, b) => a.clave.localeCompare(b.clave) || a.idioma.localeCompare(b.idioma))

  return {
    formato: FORMATO_INSTANTANEA,
    version: opciones.version,
    generadoEn: opciones.generadoEn,
    idiomas: [...IDIOMAS_PUBLICOS],
    zonas,
    puntos,
    textos,
  }
}

export function resumirInstantanea(instantanea: Instantanea): ResumenInstantanea {
  const fichas = instantanea.puntos.flatMap((p) => p.fichas)
  const fichasPorIdioma = { es: 0, cak: 0, en: 0 }
  for (const ficha of fichas) fichasPorIdioma[ficha.idioma] += 1
  return {
    zonas: instantanea.zonas.length,
    puntos: instantanea.puntos.length,
    fichas: fichas.length,
    fichasPorIdioma,
    fotos: instantanea.puntos.reduce((n, p) => n + (p.foto ? 1 : 0) + p.archivo.length, 0),
    audios: fichas.filter((f) => f.audio).length,
    fuentes: instantanea.puntos.reduce((n, p) => n + p.fuentes.length, 0),
    textos: instantanea.textos.length,
  }
}

/** Todas las URLs de medios que la instantánea referencia (para comprobar que se pueden abrir). */
export function urlsDeMedios(instantanea: Instantanea): string[] {
  const urls = new Set<string>()
  for (const zona of instantanea.zonas) {
    if (zona.urlContorno) urls.add(zona.urlContorno)
    if (zona.ilustracion) urls.add(zona.ilustracion.url)
  }
  for (const punto of instantanea.puntos) {
    if (punto.foto) urls.add(punto.foto.url)
    for (const registro of punto.archivo) urls.add(registro.url)
    for (const ficha of punto.fichas) if (ficha.audio) urls.add(ficha.audio.url)
  }
  return [...urls].sort()
}

/** El texto exacto que se despliega. */
export function serializarInstantanea(instantanea: Instantanea): string {
  return `${JSON.stringify(instantanea, null, 2)}\n`
}

/** Huella SHA-256 en hexadecimal (Web Crypto: navegador y Node 24). */
export async function sha256(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto)
  const huella = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(huella)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Comprueba que un valor leído (p. ej. de /respaldo/publicacion.json) tenga la forma esperada. */
export function esInstantanea(valor: unknown): valor is Instantanea {
  if (typeof valor !== 'object' || valor === null) return false
  const v = valor as Partial<Instantanea>
  return (
    v.formato === FORMATO_INSTANTANEA &&
    typeof v.version === 'number' &&
    typeof v.generadoEn === 'string' &&
    Array.isArray(v.zonas) &&
    Array.isArray(v.puntos) &&
    Array.isArray(v.textos)
  )
}
