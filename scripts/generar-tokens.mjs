// Genera src/estilos/tokens.css desde docs/diseno/tokens.json (la fuente de verdad del diseño).
// Uso: `npm run tokens` para escribir el archivo; `npm run tokens -- --check` falla si está desactualizado.

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import * as prettier from 'prettier'

const origen = fileURLToPath(new URL('../docs/diseno/tokens.json', import.meta.url))
const destino = fileURLToPath(new URL('../src/estilos/tokens.css', import.meta.url))

const PX_POR_REM = 16

const json = JSON.parse(await readFile(origen, 'utf8'))

// Todos los grupos con forma { tokens: [...] } (color, spacing, radius, shadow, motion...).
const tokens = Object.values(json).flatMap((grupo) => grupo?.tokens ?? [])
const nombres = new Set(tokens.map((token) => token.name))

const temas = json.color.themes.map((tema) => tema.id)
const [temaBase] = temas

// "{ink}" -> var(--ink). Falla si el alias apunta a un token que no existe.
function resolverAlias(valor) {
  return valor.replace(/\{([\w-]+)\}/g, (_, nombre) => {
    if (!nombres.has(nombre)) throw new Error(`Alias a un token inexistente: {${nombre}}`)
    return `var(--${nombre})`
  })
}

function valorEnTema(token, tema) {
  const valor = typeof token.value === 'object' ? token.value[tema] : token.value
  if (valor === undefined) throw new Error(`El token ${token.name} no tiene valor para "${tema}"`)
  return resolverAlias(valor)
}

// "-0.6px" -> "-0.0375rem", para que el ajuste de "texto más grande" escale la tipografía.
function aRem(valor) {
  const coincidencia = /^(-?\d*\.?\d+)px$/.exec(valor)
  if (!coincidencia) throw new Error(`Se esperaba un valor en px: ${valor}`)
  const rem = Number((Number(coincidencia[1]) / PX_POR_REM).toFixed(6))
  return rem === 0 ? '0' : `${rem}rem`
}

function bloque(selector, declaraciones) {
  return `${selector} {\n${declaraciones.map(([nombre, valor]) => `  ${nombre}: ${valor};`).join('\n')}\n}\n`
}

const familias = Object.entries(json.type.families).map(([nombre, valor]) => [
  `--font-${nombre}`,
  valor,
])

// :root lleva todos los tokens con el valor del tema base; los demás temas solo redefinen
// los tokens que tienen valor por tema (colores y sombras).
const raiz = bloque(':root', [
  ...familias,
  ...tokens.map((token) => [`--${token.name}`, valorEnTema(token, temaBase)]),
])

const otrosTemas = temas.slice(1).map((tema) =>
  bloque(
    `[data-theme='${tema}']`,
    tokens
      .filter((token) => typeof token.value === 'object')
      .map((token) => [`--${token.name}`, valorEnTema(token, tema)]),
  ),
)

const estilosDeTexto = json.type.groups
  .flatMap((grupo) => grupo.styles.map((estilo) => ({ ...estilo, family: grupo.family })))
  .map((estilo) =>
    bloque(`.texto-${estilo.name}`, [
      ['font-family', `var(--font-${estilo.family})`],
      ['font-size', aRem(estilo.fontSize)],
      ['line-height', aRem(estilo.lineHeight)],
      ['font-weight', String(estilo.fontWeight)],
      ['letter-spacing', aRem(estilo.letterSpacing)],
    ]),
  )

const css = [
  '/* Generado por scripts/generar-tokens.mjs desde docs/diseno/tokens.json.',
  '   No lo edites a mano: cambia el JSON y corre `npm run tokens`. */\n',
  raiz,
  ...otrosTemas,
  '/* Estilos de texto: tamaños en rem (16px = 1rem). */\n',
  ...estilosDeTexto,
].join('\n')

const opciones = await prettier.resolveConfig(destino)
const formateado = await prettier.format(css, { ...opciones, filepath: destino })

if (process.argv.includes('--check')) {
  const actual = await readFile(destino, 'utf8').catch(() => '')
  if (actual !== formateado) {
    console.error('src/estilos/tokens.css está desactualizado. Corre `npm run tokens`.')
    process.exit(1)
  }
  console.log('src/estilos/tokens.css está al día.')
} else {
  await writeFile(destino, formateado)
  console.log(`Escrito src/estilos/tokens.css (${tokens.length} tokens).`)
}
