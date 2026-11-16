/// <reference types="node" />
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import cak from './cak.json'
import en from './en.json'
import es from './es.json'

const raiz = fileURLToPath(new URL('../../', import.meta.url))
const sql = execFileSync(process.execPath, ['scripts/semilla-textos.mjs', '--stdout'], {
  cwd: raiz,
  encoding: 'utf8',
})

type Arbol = { [clave: string]: string | Arbol }
const claves = (arbol: Arbol, prefijo = ''): string[] =>
  Object.entries(arbol).flatMap(([clave, valor]) => {
    const ruta = prefijo ? `${prefijo}.${clave}` : clave
    return typeof valor === 'string' ? [ruta] : claves(valor, ruta)
  })

const filasDe = (idioma: string) => sql.split('\n').filter((l) => l.includes(`', '${idioma}', `))

describe('semilla de textos_interfaz', () => {
  it('lleva cada clave de es, en y cak, y nada más', () => {
    expect(filasDe('es')).toHaveLength(claves(es).length)
    expect(filasDe('en')).toHaveLength(claves(en).length)
    expect(filasDe('cak')).toHaveLength(claves(cak).length)
    for (const clave of claves(es)) expect(sql).toContain(`('${clave}', 'es', `)
  })

  it('cada clave cumple la regla de formato de la base (textos_interfaz_clave_check)', () => {
    // Misma expresión que la migración 20261116000001_textos_interfaz_clave_con_guion.sql.
    const formato = /^[A-Za-z0-9_-]+(\.[A-Za-z0-9_-]+)*$/
    for (const clave of [...claves(es), ...claves(en), ...claves(cak)]) {
      expect(clave).toMatch(formato)
    }
  })

  it('no inventa kaqchikel: solo lo que ya está en cak.json', () => {
    for (const fila of filasDe('cak')) {
      const [, clave = ''] = /^\s*\('([^']+)'/.exec(fila) ?? []
      expect(claves(cak)).toContain(clave)
    }
  })

  it('escapa los apóstrofos y no pisa los textos que ya existen', () => {
    expect(sql).toContain(`'Hi! I''m Santi'`)
    expect(sql.trim().endsWith('on conflict (clave, idioma) do nothing;')).toBe(true)
  })
})
