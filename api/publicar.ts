// Función de Vercel: POST /api/publicar. La llama el botón «Publicar» del gestor con la sesión del
// admin (Authorization: Bearer <token de Supabase>). La lógica y la autorización están en
// src/publicacion/publicar.ts; aquí solo se conectan Supabase, los medios y el deploy hook.
//
// Variables de entorno (solo del servidor, nunca VITE_*):
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY  las mismas de la app (públicas)
//   VERCEL_DEPLOY_HOOK_URL                     deploy hook de producción (Vercel → Settings → Git)
//   DESPLIEGUE_LOCAL=1                         solo en `npm run dev`: escribe el JSON en public/
//                                              en lugar de desplegar (nunca en Vercel)
//
// Nada usa la clave service_role: cada escritura va con el token del admin y la protegen las reglas
// de acceso de la tabla publicaciones; la lectura de contenido usa la clave pública del visitante.

import { createClient } from '@supabase/supabase-js'
import type { DatosPublicos } from '../src/publicacion/instantanea.js'
import {
  publicar,
  PublicacionEnCurso,
  tokenDe,
  type PuertosPublicacion,
} from '../src/publicacion/publicar.js'

const ESPERA_MEDIO_MS = 10_000

function entorno() {
  const url = process.env.VITE_SUPABASE_URL
  const clave = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !clave)
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el servidor.')
  const local = process.env.DESPLIEGUE_LOCAL === '1' && !process.env.VERCEL
  return { url, clave, hook: process.env.VERCEL_DEPLOY_HOOK_URL?.trim() || null, local }
}

/** Cliente con la sesión del usuario: las reglas de acceso ven su rol. */
function clienteDe(url: string, clave: string, token?: string) {
  return createClient(url, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: token ? { headers: { Authorization: `Bearer ${token}` } } : undefined,
  })
}

type FilaPunto = {
  id: string
  slug: string
  orden: number
  es_esencial: boolean
  pos_x: number | null
  pos_y: number | null
  tiene_3d: boolean
  zonas: { slug: string }
  fichas: DatosPublicos['puntos'][number]['fichas']
  medios: DatosPublicos['puntos'][number]['medios']
  punto_fuentes: {
    nivel_confianza: string
    nota: string | null
    fuentes: { cita: string; url: string | null }
  }[]
}

/** Lo que ve el visitante, leído con la clave pública (sin sesión). */
export async function leerPublico(url: string, clave: string): Promise<DatosPublicos> {
  const publico = clienteDe(url, clave)
  const [zonas, puntos, textos] = await Promise.all([
    publico
      .from('zonas')
      .select(
        'slug, orden, disponible, usa_camara, contorno:medios!zonas_contorno_id_fkey(ruta), ilustracion:medios!zonas_ilustracion_id_fkey(ruta, texto_alternativo)',
      ),
    publico
      .from('puntos')
      .select(
        `id, slug, orden, es_esencial, pos_x, pos_y, tiene_3d, zonas!inner(slug),
         fichas(idioma, estado, titulo, que_ves, historia, dato_santi, transcripcion, audio_id),
         medios!medios_punto_id_fkey(id, tipo, ruta, idioma, orden, credito, fecha_original, derechos, duracion_s, texto_alternativo),
         punto_fuentes(nivel_confianza, nota, fuentes!inner(cita, url))`,
      )
      .eq('fichas.estado', 'aprobado'),
    publico.from('textos_interfaz').select('clave, idioma, texto').range(0, 9999),
  ])
  for (const r of [zonas, puntos, textos]) {
    if (r.error) throw new Error(`No se pudo leer el contenido público: ${r.error.message}`)
  }
  return {
    zonas: (zonas.data ?? []) as unknown as DatosPublicos['zonas'],
    puntos: ((puntos.data ?? []) as unknown as FilaPunto[]).map((p) => ({
      id: p.id,
      slug: p.slug,
      orden: p.orden,
      es_esencial: p.es_esencial,
      pos_x: p.pos_x,
      pos_y: p.pos_y,
      tiene_3d: p.tiene_3d,
      zona: p.zonas.slug,
      fichas: p.fichas,
      medios: p.medios,
      fuentes: p.punto_fuentes.map((v) => ({
        nivel_confianza: v.nivel_confianza,
        nota: v.nota,
        cita: v.fuentes.cita,
        url: v.fuentes.url,
      })),
    })),
    textos: (textos.data ?? []) as DatosPublicos['textos'],
  }
}

