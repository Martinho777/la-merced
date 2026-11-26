// Importación de las fichas que entrega la URL (el equipo de investigación). Formato documentado en
// docs/ia/IMPORTACION-FICHAS.md. La corre `scripts/importar-fichas.ts` con una cuenta del gestor.
//
// Reglas:
// - Todo lo importado queda en «revision»: nada llega al visitante sin que un revisor lo apruebe.
// - Solo se crean los idiomas que vienen en la entrega; nada se traduce ni se completa.
// - Repetible: una ficha que ya existe no se toca; un archivo se nombra por su huella SHA-256, así
//   que el mismo archivo no se sube dos veces; una fuente se reconoce por su cita.
// - Cada cosa anota su procedencia (entrega, archivo y huella).
//
// Este archivo no importa nada: la base, los archivos y la conversión de fotos llegan por `Puertos`.

export type IdiomaEntrega = 'es' | 'en' | 'cak'
export const IDIOMAS_ENTREGA: readonly IdiomaEntrega[] = ['es', 'en', 'cak']
const TIPOS_FUENTE = ['archivo', 'libro', 'entrevista', 'sitio_web'] as const
const NIVELES = ['documentado', 'probable', 'especulativo'] as const
const ZONAS = ['fachada-principal', 'fachada-secundaria', 'interior'] as const

export type TextosEntregados = {
  titulo: string
  que_ves?: string
  historia?: string
  dato_santi?: string
  transcripcion?: string
}

export type FotoEntregada = {
  archivo: string
  texto_alternativo: Partial<Record<IdiomaEntrega, string>>
  credito?: string
  fecha?: string
  derechos?: string
}

export type FuenteEntregada = {
  cita: string
  tipo: (typeof TIPOS_FUENTE)[number]
  url?: string
  nivel: (typeof NIVELES)[number]
  nota?: string
}

export type FichaEntregada = {
  numero: number
  zona: (typeof ZONAS)[number]
  esencial?: boolean
  idiomas: Partial<Record<IdiomaEntrega, TextosEntregados>>
  foto?: FotoEntregada
  fotos_historicas?: FotoEntregada[]
  fuentes?: FuenteEntregada[]
  audios?: Partial<Record<IdiomaEntrega, string>>
}

export type Manifiesto = {
  entrega: { origen: string; fecha: string; descripcion?: string }
  fichas: FichaEntregada[]
}

// ---------------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------------

const esObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const esTexto = (v: unknown): v is string => typeof v === 'string' && v.trim() !== ''
const textoOpcional = (v: unknown) => v === undefined || v === null || typeof v === 'string'

function erroresDeFoto(foto: unknown, donde: string): string[] {
  if (!esObjeto(foto)) return [`${donde}: debe ser un objeto`]
  const errores: string[] = []
  if (!esTexto(foto.archivo)) errores.push(`${donde}.archivo: falta`)
  else if (!/\.(jpe?g|png|webp|tiff?|heic)$/i.test(foto.archivo)) {
    errores.push(`${donde}.archivo: formato no admitido (${foto.archivo})`)
  }
  if (!esObjeto(foto.texto_alternativo) || !esTexto(foto.texto_alternativo.es)) {
    errores.push(`${donde}.texto_alternativo.es: es obligatorio (accesibilidad)`)
  }
  for (const campo of ['credito', 'fecha', 'derechos']) {
    if (!textoOpcional(foto[campo])) errores.push(`${donde}.${campo}: debe ser texto`)
  }
  return errores
}

