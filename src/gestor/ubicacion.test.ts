import { describe, expect, it, vi } from 'vitest'
import type { PuntoGestor } from '@/datos/gestor'
import type { ResultadoGuardado } from '@/datos/ubicaciones'
import {
  aplicarResultado,
  clasificarPunto,
  colocarPunto,
  crearBorrador,
  desplazarPunto,
  editadosParaGuardar,
  ilustracionDeZona,
  posicionDelPuntero,
  puntosDeZona,
  puntosPendientes,
  tipoDeResultado,
  zonaElegida,
  zonasDe,
} from '@/gestor/ubicacion'

// `ubicacion.ts` usa `diferenciaUbicacion` de `@/datos/ubicaciones`, que importa el cliente de Supabase, y
// ese cliente lanza si faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY (como en la CI). Estas pruebas son
// de lógica pura y no usan la base: el cliente se sustituye por uno vacío, y si algo lo usara fallaría.
vi.mock('@/lib/supabase', () => ({ supabase: {} }))

function punto(id: string, zona: string, extra: Partial<PuntoGestor> = {}): PuntoGestor {
  return {
    id,
    slug: id,
    orden: 1,
    zona: { id: `id-${zona}`, slug: zona, orden: 1 },
    pos_x: null,
    pos_y: null,
    es_esencial: false,
    fichas: { es: null, en: null, cak: null },
    ...extra,
  }
}

const puntos = [
  punto('a', 'fachada-principal', { pos_x: 0.2, pos_y: 0.4, es_esencial: true }),
  punto('b', 'fachada-principal'),
  punto('c', 'interior', { pos_x: 0, pos_y: 0 }),
]

const sinResultado: ResultadoGuardado = { guardados: [], fallidos: [], sinCambios: [] }

describe('borrador de ubicaciones', () => {
  it('parte de lo guardado: coordenadas válidas, 0 y sin ubicar (null)', () => {
    const borrador = crearBorrador(puntos)
    expect(borrador['a']).toEqual({ pos_x: 0.2, pos_y: 0.4, es_esencial: true })
    expect(borrador['b']).toEqual({ pos_x: null, pos_y: null, es_esencial: false })
    expect(borrador['c']).toEqual({ pos_x: 0, pos_y: 0, es_esencial: false })
  })

  it('sin tocar nada no hay cambios pendientes ni nada que guardar', () => {
    const borrador = crearBorrador(puntos)
    expect(puntosPendientes(puntos, borrador)).toEqual([])
    expect(editadosParaGuardar(puntos, borrador)).toEqual([])
  })

  it('mover un punto lo deja pendiente sin tocar el resto ni lo guardado', () => {
    const borrador = colocarPunto(crearBorrador(puntos), 'a', 0.5, 0.6)
    expect(borrador['a']).toEqual({ pos_x: 0.5, pos_y: 0.6, es_esencial: true })
    expect(puntosPendientes(puntos, borrador)).toEqual(['a'])
    expect(puntos[0]?.pos_x).toBe(0.2)
  })

  it('un punto sin ubicar puede colocarse, incluso en la esquina (0, 0)', () => {
    const borrador = colocarPunto(crearBorrador(puntos), 'b', 0, 0)
    expect(borrador['b']).toMatchObject({ pos_x: 0, pos_y: 0 })
    expect(puntosPendientes(puntos, borrador)).toEqual(['b'])
  })

  it('limita las coordenadas a la ilustración y descarta valores no finitos', () => {
    const base = crearBorrador(puntos)
    expect(colocarPunto(base, 'a', -3, 7)['a']).toMatchObject({ pos_x: 0, pos_y: 1 })
    expect(colocarPunto(base, 'a', 1, 1)['a']).toMatchObject({ pos_x: 1, pos_y: 1 })
    expect(colocarPunto(base, 'a', Number.NaN, 0.5)).toBe(base)
    expect(colocarPunto(base, 'a', 0.5, Infinity)).toBe(base)
    expect(colocarPunto(base, 'no-existe', 0.5, 0.5)).toBe(base)
  })

  it('desplazar con el teclado respeta los límites y no ubica puntos sin ubicar', () => {
    const base = crearBorrador(puntos)
    expect(desplazarPunto(base, 'a', 0.05, -0.1)['a']).toMatchObject({
      pos_x: expect.closeTo(0.25, 10),
      pos_y: expect.closeTo(0.3, 10),
    })
    expect(desplazarPunto(base, 'c', -0.05, -0.05)['c']).toMatchObject({ pos_x: 0, pos_y: 0 })
    expect(desplazarPunto(base, 'b', 0.05, 0.05)).toBe(base)
  })

  it('cambiar la clasificación deja el punto pendiente; volver al valor original, no', () => {
    const base = crearBorrador(puntos)
    const opcional = clasificarPunto(base, 'a', false)
    expect(puntosPendientes(puntos, opcional)).toEqual(['a'])
    expect(puntosPendientes(puntos, clasificarPunto(opcional, 'a', true))).toEqual([])
  })

  it('mover y devolver el punto a su lugar no cuenta como cambio', () => {
    const movido = colocarPunto(crearBorrador(puntos), 'a', 0.9, 0.9)
    const devuelto = colocarPunto(movido, 'a', 0.2, 0.4)
    expect(puntosPendientes(puntos, devuelto)).toEqual([])
  })

  it('solo se mandan a guardar los puntos pendientes, con su valor original y el nuevo', () => {
    let borrador = colocarPunto(crearBorrador(puntos), 'b', 0.3, 0.3)
    borrador = clasificarPunto(borrador, 'c', true)
    expect(editadosParaGuardar(puntos, borrador).map((e) => e.id)).toEqual(['b', 'c'])
    expect(editadosParaGuardar(puntos, borrador)[0]).toEqual({
      id: 'b',
      original: { pos_x: null, pos_y: null, es_esencial: false },
      nueva: { pos_x: 0.3, pos_y: 0.3, es_esencial: false },
    })
  })

  it('descartar es volver a crear el borrador desde lo guardado', () => {
    let borrador = colocarPunto(crearBorrador(puntos), 'a', 0.9, 0.9)
    borrador = clasificarPunto(borrador, 'b', true)
    expect(puntosPendientes(puntos, borrador)).toHaveLength(2)
    expect(puntosPendientes(puntos, crearBorrador(puntos))).toEqual([])
  })
})

