import { describe, expect, it } from 'vitest'
import { fuentesDisponibles } from '@/gestor/fuentes'

const fuente = (id: string) => ({ id, cita: id, tipo: 'libro' as const, url: '' })

describe('fuentes en el gestor', () => {
  it('ofrece solo las fuentes que el punto todavía no usa', () => {
    const vinculadas = [{ fuente: fuente('a'), nivel: 'documentado' as const, nota: '' }]
    expect(fuentesDisponibles([fuente('a'), fuente('b')], vinculadas).map((f) => f.id)).toEqual([
      'b',
    ])
  })
})
