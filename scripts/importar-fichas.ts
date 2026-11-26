// Importa una entrega de la URL al gestor (formato: docs/ia/IMPORTACION-FICHAS.md).
//
//   npm run importar -- <carpeta-de-la-entrega>              simula: no escribe nada
//   npm run importar -- <carpeta-de-la-entrega> --aplicar    importa de verdad
//
// Entra con una cuenta del gestor (editor, revisor o admin): CORREO_IMPORTACION y, si no se da
// CLAVE_IMPORTACION, pide la contraseña sin mostrarla. Usa la clave pública de .env.local: las reglas
// de acceso de la base deciden qué puede escribir. Deja todo en «revision» y escribe el resumen en
// <carpeta>/resumen-importacion.json. Necesita la migración 20261125000001 aplicada (columna
// `procedencia`, restricciones de audio). Corre con Node 24 (TypeScript sin compilar).

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'
import { join, normalize, resolve, sep } from 'node:path'
import readline from 'node:readline'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import {
  contar,
  importar,
  validarManifiesto,
  type IdiomaEntrega,
  type Puertos,
} from '../src/importacion/importar.ts'

const [carpetaArg, ...banderas] = process.argv.slice(2)
if (!carpetaArg) {
  console.error('Uso: npm run importar -- <carpeta-de-la-entrega> [--aplicar]')
  process.exit(1)
}
const carpeta = resolve(carpetaArg)
const aplicar = banderas.includes('--aplicar')

/** Variables de .env.local (las lee el script; no se imprimen). */
function leerEnv(): Record<string, string> {
  try {
    return Object.fromEntries(
      readFileSync(join(process.cwd(), '.env.local'), 'utf8')
        .split(/\r?\n/)
        .filter((l) => l.includes('=') && !l.startsWith('#'))
        .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
    )
  } catch {
    return {}
  }
}

const env = { ...leerEnv(), ...process.env }
const URL = env.VITE_SUPABASE_URL
const CLAVE = env.VITE_SUPABASE_ANON_KEY
if (!URL || !CLAVE) {
  console.error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY (.env.local).')
  process.exit(1)
}

function pedirOculto(pregunta: string): Promise<string> {
  return new Promise((resolver) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    const conSalida = rl as unknown as {
      _writeToOutput: (s: string) => void
      output: NodeJS.WriteStream
    }
    conSalida._writeToOutput = (s) => conSalida.output.write(s.startsWith(pregunta) ? s : '')
    rl.question(pregunta, (r) => {
      rl.close()
      process.stdout.write('\n')
      resolver(r)
    })
  })
}

const db = createClient(URL, CLAVE, { auth: { persistSession: false, autoRefreshToken: false } })

/** Una ruta del manifiesto, siempre dentro de la carpeta de la entrega. */
function dentro(ruta: string) {
  const completa = normalize(join(carpeta, ruta))
  if (!completa.startsWith(carpeta + sep)) throw new Error(`ruta fuera de la entrega: ${ruta}`)
  return completa
}

const exigir = <T>(r: { data: T | null; error: { message: string } | null }, que: string): T => {
  if (r.error) throw new Error(`${que}: ${r.error.message}`)
  return r.data as T
}

