// Genera supabase/semilla-textos.sql: un insert por cada clave de src/i18n/{es,en,cak}.json en la tabla
// textos_interfaz. Solo lleva lo que ya está en los JSON (el kaqchikel que falta no se inventa).
//
// Uso: `npm run db:semilla-textos` escribe el archivo; con `-- --stdout` lo imprime sin escribirlo.
// El insert usa `on conflict do nothing`: volver a aplicarlo agrega las claves nuevas sin pisar los
// textos que el admin ya cambió desde el gestor.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const raiz = fileURLToPath(new URL('../', import.meta.url))
const destino = `${raiz}supabase/semilla-textos.sql`
const IDIOMAS = ['es', 'en', 'cak']

/** { a: { b: 'x' } } → [['a.b', 'x']] */
function aplanar(objeto, prefijo = '') {
  return Object.entries(objeto).flatMap(([clave, valor]) => {
    const ruta = prefijo ? `${prefijo}.${clave}` : clave
    if (valor && typeof valor === 'object') return aplanar(valor, ruta)
    if (typeof valor !== 'string') throw new Error(`"${ruta}" no es un texto`)
    return [[ruta, valor]]
  })
}

const literal = (texto) => `'${texto.replaceAll("'", "''")}'`

const filas = []
for (const idioma of IDIOMAS) {
  const json = JSON.parse(await readFile(`${raiz}src/i18n/${idioma}.json`, 'utf8'))
  for (const [clave, texto] of aplanar(json)) {
    if (texto.trim()) filas.push(`  (${literal(clave)}, '${idioma}', ${literal(texto)})`)
  }
}

const cuenta = Object.fromEntries(
  IDIOMAS.map((i) => [i, filas.filter((f) => f.includes(`', '${i}', `)).length]),
)

const sql = `-- Generado por scripts/semilla-textos.mjs desde src/i18n/{es,en,cak}.json. No lo edites a mano:
-- cambia los JSON y corre \`npm run db:semilla-textos\`.
-- Claves: ${IDIOMAS.map((i) => `${i} ${cuenta[i]}`).join(', ')}.
-- No pisa los textos que ya existan (on conflict do nothing).

insert into public.textos_interfaz (clave, idioma, texto) values
${filas.join(',\n')}
on conflict (clave, idioma) do nothing;
`

if (process.argv.includes('--stdout')) {
  process.stdout.write(sql)
} else {
  await writeFile(destino, sql)
  console.log(`Escrito supabase/semilla-textos.sql (${filas.length} textos).`)
}
