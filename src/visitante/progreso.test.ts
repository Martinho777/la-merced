import { beforeEach, describe, expect, it, vi } from 'vitest'
import { progreso } from '@/visitante/mapa'

/** localStorage de mentira; `falla` simula un navegador que lo bloquea. */
function instalarAlmacen(falla = false) {
  const datos = new Map<string, string>()
  vi.stubGlobal('window', {
    localStorage: {
      getItem: (clave: string) => {
        if (falla) throw new DOMException('Acceso denegado', 'SecurityError')
        return datos.get(clave) ?? null
      },
      setItem: (clave: string, valor: string) => {
        if (falla) throw new DOMException('Cuota excedida', 'QuotaExceededError')
        datos.set(clave, valor)
      },
    },
  })
  return datos
}

// El módulo guarda estado en memoria: cargarlo de nuevo equivale a recargar la página.
async function cargarModulo() {
  vi.resetModules()
  return import('@/visitante/progreso')
}

const puntos = ['a', 'b', 'c'].map((slug, i) => ({
  slug,
  orden: i + 1,
  es_esencial: true,
  pos_x: 0.5,
  pos_y: 0.5,
}))

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe('completar puntos', () => {
  it('guarda el punto y sobrevive a una recarga', async () => {
    instalarAlmacen()
    const { completarPunto, completadosDe } = await cargarModulo()
    completarPunto('z', 'a')
    expect([...completadosDe('z')]).toEqual(['a'])
    const recargado = await cargarModulo()
    expect([...recargado.completadosDe('z')]).toEqual(['a'])
  })

  it('completar dos veces no duplica ni aumenta el contador', async () => {
    const datos = instalarAlmacen()
    const { completarPunto, completadosDe } = await cargarModulo()
    completarPunto('z', 'a')
    completarPunto('z', 'a')
    expect(datos.get('la-merced:completados:z')).toBe('["a"]')
    expect(progreso(puntos, 'libre', completadosDe('z'))).toEqual({ visitados: 1, total: 3 })
  })

  it('no mezcla las zonas', async () => {
    instalarAlmacen()
    const { completarPunto, completadosDe } = await cargarModulo()
    completarPunto('uno', 'a')
    expect(completadosDe('dos').size).toBe(0)
  })

  it('sin almacenamiento sigue en memoria, y al recargar se pierde sin romper', async () => {
    instalarAlmacen(true)
    const { completarPunto, completadosDe } = await cargarModulo()
    expect(() => completarPunto('z', 'a')).not.toThrow()
    expect(completadosDe('z').has('a')).toBe(true)
    const recargado = await cargarModulo()
    expect(recargado.completadosDe('z').size).toBe(0)
  })

  it('con datos dañados empieza de cero y puede seguir', async () => {
    const datos = instalarAlmacen()
    datos.set('la-merced:completados:z', '{dañado')
    const { completarPunto, completadosDe } = await cargarModulo()
    expect(completadosDe('z').size).toBe(0)
    completarPunto('z', 'b')
    expect(datos.get('la-merced:completados:z')).toBe('["b"]')
  })

  it('un identificador que ya no existe no cuenta para el progreso', () => {
    expect(progreso(puntos, 'libre', new Set(['a', 'ya-no-existe']))).toEqual({
      visitados: 1,
      total: 3,
    })
  })

  it('el total sale de los puntos, no de un número fijo', () => {
    expect(progreso(puntos.slice(0, 2), 'libre', new Set(['a'])).total).toBe(2)
  })
})

describe('ayuda inicial', () => {
  it('aparece la primera vez y no vuelve tras cerrarla, ni al recargar', async () => {
    instalarAlmacen()
    const { debeMostrarseAyudaMapa, cerrarAyudaMapa } = await cargarModulo()
    expect(debeMostrarseAyudaMapa()).toBe(true)
    cerrarAyudaMapa()
    expect(debeMostrarseAyudaMapa()).toBe(false)
    const recargado = await cargarModulo()
    expect(recargado.debeMostrarseAyudaMapa()).toBe(false)
  })

  it('sin almacenamiento se recuerda durante la sesión', async () => {
    instalarAlmacen(true)
    const { debeMostrarseAyudaMapa, cerrarAyudaMapa } = await cargarModulo()
    expect(debeMostrarseAyudaMapa()).toBe(true)
    cerrarAyudaMapa()
    expect(debeMostrarseAyudaMapa()).toBe(false)
  })

  it('cerrarla no toca el progreso', async () => {
    const datos = instalarAlmacen()
    const { cerrarAyudaMapa, completarPunto } = await cargarModulo()
    completarPunto('z', 'a')
    cerrarAyudaMapa()
    expect(datos.get('la-merced:completados:z')).toBe('["a"]')
  })
})
