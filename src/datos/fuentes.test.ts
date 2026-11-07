import { beforeEach, describe, expect, it, vi } from 'vitest'

const llamadas: { metodo: string; args: unknown[] }[] = []
let filas: unknown[] = []

function consulta(tabla: string) {
  const c: Record<string, unknown> = {}
  for (const metodo of ['select', 'insert', 'update', 'delete', 'eq', 'order']) {
    c[metodo] = (...args: unknown[]) => {
      llamadas.push({ metodo: `${tabla}.${metodo}`, args })
      return c
    }
  }
  c.single = async () => ({
    data: { id: 'nueva', cita: 'x', tipo: 'libro', url: null },
    error: null,
  })
  c.then = (resolver: (v: unknown) => unknown) => resolver({ data: filas, error: null })
  return c
}

vi.mock('@/lib/supabase', () => ({ supabase: { from: (tabla: string) => consulta(tabla) } }))

const { columnasFuente, crearFuente, desvincularFuente, listarFuentesPunto, vincularFuente } =
  await import('@/datos/fuentes')

describe('fuentes del gestor', () => {
  beforeEach(() => {
    llamadas.length = 0
    filas = []
  })

  it('limpia la cita y guarda un enlace vacío como null', () => {
    expect(columnasFuente({ cita: ' Libro X ', tipo: 'libro', url: ' ' })).toEqual({
      cita: 'Libro X',
      tipo: 'libro',
      url: null,
    })
  })

  it('lista las fuentes del punto con su nivel, ordenadas por cita', async () => {
    filas = [
      {
        nivel_confianza: 'probable',
        nota: null,
        fuentes: { id: 'b', cita: 'Zeta', tipo: 'libro', url: null },
      },
      {
        nivel_confianza: 'documentado',
        nota: 'Fecha',
        fuentes: { id: 'a', cita: 'Alfa', tipo: 'archivo', url: 'https://x' },
      },
    ]
    const lista = await listarFuentesPunto('p1')
    expect(lista.map((f) => [f.fuente.cita, f.nivel, f.nota])).toEqual([
      ['Alfa', 'documentado', 'Fecha'],
      ['Zeta', 'probable', ''],
    ])
    expect(llamadas).toContainEqual({ metodo: 'punto_fuentes.eq', args: ['punto_id', 'p1'] })
  })

  it('vincula una fuente al punto con su nivel de confianza', async () => {
    await vincularFuente('p1', 'f1', 'especulativo', '  ')
    expect(llamadas).toContainEqual({
      metodo: 'punto_fuentes.insert',
      args: [{ punto_id: 'p1', fuente_id: 'f1', nivel_confianza: 'especulativo', nota: null }],
    })
  })

  it('quitar la fuente del punto no borra la fuente', async () => {
    await desvincularFuente('p1', 'f1')
    expect(llamadas.map((l) => l.metodo)).toEqual([
      'punto_fuentes.delete',
      'punto_fuentes.eq',
      'punto_fuentes.eq',
    ])
  })

  it('no crea una fuente sin cita', async () => {
    await expect(crearFuente({ cita: ' ', tipo: 'libro', url: '' })).rejects.toThrow('cita')
    expect(llamadas).toHaveLength(0)
  })
})