async function medioAccesible(url: string): Promise<boolean> {
  try {
    const respuesta = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(ESPERA_MEDIO_MS),
    })
    return respuesta.ok
  } catch {
    return false
  }
}

function puertos(): PuertosPublicacion {
  const { url, clave, hook, local } = entorno()
  const conToken = (token: string) => clienteDe(url, clave, token)
  const publico = clienteDe(url, clave)

  return {
    hayDespliegue: Boolean(hook) || local,
    async rolDe(token) {
      const cliente = conToken(token)
      const { data, error } = await cliente.auth.getUser(token)
      if (error || !data.user) {
        // Solo el motivo, nunca el token.
        console.warn(`[publicar] sesión rechazada: ${error?.message ?? 'sin usuario'}`)
        return undefined
      }
      const perfil = await cliente
        .from('perfiles')
        .select('rol')
        .eq('id', data.user.id)
        .maybeSingle()
      if (perfil.error) throw new Error(`No se pudo leer el rol: ${perfil.error.message}`)
      return (perfil.data?.rol as 'editor' | 'revisor' | 'admin' | null | undefined) ?? null
    },
    async liberarAtascadas(token, antesDe) {
      const { error } = await conToken(token)
        .from('publicaciones')
        .update({ estado: 'fallida', error: 'Venció sin terminar el despliegue.' })
        .in('estado', ['generando', 'desplegando'])
        .lt('creado_en', antesDe.toISOString())
      if (error) throw new Error(`No se pudo revisar las publicaciones en curso: ${error.message}`)
    },
    async iniciar(token) {
      const { data, error } = await conToken(token)
        .from('publicaciones')
        .insert({})
        .select('id, version')
        .single()
      if (error?.code === '23505') throw new PublicacionEnCurso()
      if (error || !data) throw new Error(`No se pudo iniciar la publicación: ${error?.message}`)
      return data as { id: string; version: number }
    },
    leerPublico: () => leerPublico(url, clave),
    aUrl: (ruta) => publico.storage.from('medios').getPublicUrl(ruta).data.publicUrl,
    medioAccesible,
    async guardarGenerada(token, id, datos) {
      const { error } = await conToken(token)
        .from('publicaciones')
        .update({
          estado: 'desplegando',
          contenido: datos.contenido,
          sha256: datos.sha256,
          resumen: datos.resumen,
        })
        .eq('id', id)
      if (error) throw new Error(`No se pudo guardar la instantánea: ${error.message}`)
    },
    async desplegar({ contenido }) {
      if (local) {
        // Solo desarrollo: hace de "despliegue" escribir el JSON donde Vite lo sirve.
        const { mkdir, writeFile } = await import('node:fs/promises')
        await mkdir('public/respaldo', { recursive: true })
        await writeFile('public/respaldo/publicacion.json', contenido, 'utf8')
        return
      }
      const respuesta = await fetch(hook as string, { method: 'POST' })
      if (!respuesta.ok) throw new Error(`Vercel rechazó el despliegue (HTTP ${respuesta.status}).`)
    },
    async marcarFallida(token, id, mensaje) {
      await conToken(token)
        .from('publicaciones')
        .update({ estado: 'fallida', error: mensaje })
        .eq('id', id)
    },
    ahora: () => new Date(),
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { estado, cuerpo } = await publicar(
      tokenDe(request.headers.get('authorization')),
      puertos(),
    )
    return Response.json(cuerpo, { status: estado, headers: { 'cache-control': 'no-store' } })
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : String(e)
    return Response.json(
      { ok: false, codigo: 'fallo', mensaje: `No se pudo publicar: ${mensaje}` },
      { status: 500, headers: { 'cache-control': 'no-store' } },
    )
  }
}
