import { beforeEach, describe, expect, it, vi } from 'vitest'

// Registra lo que se manda a Supabase y responde con la fila "guardada".
const llamadas: { metodo: string; args: unknown[] }[] = []
let error: { message: string } | null

function consulta() {
  const c: Record<string, unknown> = {}
  for (const metodo of ['insert', 'update', 'eq', 'select']) {
    c[metodo] = (...args: unknown[]) => {
      llamadas.push({ metodo, args })
      return c
    }
  }
  c.single = async () => {
    const datos = llamadas.find((l) => l.metodo === 'insert' || l.metodo === 'update')
      ?.args[0] as Record<string, unknown>
    return { data: error ? null : { id: 'f9', idioma: 'es', ...datos }, error }
  }
  return c
}

vi.mock('@/lib/supabase', () => ({ supabase: { from: () => consulta() } }))

const { estadoAlGuardar, guardarFicha, limpiarCampos } = await import('@/datos/gestor')

const campos = { titulo: ' Portada ', que_ves: '', historia: 'Texto', dato_santi: '  ' }

describe('guardar fichas', () => {
  beforeEach(() => {
    llamadas.length = 0
    error = null
  })

  it('limpia espacios y guarda los campos opcionales vacíos como null', () => {
    expect(limpiarCampos(campos)).toEqual({
      titulo: 'Portada',
      que_ves: null,
      historia: 'Texto',
      dato_santi: null,
    })
  })

  it('una ficha aprobada vuelve a revisión al editarse; las demás conservan su estado', () => {
    expect(estadoAlGuardar('aprobado')).toBe('revision')
    expect(estadoAlGuardar('revision')).toBe('revision')
    expect(estadoAlGuardar('borrador')).toBe('borrador')
  })

  it('una ficha nueva se crea en borrador para su punto e idioma', async () => {
    const guardada = await guardarFicha('p1', 'es', campos, null)
    expect(llamadas[0]).toMatchObject({
      metodo: 'insert',
      args: [{ punto_id: 'p1', idioma: 'es', estado: 'borrador', titulo: 'Portada' }],
    })
    expect(guardada.estado).toBe('borrador')
    expect(guardada.que_ves).toBe('')
  })

  it('editar una ficha aprobada la actualiza y la pasa a revisión', async () => {
    const existente = { id: 'f1', estado: 'aprobado' as const, ...campos }
    const guardada = await guardarFicha('p1', 'es', campos, existente)
    expect(llamadas[0]).toMatchObject({ metodo: 'update', args: [{ estado: 'revision' }] })
    expect(llamadas).toContainEqual({ metodo: 'eq', args: ['id', 'f1'] })
    expect(guardada.estado).toBe('revision')
  })

  it('no guarda una ficha sin nombre', async () => {
    await expect(guardarFicha('p1', 'es', { ...campos, titulo: '  ' }, null)).rejects.toThrow(
      'La ficha necesita un nombre.',
    )
    expect(llamadas).toHaveLength(0)
  })
})
