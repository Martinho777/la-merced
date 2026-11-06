import { describe, expect, it } from 'vitest'
import type { PuntoGestor } from '@/datos/gestor'
import { agruparPorZona, TONO_ESTADO } from '@/gestor/lista'

function punto(id: string, zona: string): PuntoGestor {
  return {
    id,
    slug: id,
    orden: 1,
    zona: { slug: zona, orden: 1 },
    fichas: { es: null, en: null },
  }
}

describe('lista de puntos del gestor', () => {
  it('agrupa por zona sin cambiar el orden de llegada', () => {
    const grupos = agruparPorZona([
      punto('a', 'fachada-principal'),
      punto('b', 'fachada-principal'),
      punto('c', 'interior'),
    ])
    expect(grupos.map(([zona, puntos]) => [zona, puntos.map((p) => p.id)])).toEqual([
      ['fachada-principal', ['a', 'b']],
      ['interior', ['c']],
    ])
  })

  it('cada estado tiene su propio tono de insignia', () => {
    const tonos = Object.values(TONO_ESTADO)
    expect(new Set(tonos).size).toBe(tonos.length)
    expect(TONO_ESTADO.aprobado).toBe('exito')
    expect(TONO_ESTADO.revision).toBe('advertencia')
  })
})