describe('resultado del guardado', () => {
  const editado = () => {
    let borrador = colocarPunto(crearBorrador(puntos), 'a', 0.5, 0.5)
    borrador = colocarPunto(borrador, 'b', 0.7, 0.7)
    return borrador
  }

  it('si todo se guardó, los originales se actualizan y no queda nada pendiente', () => {
    const borrador = editado()
    const resultado: ResultadoGuardado = {
      ...sinResultado,
      guardados: [
        { id: 'a', ubicacion: { pos_x: 0.5, pos_y: 0.5, es_esencial: true } },
        { id: 'b', ubicacion: { pos_x: 0.7, pos_y: 0.7, es_esencial: false } },
      ],
    }
    const siguiente = aplicarResultado(puntos, borrador, resultado)
    expect(siguiente.puntos.find((p) => p.id === 'a')).toMatchObject({ pos_x: 0.5, pos_y: 0.5 })
    expect(puntosPendientes(siguiente.puntos, siguiente.borrador)).toEqual([])
    expect(tipoDeResultado(resultado)).toBe('exito')
  })

  it('con un fallo parcial, el punto fallido conserva su borrador y sigue pendiente', () => {
    const borrador = editado()
    const resultado: ResultadoGuardado = {
      guardados: [{ id: 'a', ubicacion: { pos_x: 0.5, pos_y: 0.5, es_esencial: true } }],
      fallidos: [{ id: 'b', mensaje: 'sin permiso' }],
      sinCambios: [],
    }
    const siguiente = aplicarResultado(puntos, borrador, resultado)
    expect(puntosPendientes(siguiente.puntos, siguiente.borrador)).toEqual(['b'])
    expect(siguiente.borrador['b']).toMatchObject({ pos_x: 0.7, pos_y: 0.7 })
    // Lo confirmado de b sigue siendo "sin ubicar": lo que hay en la base.
    expect(siguiente.puntos.find((p) => p.id === 'b')).toMatchObject({ pos_x: null, pos_y: null })
    expect(tipoDeResultado(resultado)).toBe('parcial')
  })

  it('si todo falla, nada se confirma y todo sigue pendiente', () => {
    const borrador = editado()
    const resultado: ResultadoGuardado = {
      guardados: [],
      fallidos: [
        { id: 'a', mensaje: 'x' },
        { id: 'b', mensaje: 'y' },
      ],
      sinCambios: [],
    }
    const siguiente = aplicarResultado(puntos, borrador, resultado)
    expect(siguiente.puntos).toEqual(puntos)
    expect(puntosPendientes(siguiente.puntos, siguiente.borrador)).toEqual(['a', 'b'])
    expect(tipoDeResultado(resultado)).toBe('error')
  })

  it('sin guardados ni fallos es "sin cambios"', () => {
    expect(tipoDeResultado({ ...sinResultado, sinCambios: ['a'] })).toBe('sinCambios')
    expect(tipoDeResultado(sinResultado)).toBe('sinCambios')
  })
})

