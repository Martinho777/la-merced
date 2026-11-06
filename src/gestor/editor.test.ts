import { describe, expect, it } from 'vitest'
import type { FichaGestor } from '@/datos/gestor'
import { camposDe, hayCambios } from '@/gestor/editor'

const ficha: FichaGestor = {
  id: 'f1',
  estado: 'borrador',
  titulo: 'Portada',
  que_ves: 'La portada.',
  historia: '',
  dato_santi: '',
}

describe('editor de fichas', () => {
  it('una ficha que no existe empieza con los campos vacíos', () => {
    expect(camposDe(null)).toEqual({ titulo: '', que_ves: '', historia: '', dato_santi: '' })
  })

  it('detecta cambios sin contar espacios al inicio o al final', () => {
    expect(hayCambios(camposDe(ficha), ficha)).toBe(false)
    expect(hayCambios({ ...camposDe(ficha), titulo: ' Portada  ' }, ficha)).toBe(false)
    expect(hayCambios({ ...camposDe(ficha), historia: 'Nueva' }, ficha)).toBe(true)
    expect(hayCambios(camposDe(null), null)).toBe(false)
  })
})
