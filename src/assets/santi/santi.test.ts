/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ANCHOS_SANTI, archivosSanti, imagenSanti, POSES } from '@/assets/santi'
import { TAMANOS_SANTI } from '@/componentes/Santi/tamanos'

const carpeta = new URL('./', import.meta.url)

describe('imágenes de Santi', () => {
  it('POSES coincide con los originales de santi-originales/', () => {
    const originales = readdirSync(new URL('../../../santi-originales/', import.meta.url))
      .filter((archivo) => archivo.endsWith('.png'))
      .map((archivo) => archivo.replace(/^santi-/, '').replace(/\.png$/, ''))
    expect([...POSES].sort()).toEqual(originales.sort())
  })

  it('hay un WebP por pose y por ancho, y nada más', () => {
    const esperados = POSES.flatMap((pose) => ANCHOS_SANTI.map((ancho) => `${pose}-${ancho}.webp`))
    const enDisco = readdirSync(carpeta).filter((archivo) => archivo.endsWith('.webp'))
    expect(enDisco.sort()).toEqual(esperados.sort())
    expect(Object.keys(archivosSanti)).toHaveLength(esperados.length)
  })

  it('imagenSanti devuelve src y srcSet con cada ancho', () => {
    const { src, srcSet } = imagenSanti('idle')
    expect(src).toContain('idle-384.webp')
    expect(srcSet).toMatch(/idle-384\.webp 384w, .*idle-768\.webp 768w/)
  })
})

describe('Santi', () => {
  it('sus tamaños coinciden con los tokens --santi-*', () => {
    const json = JSON.parse(
      readFileSync(new URL('../../../docs/diseno/tokens.json', import.meta.url), 'utf8'),
    ) as { size: { tokens: { name: string; value: string }[] } }
    for (const [tamano, px] of Object.entries(TAMANOS_SANTI)) {
      const token = json.size.tokens.find((t) => t.name === `santi-${tamano}`)
      expect(token?.value).toBe(`${px}px`)
    }
  })
})
