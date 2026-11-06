// Prueba de las reglas de acceso (RLS) con los tres usuarios de prueba (editor, revisor y admin).
// Se corre desde la raíz del repo con `npm run db:probar-rls` (ver README).
// Pide las contraseñas sin mostrarlas y al final borra todo lo que creó.

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import readline from 'node:readline'
import { createClient } from '@supabase/supabase-js'

// --- Configuración --------------------------------------------------------------

const env = Object.fromEntries(
  readFileSync(join(process.cwd(), '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
)
const URL = env.VITE_SUPABASE_URL
const CLAVE = env.VITE_SUPABASE_ANON_KEY

// Correos de los usuarios de prueba; se pueden cambiar con CORREO_EDITOR, CORREO_REVISOR y CORREO_ADMIN.
const CORREOS = {
  editor: process.env.CORREO_EDITOR ?? 'martinguille17+editor@gmail.com',
  revisor: process.env.CORREO_REVISOR ?? 'martinguille17+revisor@gmail.com',
  admin: process.env.CORREO_ADMIN ?? 'martinguille17+admin@gmail.com',
}
const PUNTO = '00000000-0000-4000-b000-000000000001'
const RUTA_ARCHIVO = 'ilustraciones/prueba-rls.svg'
const SVG = new Blob(['<svg xmlns="http://www.w3.org/2000/svg"/>'], { type: 'image/svg+xml' })

const opciones = { auth: { persistSession: false, autoRefreshToken: false } }
const nuevoCliente = () => createClient(URL, CLAVE, opciones)

// --- Utilidades -----------------------------------------------------------------

function pedirOculto(pregunta) {
  return new Promise((resolver) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
    rl._writeToOutput = (s) => rl.output.write(s.startsWith(pregunta) ? s : '')
    rl.question(pregunta, (r) => {
      rl.close()
      process.stdout.write('\n')
      resolver(r)
    })
  })
}

const resultados = []
function revisar(descripcion, ok, detalle = '') {
  resultados.push(ok)
  console.log(`${ok ? '✅' : '❌'} ${descripcion}${detalle && !ok ? `  → ${detalle}` : ''}`)
}

async function entrar(rol) {
  const cliente = nuevoCliente()
  const password = await pedirOculto(`Contraseña de ${CORREOS[rol]}: `)
  const { data, error } = await cliente.auth.signInWithPassword({ email: CORREOS[rol], password })
  if (error) throw new Error(`No se pudo iniciar sesión como ${rol}: ${error.message}`)
  return { cliente, id: data.user.id }
}

const fichasDePrueba = (c) =>
  c
    .from('fichas')
    .select('id, idioma, estado, revisado_por')
    .eq('punto_id', PUNTO)
    .in('idioma', ['en', 'cak'])

// --- Pruebas --------------------------------------------------------------------

const anon = nuevoCliente()
const editor = await entrar('editor')
const revisor = await entrar('revisor')
const admin = await entrar('admin')
console.log('')

try {
  // Roles
  for (const [rol, { cliente }] of Object.entries({ editor, revisor, admin })) {
    const { data } = await cliente.rpc('rol_actual')
    revisar(`rol_actual() de ${rol} es "${rol}"`, data === rol, String(data))
  }

  // Visitante
  {
    const { data } = await anon
      .from('fichas')
      .select('titulo')
      .eq('punto_id', PUNTO)
      .eq('idioma', 'es')
    revisar('Visitante lee la ficha aprobada del punto de prueba', data?.length === 1)
    const { error } = await anon
      .from('fichas')
      .insert({ punto_id: PUNTO, idioma: 'en', titulo: 'x' })
    revisar('Visitante NO puede crear fichas', !!error)
    const { data: perfiles } = await anon.from('perfiles').select('id')
    revisar('Visitante NO ve perfiles', perfiles?.length === 0)
  }

  // Editor crea un borrador
  {
    const { error } = await editor.cliente
      .from('fichas')
      .insert({ punto_id: PUNTO, idioma: 'en', titulo: 'Prueba RLS (borrador)' })
    revisar('Editor crea una ficha en borrador', !error, error?.message)

    const { data: visitante } = await fichasDePrueba(anon)
    revisar(
      'Visitante NO ve la ficha en borrador',
      visitante?.length === 0,
      JSON.stringify(visitante),
    )

    const { data: delEditor } = await fichasDePrueba(editor.cliente)
    revisar('Editor SÍ ve la ficha en borrador', delEditor?.length === 1)
  }

  // Flujo de estados
  {
    const { error: aRevision } = await editor.cliente
      .from('fichas')
      .update({ estado: 'revision' })
      .eq('punto_id', PUNTO)
      .eq('idioma', 'en')
    revisar('Editor pasa la ficha a revisión', !aRevision, aRevision?.message)

    const { error: aAprobado } = await editor.cliente
      .from('fichas')
      .update({ estado: 'aprobado' })
      .eq('punto_id', PUNTO)
      .eq('idioma', 'en')
    revisar('Editor NO puede aprobar', !!aAprobado)

    const { error: creaAprobada } = await editor.cliente
      .from('fichas')
      .insert({ punto_id: PUNTO, idioma: 'cak', titulo: 'x', estado: 'aprobado' })
    revisar('Editor NO puede crear una ficha ya aprobada', !!creaAprobada)

    const { data: aprobada, error: errRevisor } = await revisor.cliente
      .from('fichas')
      .update({ estado: 'aprobado' })
      .eq('punto_id', PUNTO)
      .eq('idioma', 'en')
      .select('estado, revisado_por, revisado_en')
    revisar(
      'Revisor aprueba la ficha',
      !errRevisor && aprobada?.[0]?.estado === 'aprobado',
      errRevisor?.message,
    )
    revisar(
      'Se registra quién y cuándo la aprobó',
      aprobada?.[0]?.revisado_por === revisor.id && !!aprobada?.[0]?.revisado_en,
    )

    const { data: visitante } = await fichasDePrueba(anon)
    revisar('Visitante ve la ficha una vez aprobada', visitante?.length === 1)
  }

  // Perfiles y borrado
  {
    const { data: subirRol } = await editor.cliente
      .from('perfiles')
      .update({ rol: 'admin' })
      .eq('id', editor.id)
      .select()
    revisar('Editor NO puede cambiarse el rol', subirRol?.length === 0)

    const { data: borrado } = await editor.cliente
      .from('fichas')
      .delete()
      .eq('punto_id', PUNTO)
      .eq('idioma', 'en')
      .select()
    revisar('Editor NO puede borrar fichas', borrado?.length === 0)
  }

  // Almacenamiento
  {
    const { error: anonSube } = await anon.storage.from('medios').upload(RUTA_ARCHIVO, SVG)
    revisar('Visitante NO puede subir archivos', !!anonSube)

    const { error: fuera } = await editor.cliente.storage
      .from('medios')
      .upload('otra/prueba-rls.svg', SVG)
    revisar('Editor NO puede subir fuera de las 4 carpetas', !!fuera)

    const { error: sube } = await editor.cliente.storage
      .from('medios')
      .upload(RUTA_ARCHIVO, SVG, { upsert: true })
    revisar('Editor sube un archivo a ilustraciones/', !sube, sube?.message)
  }
} finally {
  // Limpieza con el admin
  const { error: e1 } = await admin.cliente
    .from('fichas')
    .delete()
    .eq('punto_id', PUNTO)
    .in('idioma', ['en', 'cak'])
  const { error: e2 } = await admin.cliente.storage.from('medios').remove([RUTA_ARCHIVO])
  const { data: quedan } = await fichasDePrueba(admin.cliente)
  revisar(
    'Admin borra lo creado por la prueba',
    !e1 && !e2 && quedan?.length === 0,
    e1?.message ?? e2?.message,
  )
}

const fallas = resultados.filter((ok) => !ok).length
console.log(`\n${resultados.length - fallas}/${resultados.length} pruebas pasaron.`)
process.exit(fallas ? 1 : 0)