const puertos: Puertos = {
  async leerArchivo(ruta) {
    try {
      return new Uint8Array(await readFile(dentro(ruta)))
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null
      throw e
    }
  },
  sha256: async (bytes) => createHash('sha256').update(bytes).digest('hex'),
  async prepararFoto(bytes) {
    const imagen = sharp(bytes)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
    const { data, info } = await imagen.webp({ quality: 82 }).toBuffer({ resolveWithObject: true })
    return {
      bytes: new Uint8Array(data),
      tipoMime: 'image/webp',
      extension: 'webp',
      ancho: info.width,
      alto: info.height,
    }
  },
  async buscarZona(slug) {
    return exigir(await db.from('zonas').select('id').eq('slug', slug).maybeSingle(), 'zona')
  },
  async buscarPunto(zonaId, orden) {
    return exigir(
      await db
        .from('puntos')
        .select('id, slug')
        .eq('zona_id', zonaId)
        .eq('orden', orden)
        .maybeSingle(),
      'punto',
    )
  },
  async crearPunto({ zonaId, orden, slug, esEsencial }) {
    return exigir(
      await db
        .from('puntos')
        .insert({ zona_id: zonaId, orden, slug, es_esencial: esEsencial })
        .select('id, slug')
        .single(),
      'crear punto',
    ) as { id: string; slug: string }
  },
  async buscarFicha(puntoId, idioma) {
    return exigir(
      await db
        .from('fichas')
        .select('id')
        .eq('punto_id', puntoId)
        .eq('idioma', idioma)
        .maybeSingle(),
      'ficha',
    )
  },
  async crearFicha({ puntoId, idioma, estado, textos, audioId, procedencia }) {
    const opcional = (t?: string) => t?.trim() || null
    return exigir(
      await db
        .from('fichas')
        .insert({
          punto_id: puntoId,
          idioma,
          estado,
          titulo: textos.titulo.trim(),
          que_ves: opcional(textos.que_ves),
          historia: opcional(textos.historia),
          dato_santi: opcional(textos.dato_santi),
          transcripcion: opcional(textos.transcripcion),
          audio_id: audioId,
          procedencia,
        })
        .select('id')
        .single(),
      'crear ficha',
    ) as { id: string }
  },
  async buscarMedioPorRuta(ruta) {
    return exigir(await db.from('medios').select('id').eq('ruta', ruta).maybeSingle(), 'medio')
  },
  async subirArchivo(ruta, bytes, tipoMime) {
    const { error } = await db.storage.from('medios').upload(ruta, bytes, { contentType: tipoMime })
    if (error) throw new Error(`subir ${ruta}: ${error.message}`)
  },
  async crearMedio(m) {
    const registro = await db
      .from('medios')
      .insert({
        tipo: m.tipo,
        ruta: m.ruta,
        punto_id: m.puntoId,
        idioma: m.idioma,
        texto_alternativo: m.textoAlternativo,
        credito: m.credito,
        fecha_original: m.fecha,
        derechos: m.derechos,
        ancho: m.ancho,
        alto: m.alto,
        peso_bytes: m.pesoBytes,
        orden: m.orden,
        procedencia: m.procedencia,
      })
      .select('id')
      .single()
    if (registro.error) {
      // No dejar archivos huérfanos.
      await db.storage.from('medios').remove([m.ruta])
      throw new Error(`registrar ${m.ruta}: ${registro.error.message}`)
    }
    return registro.data as { id: string }
  },
  async buscarFuente(cita) {
    const filas = exigir(
      await db.from('fuentes').select('id').eq('cita', cita).limit(1),
      'fuente',
    ) as { id: string }[]
    return filas[0] ?? null
  },
  async crearFuente({ cita, tipo, url, procedencia }) {
    return exigir(
      await db.from('fuentes').insert({ cita, tipo, url, procedencia }).select('id').single(),
      'crear fuente',
    ) as { id: string }
  },
  async vincularFuente(puntoId, fuenteId, nivel, nota) {
    const existe = exigir(
      await db
        .from('punto_fuentes')
        .select('punto_id')
        .eq('punto_id', puntoId)
        .eq('fuente_id', fuenteId)
        .maybeSingle(),
      'vínculo',
    )
    if (existe) return false
    exigir(
      await db
        .from('punto_fuentes')
        .insert({ punto_id: puntoId, fuente_id: fuenteId, nivel_confianza: nivel, nota }),
      'vincular fuente',
    )
    return true
  },
}

const manifiesto = validarManifiesto(
  JSON.parse(await readFile(join(carpeta, 'manifiesto.json'), 'utf8')),
)
for (const error of manifiesto.errores) console.error(`✗ ${error}`)
console.log(
  `Manifiesto: ${manifiesto.fichas.length} fichas válidas, ${manifiesto.rechazadas.length} con errores.`,
)

const correo = env.CORREO_IMPORTACION
if (!correo) {
  console.error('Indica la cuenta del gestor con CORREO_IMPORTACION.')
  process.exit(1)
}
const clave = env.CLAVE_IMPORTACION ?? (await pedirOculto(`Contraseña de ${correo}: `))
const sesion = await db.auth.signInWithPassword({ email: correo, password: clave })
if (sesion.error) {
  console.error(`No se pudo entrar: ${sesion.error.message}`)
  process.exit(1)
}

console.log(aplicar ? 'Importando…' : 'Simulación (sin escribir). Usa --aplicar para importar.')
const resumen = await importar(manifiesto, puertos, { simular: !aplicar })
const cuentas = contar(resumen)
console.table(cuentas)
for (const e of resumen.errores) console.log(`✗ ${e.ficha} · ${e.tipo} ${e.detalle}: ${e.error}`)
for (const o of resumen.omitidos) console.log(`· ${o.ficha} · ${o.tipo} ${o.detalle}: ${o.motivo}`)

const idiomas: IdiomaEntrega[] = ['es', 'en', 'cak']
await writeFile(
  join(carpeta, 'resumen-importacion.json'),
  `${JSON.stringify({ aplicado: aplicar, fecha: new Date().toISOString(), idiomas, cuentas, ...resumen }, null, 2)}\n`,
)
await db.auth.signOut()
process.exit(resumen.errores.length > 0 ? 2 : 0)