/** Errores de una ficha del manifiesto (vacío si está bien). */
export function erroresDeFicha(ficha: unknown, indice: number): string[] {
  const donde = `fichas[${indice}]`
  if (!esObjeto(ficha)) return [`${donde}: debe ser un objeto`]
  const errores: string[] = []
  if (!Number.isInteger(ficha.numero) || (ficha.numero as number) < 1) {
    errores.push(`${donde}.numero: entero desde 1`)
  }
  if (!ZONAS.includes(ficha.zona as (typeof ZONAS)[number])) {
    errores.push(`${donde}.zona: una de ${ZONAS.join(', ')}`)
  }
  if (ficha.esencial !== undefined && typeof ficha.esencial !== 'boolean') {
    errores.push(`${donde}.esencial: sí (true) o no (false)`)
  }
  if (!esObjeto(ficha.idiomas) || Object.keys(ficha.idiomas).length === 0) {
    errores.push(`${donde}.idiomas: al menos un idioma`)
  } else {
    for (const [idioma, textos] of Object.entries(ficha.idiomas)) {
      if (!IDIOMAS_ENTREGA.includes(idioma as IdiomaEntrega)) {
        errores.push(`${donde}.idiomas.${idioma}: idioma desconocido (es, en o cak)`)
        continue
      }
      if (!esObjeto(textos) || !esTexto(textos.titulo)) {
        errores.push(`${donde}.idiomas.${idioma}.titulo: falta`)
        continue
      }
      for (const campo of ['que_ves', 'historia', 'dato_santi', 'transcripcion']) {
        if (!textoOpcional(textos[campo])) {
          errores.push(`${donde}.idiomas.${idioma}.${campo}: debe ser texto`)
        }
      }
    }
  }
  if (ficha.foto !== undefined) errores.push(...erroresDeFoto(ficha.foto, `${donde}.foto`))
  if (ficha.fotos_historicas !== undefined) {
    if (!Array.isArray(ficha.fotos_historicas)) errores.push(`${donde}.fotos_historicas: lista`)
    else
      ficha.fotos_historicas.forEach((f, i) =>
        errores.push(...erroresDeFoto(f, `${donde}.fotos_historicas[${i}]`)),
      )
  }
  if (ficha.fuentes !== undefined) {
    if (!Array.isArray(ficha.fuentes)) errores.push(`${donde}.fuentes: lista`)
    else
      ficha.fuentes.forEach((f, i) => {
        const aqui = `${donde}.fuentes[${i}]`
        if (!esObjeto(f) || !esTexto(f.cita)) return errores.push(`${aqui}.cita: falta`)
        if (!TIPOS_FUENTE.includes(f.tipo as (typeof TIPOS_FUENTE)[number])) {
          errores.push(`${aqui}.tipo: uno de ${TIPOS_FUENTE.join(', ')}`)
        }
        if (!NIVELES.includes(f.nivel as (typeof NIVELES)[number])) {
          errores.push(`${aqui}.nivel: uno de ${NIVELES.join(', ')} (lo define la URL)`)
        }
      })
  }
  if (ficha.audios !== undefined) {
    if (!esObjeto(ficha.audios)) errores.push(`${donde}.audios: objeto por idioma`)
    else
      for (const [idioma, archivo] of Object.entries(ficha.audios)) {
        if (!IDIOMAS_ENTREGA.includes(idioma as IdiomaEntrega)) {
          errores.push(`${donde}.audios.${idioma}: idioma desconocido`)
        } else if (!esTexto(archivo) || !/\.(mp3|m4a)$/i.test(archivo)) {
          errores.push(`${donde}.audios.${idioma}: MP3 o M4A`)
        } else if (!esObjeto(ficha.idiomas) || !(idioma in ficha.idiomas)) {
          errores.push(`${donde}.audios.${idioma}: hay audio pero no ficha en ese idioma`)
        }
      }
  }
  return errores
}

export type ManifiestoValidado = {
  entrega: Manifiesto['entrega'] | null
  /** Fichas bien formadas, listas para importar. */
  fichas: FichaEntregada[]
  /** Fichas que no se importan, con sus errores. */
  rechazadas: { indice: number; numero: unknown; errores: string[] }[]
  /** Errores del manifiesto en general (sin entrega, números repetidos…). */
  errores: string[]
}

export function validarManifiesto(valor: unknown): ManifiestoValidado {
  const resultado: ManifiestoValidado = { entrega: null, fichas: [], rechazadas: [], errores: [] }
  if (!esObjeto(valor)) return { ...resultado, errores: ['El manifiesto debe ser un objeto JSON.'] }
  const entrega = valor.entrega
  if (
    !esObjeto(entrega) ||
    !esTexto(entrega.origen) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(String(entrega.fecha))
  ) {
    resultado.errores.push('entrega: indica origen y fecha (AAAA-MM-DD) de la entrega.')
  } else {
    resultado.entrega = {
      origen: entrega.origen,
      fecha: String(entrega.fecha),
      descripcion: typeof entrega.descripcion === 'string' ? entrega.descripcion : undefined,
    }
  }
  if (!Array.isArray(valor.fichas)) {
    resultado.errores.push('fichas: debe ser una lista.')
    return resultado
  }
  const vistos = new Set<string>()
  valor.fichas.forEach((ficha, indice) => {
    const errores = erroresDeFicha(ficha, indice)
    const f = ficha as Partial<FichaEntregada>
    const clave = `${f?.zona}:${f?.numero}`
    if (errores.length === 0 && vistos.has(clave)) {
      errores.push(`fichas[${indice}]: el número ${f.numero} se repite en ${f.zona}`)
    }
    vistos.add(clave)
    if (errores.length > 0) resultado.rechazadas.push({ indice, numero: f?.numero, errores })
    else resultado.fichas.push(ficha as FichaEntregada)
  })
  return resultado
}

