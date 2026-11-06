/// <reference types="node" />
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const raiz = fileURLToPath(new URL('../../', import.meta.url))
const leer = (ruta: string) => readFileSync(raiz + ruta, 'utf8')

type Token = { name: string; value: string | Record<string, string> }
type Grupo = { tokens?: Token[] }

const json = JSON.parse(leer('docs/diseno/tokens.json')) as Record<string, unknown> & {
  type: { groups: { styles: { name: string }[] }[] }
}
const tokens = Object.values(json).flatMap((grupo) => (grupo as Grupo | null)?.tokens ?? [])
const css = leer('src/estilos/tokens.css')

describe('tokens.css', () => {
  it('está al día con docs/diseno/tokens.json', () => {
    // Lanza si el script termina con error (archivo desactualizado).
    execFileSync(process.execPath, ['scripts/generar-tokens.mjs', '--check'], { cwd: raiz })
  })

  it('declara cada token como propiedad CSS con el mismo nombre', () => {
    const [, bloqueContraste = ''] = css.split("[data-theme='contrast']")
    for (const token of tokens) {
      expect(css).toContain(`--${token.name}:`)
      if (typeof token.value === 'object') expect(bloqueContraste).toContain(`--${token.name}:`)
    }
  })

  it('genera una clase por estilo de texto', () => {
    for (const estilo of json.type.groups.flatMap((grupo) => grupo.styles)) {
      expect(css).toContain(`.texto-${estilo.name} {`)
    }
  })
})

describe('hojas de estilo de componentes', () => {
  const hojas = ['src/componentes', 'src/desarrollo', 'src/app', 'src/estilos']
    .flatMap((carpeta) =>
      readdirSync(raiz + carpeta, { recursive: true, encoding: 'utf8' }).map(
        (archivo) => `${carpeta}/${archivo.replaceAll('\\', '/')}`,
      ),
    )
    .filter((ruta) => ruta.endsWith('.css') && !ruta.endsWith('tokens.css'))

  it.each(hojas)('%s solo usa tokens (sin hex, px ni ms)', (ruta) => {
    const sinComentarios = leer(ruta).replace(/\/\*[\s\S]*?\*\//g, '')
    expect(sinComentarios).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(sinComentarios).not.toMatch(/\d+(\.\d+)?px\b/)
    expect(sinComentarios).not.toMatch(/\d+(\.\d+)?m?s\b/)
  })
})
