import { describe, expect, it } from 'vitest'
import { fuentesDisponibles, TONO_NIVEL } from '@/gestor/fuentes'

const fuente = (id: string) => ({ id, cita: id, tipo: 'libro' as const, url: '' })

describe('fuentes en el gestor', () => {
  it('ofrece solo las fuentes que el punto todavía no usa', () => {
    const vinculadas = [{ fuente: fuente('a'), nivel: 'documentado' as const, nota: '' }]
    expect(fuentesDisponibles([fuente('a'), fuente('b')], vinculadas).map((f) => f.id)).toEqual([
      'b',
    ])
  })

  it('cada nivel de confianza tiene su propio tono', () => {
    expect(new Set(Object.values(TONO_NIVEL)).size).toBe(3)
  })
})