describe('zonas', () => {
  it('lista las zonas con puntos en orden y sin repetir', () => {
    expect(zonasDe(puntos)).toEqual(['fachada-principal', 'interior'])
    expect(zonasDe([])).toEqual([])
  })

  it('los puntos de una zona', () => {
    expect(puntosDeZona(puntos, 'fachada-principal').map((p) => p.id)).toEqual(['a', 'b'])
    expect(puntosDeZona(puntos, 'interior').map((p) => p.id)).toEqual(['c'])
    expect(puntosDeZona(puntos, null)).toEqual([])
  })

  it('la zona elegida es la preferida si existe, y si no la primera', () => {
    const zonas = ['fachada-principal', 'interior']
    expect(zonaElegida(zonas, 'interior')).toBe('interior')
    expect(zonaElegida(zonas, 'otra')).toBe('fachada-principal')
    expect(zonaElegida(zonas, null)).toBe('fachada-principal')
    expect(zonaElegida([], 'interior')).toBeNull()
  })

  it('el borrador es de todas las zonas: cambiar de zona no pierde cambios', () => {
    const borrador = colocarPunto(crearBorrador(puntos), 'a', 0.9, 0.9)
    // Se mira otra zona: el borrador es el mismo y sigue pendiente.
    expect(puntosDeZona(puntos, 'interior').map((p) => p.id)).toEqual(['c'])
    expect(puntosPendientes(puntos, borrador)).toEqual(['a'])
  })
})

describe('ilustración de la zona', () => {
  it('usa la de la base si la zona la tiene', () => {
    expect(ilustracionDeZona('https://base/fachada.webp', 'fachada-principal')).toEqual({
      src: 'https://base/fachada.webp',
      srcSet: undefined,
    })
  })

  it('si no, usa la local de la zona', () => {
    const local = ilustracionDeZona(null, 'fachada-principal')
    expect(local?.src).toBeTruthy()
    expect(local?.srcSet).toContain('1600w')
    expect(ilustracionDeZona(undefined, 'fachada-principal')).toEqual(local)
  })

  it('una zona sin ilustración ni en la base ni local no tiene ninguna', () => {
    expect(ilustracionDeZona(null, 'interior')).toBeNull()
  })
})

describe('posición del puntero sobre la ilustración', () => {
  // La ilustración en pantalla: 400 × 200 (2:1), a partir de (50, 100).
  const caja = { left: 50, top: 100, width: 400, height: 200 }

  it('esquinas y centro', () => {
    expect(posicionDelPuntero(caja, { x: 50, y: 100 })).toEqual({ x: 0, y: 0 })
    expect(posicionDelPuntero(caja, { x: 250, y: 200 })).toEqual({ x: 0.5, y: 0.5 })
    expect(posicionDelPuntero(caja, { x: 450, y: 300 })).toEqual({ x: 1, y: 1 })
  })

  it('un cuarto del ancho y tres cuartos del alto', () => {
    expect(posicionDelPuntero(caja, { x: 150, y: 250 })).toEqual({ x: 0.25, y: 0.75 })
  })

  it('limita lo que cae fuera de la ilustración', () => {
    expect(posicionDelPuntero(caja, { x: -500, y: 9999 })).toEqual({ x: 0, y: 1 })
  })

  it('sin tamaño o con valores inválidos no hay posición', () => {
    expect(posicionDelPuntero({ ...caja, width: 0 }, { x: 10, y: 10 })).toBeNull()
    expect(posicionDelPuntero({ ...caja, height: 0 }, { x: 10, y: 10 })).toBeNull()
    expect(posicionDelPuntero(caja, { x: Number.NaN, y: 10 })).toBeNull()
  })
})
