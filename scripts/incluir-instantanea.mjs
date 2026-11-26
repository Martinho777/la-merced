// Paso final del build en Vercel (vercel.json → buildCommand): copia a dist/respaldo/publicacion.json
// la instantánea que debe llevar este despliegue. Así cada despliegue incluye exactamente el JSON
// que generó «Publicar» (mismo texto, misma huella SHA-256).
//
//   1. Pide a la base `instantanea_para_desplegar()`: la publicación que se está desplegando o, si no
//      hay, la última publicada. Comprueba su huella antes de escribirla.
//   2. Si la base no responde, conserva la de producción (la última válida que ya está publicada).
//   3. Si tampoco hay, el despliegue sale sin respaldo y lo dice en el log (la app sigue funcionando
//      con la base). Nunca escribe una instantánea inventada ni una con la huella equivocada.
//
// No hace falta en la CI de GitHub (`npm run build` no lo llama). Variables: VITE_SUPABASE_URL y
// VITE_SUPABASE_ANON_KEY (las públicas de la app) y VERCEL_PROJECT_PRODUCTION_URL (la pone Vercel).

import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'

const DESTINO = 'dist/respaldo/publicacion.json'
const ESPERA_MS = 15_000

const huella = (texto) => createHash('sha256').update(texto, 'utf8').digest('hex')
const log = (mensaje) => console.log(`[instantánea] ${mensaje}`)

async function desdeLaBase() {
  const url = process.env.VITE_SUPABASE_URL
  const clave = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !clave) throw new Error('faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY')
  const respuesta = await fetch(`${url}/rest/v1/rpc/instantanea_para_desplegar`, {
    method: 'POST',
    headers: {
      apikey: clave,
      Authorization: `Bearer ${clave}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
    signal: AbortSignal.timeout(ESPERA_MS),
  })
  if (!respuesta.ok) throw new Error(`la base respondió HTTP ${respuesta.status}`)
  const [fila] = await respuesta.json()
  if (!fila) return null
  if (huella(fila.contenido) !== fila.sha256) {
    throw new Error(`la huella de la versión ${fila.version} no coincide; no se incluye`)
  }
  return { texto: fila.contenido, origen: `base (versión ${fila.version}, ${fila.estado})` }
}

async function desdeProduccion() {
  const dominio = process.env.VERCEL_PROJECT_PRODUCTION_URL
  if (!dominio) return null
  const respuesta = await fetch(`https://${dominio}/respaldo/publicacion.json`, {
    signal: AbortSignal.timeout(ESPERA_MS),
  })
  if (!respuesta.ok) return null
  const texto = await respuesta.text()
  const datos = JSON.parse(texto)
  if (datos?.formato !== 1 || typeof datos.version !== 'number') return null
  return { texto, origen: `producción (versión ${datos.version})` }
}

let elegida = null
try {
  elegida = await desdeLaBase()
  if (!elegida) log('la base no tiene ninguna publicación todavía')
} catch (error) {
  log(`no se pudo leer de la base: ${error.message}`)
}
if (!elegida) {
  try {
    elegida = await desdeProduccion()
  } catch (error) {
    log(`no se pudo leer la de producción: ${error.message}`)
  }
}

if (elegida) {
  await mkdir('dist/respaldo', { recursive: true })
  await writeFile(DESTINO, elegida.texto, 'utf8')
  log(`incluida desde ${elegida.origen}; sha256 ${huella(elegida.texto)}`)
} else {
  log('este despliegue sale sin respaldo estático')
}
