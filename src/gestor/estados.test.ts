import { describe, expect, it } from 'vitest'
import { accionesDisponibles, DESTINO } from '@/gestor/estados'

describe('flujo de estados de una ficha', () => {
  it('el editor envía un borrador a revisión, pero no aprueba', () => {
    expect(accionesDisponibles('editor', 'borrador')).toEqual(['enviarARevision'])
    expect(accionesDisponibles('editor', 'revision')).toEqual([])
    expect(accionesDisponibles('editor', 'aprobado')).toEqual([])
  })

  it('el revisor aprueba o devuelve una ficha en revisión', () => {
    expect(accionesDisponibles('revisor', 'revision')).toEqual(['aprobar', 'devolverABorrador'])
    expect(accionesDisponibles('revisor', 'aprobado')).toEqual(['devolverABorrador'])
  })

  it('el admin puede lo mismo que el revisor', () => {
    expect(accionesDisponibles('admin', 'revision')).toEqual(
      accionesDisponibles('revisor', 'revision'),
    )
  })

  it('una cuenta sin rol no puede hacer nada', () => {
    expect(accionesDisponibles(null, 'borrador')).toEqual([])
  })

  it('cada acción lleva al estado correcto', () => {
    expect(DESTINO).toEqual({
      enviarARevision: 'revision',
      aprobar: 'aprobado',
      devolverABorrador: 'borrador',
    })
  })
})
