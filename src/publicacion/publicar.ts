// Lógica de «Publicar» en el servidor (función de Vercel `api/publicar.ts`). La autorización se
// comprueba aquí, no en el botón: un editor o un revisor que llame directo a la API recibe 403.
//
// Pasos: (1) quién llama y con qué rol; (2) reservar la publicación (la base solo admite una en
// curso); (3) leer lo público con la clave del visitante (las reglas de acceso ya excluyen borradores
// y revisión); (4) armar la instantánea y comprobar que cada medio se puede abrir; (5) guardarla con
// su huella y pedir el despliegue. Si algo falla, la publicación queda «fallida» y la última
// publicada sigue siendo la que lleva producción. No importa nada salvo ./instantanea.

import {
  construirInstantanea,
  resumirInstantanea,
  serializarInstantanea,
  sha256,
  urlsDeMedios,
  type DatosPublicos,
  type ResumenInstantanea,
} from './instantanea.js'

/** Una publicación en curso se da por atascada después de este tiempo y se puede reemplazar. */
export const VENCE_EN_CURSO_MS = 20 * 60 * 1000

export type RolPublicacion = 'editor' | 'revisor' | 'admin' | null

export class PublicacionEnCurso extends Error {
  constructor() {
    super('Ya hay una publicación en curso.')
    this.name = 'PublicacionEnCurso'
  }
}

/** Lo que la función necesita del mundo exterior. Las pruebas lo simulan. */
export type PuertosPublicacion = {
  /** Rol del dueño del token, o undefined si el token no es una sesión válida. */
  rolDe(token: string): Promise<RolPublicacion | undefined>
  /** Si hay a dónde desplegar (p. ej. la URL del deploy hook de Vercel está configurada). */
  hayDespliegue: boolean
  /** Marca como fallidas las publicaciones en curso creadas antes de `antesDe`. */
  liberarAtascadas(token: string, antesDe: Date): Promise<void>
  /** Crea la fila «generando». Lanza PublicacionEnCurso si ya hay una. */
  iniciar(token: string): Promise<{ id: string; version: number }>
  /** Lo que ve el visitante (clave pública, sin sesión). */
  leerPublico(): Promise<DatosPublicos>
  aUrl(ruta: string): string
  /** true si la URL pública del medio responde. */
  medioAccesible(url: string): Promise<boolean>
  /** Guarda contenido y huella y pasa la publicación a «desplegando». */
  guardarGenerada(
    token: string,
    id: string,
    datos: { contenido: string; sha256: string; resumen: ResumenInstantanea },
  ): Promise<void>
  /** Pide el despliegue. Que se acepte no significa que haya terminado. */
  desplegar(datos: { version: number; sha256: string; contenido: string }): Promise<void>
  marcarFallida(token: string, id: string, error: string): Promise<void>
  ahora(): Date
}

export type RespuestaPublicacion = {
  estado: number
  cuerpo:
    | { ok: true; id: string; version: number; sha256: string; resumen: ResumenInstantanea }
    | { ok: false; codigo: CodigoError; mensaje: string; detalle?: string[] }
}

export type CodigoError =
  'sinSesion' | 'sinPermiso' | 'sinDespliegue' | 'enCurso' | 'mediosInaccesibles' | 'fallo'

const error = (
  estado: number,
  codigo: CodigoError,
  mensaje: string,
  detalle?: string[],
): RespuestaPublicacion => ({ estado, cuerpo: { ok: false, codigo, mensaje, detalle } })

/** Token de un encabezado `Authorization: Bearer …`, o null. */
export function tokenDe(encabezado: string | null | undefined): string | null {
  const coincidencia = /^Bearer\s+(\S+)$/i.exec(encabezado?.trim() ?? '')
  return coincidencia?.[1] ?? null
}

export async function publicar(
  token: string | null,
  puertos: PuertosPublicacion,
): Promise<RespuestaPublicacion> {
  if (!token) return error(401, 'sinSesion', 'Inicia sesión para publicar.')

  const rol = await puertos.rolDe(token)
  if (rol === undefined) return error(401, 'sinSesion', 'La sesión no es válida o venció.')
  if (rol !== 'admin') return error(403, 'sinPermiso', 'Solo un administrador puede publicar.')

  if (!puertos.hayDespliegue) {
    return error(
      503,
      'sinDespliegue',
      'Falta configurar el despliegue en el servidor (VERCEL_DEPLOY_HOOK_URL).',
    )
  }

  await puertos.liberarAtascadas(token, new Date(puertos.ahora().getTime() - VENCE_EN_CURSO_MS))

  let reservada: { id: string; version: number }
  try {
    reservada = await puertos.iniciar(token)
  } catch (e) {
    if (e instanceof PublicacionEnCurso) {
      return error(409, 'enCurso', 'Ya hay una publicación en curso. Espera a que termine.')
    }
    throw e
  }

  try {
    const instantanea = construirInstantanea(await puertos.leerPublico(), {
      version: reservada.version,
      generadoEn: puertos.ahora().toISOString(),
      aUrl: puertos.aUrl,
    })

    const urls = urlsDeMedios(instantanea)
    const accesibles = await Promise.all(urls.map((url) => puertos.medioAccesible(url)))
    const rotos = urls.filter((_, i) => !accesibles[i])
    if (rotos.length > 0) {
      await puertos.marcarFallida(
        token,
        reservada.id,
        `Medios que no se pueden abrir: ${rotos.join(', ')}`,
      )
      return error(
        502,
        'mediosInaccesibles',
        'Algunos medios aprobados no se pueden abrir. No se publicó nada.',
        rotos,
      )
    }

    const contenido = serializarInstantanea(instantanea)
    const huella = await sha256(contenido)
    const resumen = resumirInstantanea(instantanea)
    await puertos.guardarGenerada(token, reservada.id, { contenido, sha256: huella, resumen })
    await puertos.desplegar({ version: reservada.version, sha256: huella, contenido })

    return {
      estado: 202,
      cuerpo: { ok: true, id: reservada.id, version: reservada.version, sha256: huella, resumen },
    }
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e)
    await puertos.marcarFallida(token, reservada.id, mensaje).catch(() => {})
    return error(500, 'fallo', `No se pudo publicar: ${mensaje}`)
  }
}
