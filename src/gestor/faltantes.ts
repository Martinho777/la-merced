// Lista de faltantes por ficha, para pedir a la URL (el equipo de investigación) lo que falta. Va
// aparte de la pantalla para probarlo sin DOM. Solo señala: no corrige ni inventa contenido.
//
// Cada fila dice qué punto, en qué idioma, qué campo o archivo, qué problema y qué acción hace falta.
// El kaqchikel siempre lleva una fila de revisión lingüística: nadie del equipo técnico puede darlo
// por bueno.

export type IdiomaReporte = 'es' | 'en' | 'cak'
export const IDIOMAS_REPORTE: readonly IdiomaReporte[] = ['es', 'en', 'cak']

export type FichaReporte = {
  idioma: IdiomaReporte
  estado: 'borrador' | 'revision' | 'aprobado'
  titulo: string
  que_ves: string | null
  historia: string | null
  dato_santi: string | null
  transcripcion: string | null
  audio: { idioma: string | null } | null
}

export type FotoReporte = {
  tipo: 'foto' | 'foto_historica'
  ruta: string
  textoAlternativo: Partial<Record<IdiomaReporte, string>>
  credito: string | null
  fecha: string | null
  derechos: string | null
}

export type PuntoReporte = {
  id: string
  slug: string
  orden: number
  zona: string
  fichas: FichaReporte[]
  fotos: FotoReporte[]
  fuentes: { cita: string; url: string | null; tipo: string; nivel: string }[]
}

export type Gravedad = 'obligatorio' | 'recomendado' | 'revision'

export type Faltante = {
  /** Número de la ficha con dos dígitos, como lo nombra la URL (p. ej. "07"). */
  numero: string
  slug: string
  titulo: string
  idioma: IdiomaReporte | 'todos'
  campo: string
  problema: string
  accion: string
  gravedad: Gravedad
}

const NOMBRE_IDIOMA: Record<IdiomaReporte, string> = {
  es: 'español',
  en: 'inglés',
  cak: 'kaqchikel',
}

const vacio = (texto: string | null | undefined) => !texto?.trim()
const numeroDe = (orden: number) => String(orden).padStart(2, '0')

/**
 * Palabras que delatan contenido de prueba. Solo se buscan en títulos y citas, donde no aparecen en
 * una ficha real ("prueba de ello" sí puede estar en una historia).
 */
const PRUEBA = /\b(prueba|test|lorem)\b/i

/** Diferencia de largo que sugiere que dos idiomas no dicen lo mismo. */
export function largoDispar(base: string, otro: string): boolean {
  const a = base.trim().length
  const b = otro.trim().length
  if (a < 40 || b === 0) return false
  return b < a * 0.4 || b > a * 2.5
}

