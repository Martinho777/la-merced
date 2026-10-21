/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { idiomaInicial } from '@/i18n'
import cak from './cak.json'
import en from './en.json'
import es from './es.json'

type Arbol = { [clave: string]: string | Arbol }

function claves(arbol: Arbol, prefijo = ''): string[] {
  return Object.entries(arbol).flatMap(([clave, valor]) =>
    typeof valor === 'string' ? [prefijo + clave] : claves(valor, `${prefijo}${clave}.`),
  )
}

const clavesEs = claves(es)
const pendientes = readFileSync(new URL('./PENDIENTE-cak.md', import.meta.url), 'utf8')

describe('traducciones', () => {
  it('inglés tiene exactamente las mismas claves que español', () => {
    expect(claves(en).sort()).toEqual([...clavesEs].sort())
  })

  it('kaqchikel no tiene claves que no existan en español', () => {
    for (const clave of claves(cak)) expect(clavesEs).toContain(clave)
  })

  it('toda clave que falta en kaqchikel está en PENDIENTE-cak.md', () => {
    const traducidas = new Set(claves(cak))
    for (const clave of clavesEs.filter((c) => !traducidas.has(c))) {
      expect(pendientes, `Falta \`${clave}\` en PENDIENTE-cak.md`).toContain(`\`${clave}\``)
    }
  })

  it('arranca con el idioma guardado, o en español si no hay ninguno', () => {
    expect(idiomaInicial('en')).toBe('en')
    expect(idiomaInicial('cak')).toBe('cak')
    expect(idiomaInicial(null)).toBe('es')
  })
})
