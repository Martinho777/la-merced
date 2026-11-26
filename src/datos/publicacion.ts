// «Publicar» desde el gestor (solo admin). El servidor (api/publicar.ts) comprueba el rol, genera la
// instantánea de lo aprobado y pide el despliegue a Vercel. Aquí se llama a esa función, se lee el
// historial de publicaciones y se comprueba lo que de verdad quedó desplegado: el archivo
// /respaldo/publicacion.json del sitio, cuya huella SHA-256 debe ser la de la publicación.
//
// `tipos-db.ts` todavía no conoce la tabla `publicaciones` (migración 20261125000001, pendiente de
// aplicar y de `npm run db:types`): se usa un cliente sin tipos para esa tabla.

import type { SupabaseClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  esInstantanea,
  RUTA_INSTANTANEA,
  sha256,
  type ResumenInstantanea,
} from '@/publicacion/instantanea'

export type EstadoPublicacion = 'generando' | 'desplegando' | 'publicada' | 'fallida'

export type Publicacion = {
  id: string
  version: number
  estado: EstadoPublicacion
  sha256: string | null
  resumen: Partial<ResumenInstantanea>
  error: string | null
  creadoEn: string
  desplegadoEn: string | null
}

export type ResultadoSolicitud =
  | { ok: true; id: string; version: number; sha256: string; resumen: ResumenInstantanea }
  | { ok: false; estado: number; codigo: string; mensaje: string; detalle?: string[] }

const sinTipos = supabase as unknown as SupabaseClient

const COLUMNAS = 'id, version, estado, sha256, resumen, error, creado_en, desplegado_en'

type Fila = {
  id: string
  version: number
  estado: EstadoPublicacion
  sha256: string | null
  resumen: Partial<ResumenInstantanea> | null
  error: string | null
  creado_en: string
  desplegado_en: string | null
}

const publicacionDe = (fila: Fila): Publicacion => ({
  id: fila.id,
  version: fila.version,
  estado: fila.estado,
  sha256: fila.sha256,
  resumen: fila.resumen ?? {},
  error: fila.error,
  creadoEn: fila.creado_en,
  desplegadoEn: fila.desplegado_en,
})

/** Pide la publicación al servidor. Que responda 202 solo significa que el despliegue se pidió. */
export async function solicitarPublicacion(
  llamar: typeof fetch = fetch,
): Promise<ResultadoSolicitud> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  let respuesta: Response
  try {
    respuesta = await llamar('/api/publicar', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  } catch {
    return { ok: false, estado: 0, codigo: 'red', mensaje: 'No se pudo contactar al servidor.' }
  }
  const cuerpo = (await respuesta.json().catch(() => null)) as
    (ResultadoSolicitud & { codigo?: string }) | null
  if (cuerpo?.ok) return cuerpo
  return {
    ok: false,
    estado: respuesta.status,
    codigo: cuerpo && !cuerpo.ok ? cuerpo.codigo : 'fallo',
    mensaje:
      cuerpo && !cuerpo.ok
        ? cuerpo.mensaje
        : `El servidor respondió HTTP ${respuesta.status} sin explicación.`,
    detalle: cuerpo && !cuerpo.ok ? cuerpo.detalle : undefined,
  }
}

/** Últimas publicaciones, de la más nueva a la más vieja (solo admin, por las reglas de acceso). */
export async function listarPublicaciones(limite = 8): Promise<Publicacion[]> {
  const { data, error } = await sinTipos
    .from('publicaciones')
    .select(COLUMNAS)
    .order('version', { ascending: false })
    .limit(limite)
  if (error) throw new Error(`No se pudieron leer las publicaciones: ${error.message}`)
  return (data as Fila[]).map(publicacionDe)
}

export async function obtenerPublicacion(id: string): Promise<Publicacion> {
  const { data, error } = await sinTipos
    .from('publicaciones')
    .select(COLUMNAS)
    .eq('id', id)
    .single()
  if (error) throw new Error(`No se pudo leer la publicación: ${error.message}`)
  return publicacionDe(data as Fila)
}

async function cerrar(id: string, cambios: Record<string, unknown>): Promise<Publicacion> {
  const { data, error } = await sinTipos
    .from('publicaciones')
    .update(cambios)
    .eq('id', id)
    .eq('estado', 'desplegando')
    .select(COLUMNAS)
    .single()
  if (error) throw new Error(`No se pudo actualizar la publicación: ${error.message}`)
  return publicacionDe(data as Fila)
}

/** Marca la publicación como publicada, después de comprobar el despliegue. */
export const confirmarPublicacion = (id: string) =>
  cerrar(id, { estado: 'publicada', desplegado_en: new Date().toISOString() })

/** Marca la publicación como fallida: producción sigue con la última publicada. */
export const marcarPublicacionFallida = (id: string, motivo: string) =>
  cerrar(id, { estado: 'fallida', error: motivo })

export type Desplegada = { version: number; sha256: string; generadoEn: string } | null

/**
 * La instantánea que sirve hoy el sitio (el mismo dominio del gestor), con su huella calculada sobre el
 * texto exacto recibido. Null si el sitio no tiene ninguna.
 */
export async function leerDesplegada(llamar: typeof fetch = fetch): Promise<Desplegada> {
  const respuesta = await llamar(`${RUTA_INSTANTANEA}?comprobar=${Date.now()}`, {
    cache: 'no-store',
  })
  if (!respuesta.ok) return null
  const texto = await respuesta.text()
  let datos: unknown
  try {
    datos = JSON.parse(texto)
  } catch {
    return null // sin respaldo, el sitio devuelve index.html
  }
  if (!esInstantanea(datos)) return null
  return { version: datos.version, sha256: await sha256(texto), generadoEn: datos.generadoEn }
}
