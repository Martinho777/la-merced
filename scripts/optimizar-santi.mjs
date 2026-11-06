// Genera las versiones WebP de Santi para la app desde santi-originales/ (PNG 2048 × 2048).
// Uso: `npm run santi`. Escribe src/assets/santi/<pose>-384.webp y <pose>-768.webp, donde <pose> es
// el nombre del original sin el prefijo "santi-", y borra los WebP cuyo original ya no existe.

import { readdir, rm, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const origen = fileURLToPath(new URL('../santi-originales/', import.meta.url))
const destino = fileURLToPath(new URL('../src/assets/santi/', import.meta.url))

const ANCHOS = [384, 768]
const CALIDAD = 85
const LIMITE_KB = 60

const originales = (await readdir(origen)).filter((archivo) => archivo.endsWith('.png')).sort()
if (originales.length === 0) throw new Error('No hay PNG en santi-originales/')

const esperados = new Set()
const excedidos = []

for (const archivo of originales) {
  const pose = archivo.replace(/^santi-/, '').replace(/\.png$/, '')
  for (const ancho of ANCHOS) {
    const salida = `${pose}-${ancho}.webp`
    esperados.add(salida)
    // WebP conserva el canal alfa por defecto.
    await sharp(origen + archivo)
      .resize({ width: ancho })
      .webp({ quality: CALIDAD })
      .toFile(destino + salida)
    const kb = (await stat(destino + salida)).size / 1024
    if (ancho === 768 && kb > LIMITE_KB) excedidos.push(`${salida} (${kb.toFixed(1)} KB)`)
  }
}

for (const archivo of await readdir(destino)) {
  if (archivo.endsWith('.webp') && !esperados.has(archivo)) {
    await rm(destino + archivo)
    console.log(`Borrado ${archivo}: su original ya no existe.`)
  }
}

console.log(`Escritos ${esperados.size} WebP de ${originales.length} poses en src/assets/santi/.`)

if (excedidos.length > 0) {
  console.warn(`Superan ${LIMITE_KB} KB a 768 px:\n  ${excedidos.join('\n  ')}`)
  process.exitCode = 1
}
