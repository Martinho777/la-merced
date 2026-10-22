// Prepara la ilustración del mapa de la fachada principal desde su original
// (ilustraciones-originales/fachada-principal.png, 3200 × 1600):
//
//   src/assets/zonas/fachada-principal-ilustracion-{1600,3200}.webp
//
// Uso: node scripts/preparar-fachada.mjs

import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const raiz = (ruta) => fileURLToPath(new URL(`../${ruta}`, import.meta.url))
const ORIGEN = raiz('ilustraciones-originales/fachada-principal.png')
const DESTINO = raiz('src/assets/zonas/')

const ANCHOS = [1600, 3200]
const CALIDAD = 85

for (const ancho of ANCHOS) {
  const archivo = `fachada-principal-ilustracion-${ancho}.webp`
  const info = await sharp(ORIGEN)
    .resize({ width: ancho })
    .webp({ quality: CALIDAD })
    .toFile(DESTINO + archivo)
  console.log(`Escrito ${archivo} (${(info.size / 1024).toFixed(0)} KB)`)
}