// ---------------------------------------------------------------------------
// Importación
// ---------------------------------------------------------------------------

export type Procedencia = { origen: string; entrega: string; archivo: string; sha256: string }

export type FotoPreparada = {
  bytes: Uint8Array
  tipoMime: 'image/webp' | 'image/jpeg'
  extension: 'webp' | 'jpg'
  ancho: number | null
  alto: number | null
}

export type Puertos = {
  /** Lee un archivo de la carpeta de la entrega; null si no existe. */
  leerArchivo(ruta: string): Promise<Uint8Array | null>
  sha256(bytes: Uint8Array): Promise<string>
  /** Reduce y convierte la foto como lo hace el gestor (2000 px, WebP). */
  prepararFoto(bytes: Uint8Array): Promise<FotoPreparada>
  buscarZona(slug: string): Promise<{ id: string } | null>
  buscarPunto(zonaId: string, orden: number): Promise<{ id: string; slug: string } | null>
  crearPunto(datos: {
    zonaId: string
    orden: number
    slug: string
    esEsencial: boolean
  }): Promise<{ id: string; slug: string }>
  buscarFicha(puntoId: string, idioma: IdiomaEntrega): Promise<{ id: string } | null>
  crearFicha(datos: {
    puntoId: string
    idioma: IdiomaEntrega
    /** Siempre «revision»: lo importado espera a un revisor. */
    estado: 'revision'
    textos: TextosEntregados
    audioId: string | null
    procedencia: Procedencia
  }): Promise<{ id: string }>
  buscarMedioPorRuta(ruta: string): Promise<{ id: string } | null>
  subirArchivo(ruta: string, bytes: Uint8Array, tipoMime: string): Promise<void>
  crearMedio(datos: {
    tipo: 'foto' | 'foto_historica' | 'audio'
    ruta: string
    puntoId: string
    idioma: IdiomaEntrega | null
    textoAlternativo: Partial<Record<IdiomaEntrega, string>>
    credito: string | null
    fecha: string | null
    derechos: string | null
    ancho: number | null
    alto: number | null
    pesoBytes: number
    orden: number
    procedencia: Procedencia
  }): Promise<{ id: string }>
  buscarFuente(cita: string): Promise<{ id: string } | null>
  crearFuente(datos: {
    cita: string
    tipo: FuenteEntregada['tipo']
    url: string | null
    procedencia: Procedencia
  }): Promise<{ id: string }>
  /** true si creó el vínculo; false si ya existía. */
  vincularFuente(
    puntoId: string,
    fuenteId: string,
    nivel: string,
    nota: string | null,
  ): Promise<boolean>
}

export type TipoElemento = 'punto' | 'ficha' | 'foto' | 'audio' | 'fuente'
export type Elemento = { tipo: TipoElemento; ficha: string; detalle: string }
export type ResumenImportacion = {
  importados: Elemento[]
  omitidos: (Elemento & { motivo: string })[]
  errores: (Elemento & { error: string })[]
}

export const nombreFicha = (f: { numero: number; zona: string }) =>
  `${f.zona} ${String(f.numero).padStart(2, '0')}`

const limpio = (texto: string | undefined) => texto?.trim() || null

/** Huella de los textos de una ficha (para saber si la entrega cambió). */
async function huellaDeTextos(textos: TextosEntregados, puertos: Puertos) {
  const ordenado = ['titulo', 'que_ves', 'historia', 'dato_santi', 'transcripcion'].map(
    (c) => textos[c as keyof TextosEntregados]?.trim() ?? '',
  )
  return puertos.sha256(new TextEncoder().encode(JSON.stringify(ordenado)))
}

/**
 * Importa las fichas válidas. Con `simular`, no escribe nada y dice qué haría. Un error en una ficha
 * no detiene las demás.
 */