export function faltantesDePunto(punto: PuntoReporte): Faltante[] {
  const numero = numeroDe(punto.orden)
  const fichaEs = punto.fichas.find((f) => f.idioma === 'es')
  const titulo = fichaEs?.titulo.trim() || punto.fichas[0]?.titulo.trim() || punto.slug
  const filas: Faltante[] = []
  const agregar = (
    idioma: Faltante['idioma'],
    campo: string,
    problema: string,
    accion: string,
    gravedad: Gravedad = 'obligatorio',
  ) => filas.push({ numero, slug: punto.slug, titulo, idioma, campo, problema, accion, gravedad })

  // --- Fotos ---------------------------------------------------------------
  const detalle = punto.fotos.find((f) => f.tipo === 'foto')
  if (!detalle) {
    agregar('todos', `Foto del punto (${numero}.jpg)`, 'Falta', 'URL: enviar la foto del detalle')
  } else {
    for (const idioma of ['en', 'cak'] as const) {
      if (vacio(detalle.textoAlternativo[idioma])) {
        agregar(
          idioma,
          'Texto alternativo de la foto del punto',
          'Falta',
          `URL: entregar la traducción al ${NOMBRE_IDIOMA[idioma]}`,
          'recomendado',
        )
      }
    }
    if (vacio(detalle.credito)) {
      agregar('todos', 'Crédito de la foto del punto', 'Falta', 'URL: indicar autor', 'recomendado')
    }
  }
  punto.fotos
    .filter((f) => f.tipo === 'foto_historica')
    .forEach((foto, i) => {
      const archivo = `${numero}-historica-${i + 1}`
      if (vacio(foto.credito)) {
        agregar(
          'todos',
          `Crédito de ${archivo}`,
          'Falta autor o archivo',
          'URL: indicar autor y colección',
        )
      }
      if (vacio(foto.fecha)) {
        agregar('todos', `Fecha de ${archivo}`, 'Falta fecha o época', 'URL: indicar fecha o época')
      }
      if (vacio(foto.derechos)) {
        agregar(
          'todos',
          `Permiso de ${archivo}`,
          'No consta el permiso de publicación',
          'URL: confirmar si se puede publicar',
        )
      }
    })

  // --- Fuentes -------------------------------------------------------------
  if (punto.fuentes.length === 0) {
    agregar('todos', 'Fuentes', 'Ninguna fuente', 'URL: fuente y nivel de confianza de cada dato')
  }
  for (const fuente of punto.fuentes) {
    if (PRUEBA.test(fuente.cita)) {
      agregar(
        'todos',
        `Fuente «${fuente.cita}»`,
        'Es una fuente de prueba',
        'Reemplazar por la referencia real',
      )
    }
    if (fuente.tipo === 'sitio_web' && vacio(fuente.url)) {
      agregar('todos', `Fuente «${fuente.cita}»`, 'Sitio web sin enlace', 'URL: enviar el enlace')
    }
  }

  // --- Fichas por idioma ---------------------------------------------------
  for (const idioma of IDIOMAS_REPORTE) {
    const nombre = NOMBRE_IDIOMA[idioma]
    const ficha = punto.fichas.find((f) => f.idioma === idioma)
    if (!ficha) {
      agregar(
        idioma,
        'Ficha',
        idioma === 'es' ? 'No hay ficha' : `Falta la traducción al ${nombre}`,
        idioma === 'es' ? 'URL: entregar la ficha' : `URL: entregar la ficha en ${nombre}`,
      )
      agregar(
        idioma,
        `Narración (${numero}-${idioma}.mp3)`,
        'Falta',
        'URL: audio y su texto exacto',
        'recomendado',
      )
      continue
    }

    const campos: [keyof FichaReporte, string, Gravedad][] = [
      ['titulo', 'Nombre', 'obligatorio'],
      ['que_ves', 'Qué ves', 'obligatorio'],
      ['historia', 'Historia', 'obligatorio'],
      ['dato_santi', 'Dato de Santi', 'recomendado'],
    ]
    for (const [campo, etiqueta, gravedad] of campos) {
      if (vacio(ficha[campo] as string | null)) {
        agregar(idioma, etiqueta, 'Vacío', `URL: completar en ${nombre}`, gravedad)
      }
    }

    if (PRUEBA.test(ficha.titulo)) {
      agregar(
        idioma,
        'Textos',
        'Contenido de prueba, no material de la URL',
        'Reemplazar por la ficha real antes de aprobar',
      )
    }

    if (!ficha.audio) {
      agregar(
        idioma,
        `Narración (${numero}-${idioma}.mp3)`,
        'Falta',
        'URL: audio y su texto exacto',
        'recomendado',
      )
    } else if (ficha.audio.idioma !== idioma) {
      agregar(
        idioma,
        'Narración',
        'El audio no es de este idioma',
        'Subir el audio del idioma correcto',
      )
    }
    if (ficha.audio && vacio(ficha.transcripcion)) {
      agregar(
        idioma,
        'Transcripción',
        'Hay audio sin transcripción',
        'URL: texto exacto de la narración',
      )
    }
    if (!ficha.audio && !vacio(ficha.transcripcion)) {
      agregar(
        idioma,
        'Narración',
        'Hay transcripción, pero no audio',
        'URL: enviar el audio',
        'recomendado',
      )
    }

    if (idioma !== 'es' && fichaEs) {
      for (const [campo, etiqueta] of [
        ['que_ves', 'Qué ves'],
        ['historia', 'Historia'],
      ] as const) {
        const base = fichaEs[campo]
        const otro = ficha[campo]
        if (base && otro && largoDispar(base, otro)) {
          agregar(
            idioma,
            etiqueta,
            'El largo difiere mucho del español: puede faltar o sobrar contenido',
            'Revisión editorial: confirmar que dice lo mismo',
            'revision',
          )
        }
      }
    }

    if (idioma === 'cak') {
      agregar(
        idioma,
        'Revisión lingüística',
        'El equipo técnico no puede validar el kaqchikel',
        'Revisión por una persona competente en kaqchikel antes de aprobar',
        'revision',
      )
    }
    if (ficha.estado !== 'aprobado') {
      agregar(
        idioma,
        'Estado',
        ficha.estado === 'revision' ? 'En revisión' : 'En borrador',
        'Revisor del equipo: aprobar o devolver',
        'revision',
      )
    }
  }
  return filas
}

export function faltantesDeTodo(puntos: readonly PuntoReporte[]): Faltante[] {
  return [...puntos]
    .sort((a, b) => a.zona.localeCompare(b.zona) || a.orden - b.orden)
    .flatMap(faltantesDePunto)
}

const COLUMNAS: [keyof Faltante, string][] = [
  ['numero', 'Ficha'],
  ['titulo', 'Título'],
  ['idioma', 'Idioma'],
  ['campo', 'Campo o archivo'],
  ['problema', 'Problema'],
  ['accion', 'Acción requerida'],
  ['gravedad', 'Prioridad'],
]

const celdaCsv = (valor: string) =>
  /[",\n;]/.test(valor) ? `"${valor.replace(/"/g, '""')}"` : valor

const BOM = String.fromCharCode(0xfeff)

/** CSV (UTF-8 con BOM, para que Excel lea bien los acentos). */
export function aCsv(filas: readonly Faltante[]): string {
  const lineas = [
    COLUMNAS.map(([, titulo]) => titulo).join(','),
    ...filas.map((fila) => COLUMNAS.map(([clave]) => celdaCsv(String(fila[clave]))).join(',')),
  ]
  return `${BOM}${lineas.join('\r\n')}\r\n`
}

const celdaMd = (valor: string) => valor.replace(/\|/g, '\\|').replace(/\n/g, ' ')

/** Tabla en Markdown, para pegar en un correo o documento. */
export function aMarkdown(filas: readonly Faltante[], fecha: string): string {
  const encabezado = `| ${COLUMNAS.map(([, t]) => t).join(' | ')} |`
  const separador = `| ${COLUMNAS.map(() => '---').join(' | ')} |`
  const cuerpo = filas.map(
    (fila) => `| ${COLUMNAS.map(([clave]) => celdaMd(String(fila[clave]))).join(' | ')} |`,
  )
  return [
    `# Faltantes de las fichas · Guía La Merced`,
    '',
    `Generado el ${fecha}. ${filas.length} pendientes.`,
    '',
    encabezado,
    separador,
    ...cuerpo,
    '',
  ].join('\n')
}