export async function importar(
  validado: ManifiestoValidado,
  puertos: Puertos,
  opciones: { simular?: boolean } = {},
): Promise<ResumenImportacion> {
  const resumen: ResumenImportacion = { importados: [], omitidos: [], errores: [] }
  for (const rechazada of validado.rechazadas) {
    resumen.errores.push({
      tipo: 'ficha',
      ficha: `fichas[${rechazada.indice}] (número ${String(rechazada.numero)})`,
      detalle: 'manifiesto',
      error: rechazada.errores.join('; '),
    })
  }
  const entrega = validado.entrega
  if (!entrega) {
    for (const ficha of validado.fichas) {
      resumen.omitidos.push({
        tipo: 'ficha',
        ficha: nombreFicha(ficha),
        detalle: 'todo',
        motivo: 'el manifiesto no dice de qué entrega viene',
      })
    }
    return resumen
  }
  const simular = opciones.simular ?? false
  const procedencia = (archivo: string, sha256: string): Procedencia => ({
    origen: entrega.origen,
    entrega: entrega.fecha,
    archivo,
    sha256,
  })

  for (const ficha of validado.fichas) {
    const nombre = nombreFicha(ficha)
    const ok = (tipo: TipoElemento, detalle: string) =>
      resumen.importados.push({ tipo, ficha: nombre, detalle })
    const omitir = (tipo: TipoElemento, detalle: string, motivo: string) =>
      resumen.omitidos.push({ tipo, ficha: nombre, detalle, motivo })
    const fallo = (tipo: TipoElemento, detalle: string, e: unknown) =>
      resumen.errores.push({
        tipo,
        ficha: nombre,
        detalle,
        error: e instanceof Error ? e.message : String(e),
      })

    // --- Punto ---------------------------------------------------------------
    let punto: { id: string; slug: string } | null
    try {
      const zona = await puertos.buscarZona(ficha.zona)
      if (!zona) throw new Error(`la zona ${ficha.zona} no existe en la base`)
      punto = await puertos.buscarPunto(zona.id, ficha.numero)
      if (punto) {
        omitir('punto', `número ${ficha.numero}`, 'ya existe; se usa el que hay')
      } else if (simular) {
        ok('punto', `número ${ficha.numero} (se crearía)`)
        punto = {
          id: `simulado-${nombre}`,
          slug: `${ficha.zona}-${String(ficha.numero).padStart(2, '0')}`,
        }
      } else {
        punto = await puertos.crearPunto({
          zonaId: zona.id,
          orden: ficha.numero,
          slug: `${ficha.zona}-${String(ficha.numero).padStart(2, '0')}`,
          esEsencial: ficha.esencial ?? false,
        })
        ok('punto', `número ${ficha.numero}`)
      }
    } catch (e) {
      fallo('punto', `número ${ficha.numero}`, e)
      continue
    }

    // --- Fotos ---------------------------------------------------------------
    const fotos: [FotoEntregada, 'foto' | 'foto_historica', number][] = [
      ...(ficha.foto ? [[ficha.foto, 'foto', 0] as [FotoEntregada, 'foto', number]] : []),
      ...(ficha.fotos_historicas ?? []).map(
        (f, i) => [f, 'foto_historica', i + 1] as [FotoEntregada, 'foto_historica', number],
      ),
    ]
    for (const [foto, tipo, orden] of fotos) {
      try {
        const original = await puertos.leerArchivo(foto.archivo)
        if (!original) {
          omitir('foto', foto.archivo, 'el archivo no está en la entrega')
          continue
        }
        const huella = await puertos.sha256(original)
        const preparada = await puertos.prepararFoto(original)
        const ruta = `fotos/importado-${huella.slice(0, 16)}.${preparada.extension}`
        if (await puertos.buscarMedioPorRuta(ruta)) {
          omitir('foto', foto.archivo, 'ya importada (misma huella)')
          continue
        }
        if (simular) {
          ok('foto', `${foto.archivo} (se subiría a ${ruta})`)
          continue
        }
        await puertos.subirArchivo(ruta, preparada.bytes, preparada.tipoMime)
        await puertos.crearMedio({
          tipo,
          ruta,
          puntoId: punto.id,
          idioma: null,
          textoAlternativo: foto.texto_alternativo,
          credito: limpio(foto.credito),
          fecha: limpio(foto.fecha),
          derechos: limpio(foto.derechos),
          ancho: preparada.ancho,
          alto: preparada.alto,
          pesoBytes: preparada.bytes.byteLength,
          orden,
          procedencia: procedencia(foto.archivo, huella),
        })
        ok('foto', foto.archivo)
      } catch (e) {
        fallo('foto', foto.archivo, e)
      }
    }

    // --- Fichas por idioma, con su audio -------------------------------------
    for (const idioma of IDIOMAS_ENTREGA) {
      const textos = ficha.idiomas[idioma]
      if (!textos) continue
      const detalle = `ficha en ${idioma}`
      try {
        if (!simular || !punto.id.startsWith('simulado-')) {
          if (await puertos.buscarFicha(punto.id, idioma)) {
            omitir('ficha', detalle, 'ya existe en el gestor; no se sobrescribe')
            const archivoAudio = ficha.audios?.[idioma]
            if (archivoAudio) omitir('audio', archivoAudio, 'su ficha ya existía')
            continue
          }
        }

        let audioId: string | null = null
        const archivoAudio = ficha.audios?.[idioma]
        if (archivoAudio) {
          try {
            const bytes = await puertos.leerArchivo(archivoAudio)
            if (!bytes) {
              omitir('audio', archivoAudio, 'el archivo no está en la entrega')
            } else {
              const huella = await puertos.sha256(bytes)
              const extension = archivoAudio.toLowerCase().endsWith('.m4a') ? 'm4a' : 'mp3'
              const ruta = `audios/${punto.slug}-${idioma}-${huella.slice(0, 16)}.${extension}`
              const existente = await puertos.buscarMedioPorRuta(ruta)
              if (existente) {
                audioId = existente.id
                omitir('audio', archivoAudio, 'ya subido (misma huella); se reutiliza')
              } else if (simular) {
                ok('audio', `${archivoAudio} (se subiría a ${ruta})`)
              } else {
                await puertos.subirArchivo(
                  ruta,
                  bytes,
                  extension === 'm4a' ? 'audio/mp4' : 'audio/mpeg',
                )
                audioId = (
                  await puertos.crearMedio({
                    tipo: 'audio',
                    ruta,
                    puntoId: punto.id,
                    idioma,
                    textoAlternativo: {},
                    credito: null,
                    fecha: null,
                    derechos: null,
                    ancho: null,
                    alto: null,
                    pesoBytes: bytes.byteLength,
                    orden: 0,
                    procedencia: procedencia(archivoAudio, huella),
                  })
                ).id
                ok('audio', archivoAudio)
              }
            }
          } catch (e) {
            fallo('audio', archivoAudio, e)
          }
        }

        if (simular) {
          ok('ficha', `${detalle} (se crearía en revisión)`)
          continue
        }
        await puertos.crearFicha({
          puntoId: punto.id,
          idioma,
          estado: 'revision',
          textos,
          audioId,
          procedencia: procedencia(
            `manifiesto.json#${nombre}/${idioma}`,
            await huellaDeTextos(textos, puertos),
          ),
        })
        ok('ficha', detalle)
      } catch (e) {
        fallo('ficha', detalle, e)
      }
    }

    // --- Fuentes -------------------------------------------------------------
    for (const fuente of ficha.fuentes ?? []) {
      const detalle = fuente.cita.slice(0, 60)
      try {
        let existente = await puertos.buscarFuente(fuente.cita.trim())
        if (simular) {
          ok('fuente', `${detalle} (${existente ? 'se vincularía' : 'se crearía'})`)
          continue
        }
        if (!existente) {
          const huella = await puertos.sha256(new TextEncoder().encode(fuente.cita.trim()))
          existente = await puertos.crearFuente({
            cita: fuente.cita.trim(),
            tipo: fuente.tipo,
            url: limpio(fuente.url),
            procedencia: procedencia(`manifiesto.json#${nombre}/fuentes`, huella),
          })
        }
        const creado = await puertos.vincularFuente(
          punto.id,
          existente.id,
          fuente.nivel,
          limpio(fuente.nota),
        )
        if (creado) ok('fuente', detalle)
        else omitir('fuente', detalle, 'ya vinculada a este punto')
      } catch (e) {
        fallo('fuente', detalle, e)
      }
    }
  }
  return resumen
}

/** Cuántos importados, omitidos y con error hay de cada tipo. */
export function contar(resumen: ResumenImportacion) {
  const tipos: TipoElemento[] = ['punto', 'ficha', 'foto', 'audio', 'fuente']
  return Object.fromEntries(
    tipos.map((tipo) => [
      tipo,
      {
        importados: resumen.importados.filter((e) => e.tipo === tipo).length,
        omitidos: resumen.omitidos.filter((e) => e.tipo === tipo).length,
        errores: resumen.errores.filter((e) => e.tipo === tipo).length,
      },
    ]),
  ) as Record<TipoElemento, { importados: number; omitidos: number; errores: number }>
}
