import { describe, expect, it } from 'vitest'
import cak from '@/i18n/cak.json'
import es from '@/i18n/es.json'
import {
  cambiosDe,
  CLAVES_EDITABLES,
  conTexto,
  estaCambiado,
  origenDe,
  pantallaDe,
  PANTALLAS_EDITABLES,
  problemaDe,
  textoOriginal,
  textosDeLaBase,
  textosParaVistaPrevia,
  valorCampo,
  type Textos,
} from '@/gestor/textos'
import gestor from '@/gestor/i18n/es.json'

/** Una clave que (todavía) no tiene kaqchikel en cak.json, si hay alguna. */
const sinCak = CLAVES_EDITABLES.find((clave) => textoOriginal('cak', clave) === null)

describe('pantallas editables', () => {
  it('son las cinco pedidas, con sus textos', () => {
    expect(PANTALLAS_EDITABLES.map((p) => [p.id, p.claves])).toEqual([
      ['bienvenida', ['bienvenida.titulo', 'bienvenida.subtitulo', 'bienvenida.empezar']],
      ['idioma', ['idioma.titulo']],
      ['ruta', ['ruta.titulo', 'ruta.intro']],
      ['zona', ['zona.titulo']],
      ['confirmacion', ['punto.confirmacion.pregunta']],
    ])
  })

  it('cada clave existe en es.json y tiene nombre en el gestor', () => {
    for (const clave of CLAVES_EDITABLES) {
      expect(textoOriginal('es', clave), clave).toEqual(expect.any(String))
      let nodo: unknown = gestor.textos.clave
      for (const parte of clave.split('.')) nodo = (nodo as Record<string, unknown>)[parte]
      expect(nodo, clave).toEqual(expect.any(String))
    }
  })

  it('una pantalla desconocida cae a la primera', () => {
    expect(pantallaDe('zona').id).toBe('zona')
    expect(pantallaDe('otra').id).toBe('bienvenida')
    expect(pantallaDe(null).id).toBe('bienvenida')
  })
})

describe('textoOriginal', () => {
  it('lee el JSON de cada idioma', () => {
    expect(textoOriginal('es', 'bienvenida.titulo')).toBe(es.bienvenida.titulo)
    expect(textoOriginal('es', 'no.existe')).toBeNull()
    expect(textoOriginal('es', 'bienvenida')).toBeNull()
  })
})

describe('capas: JSON, base y borrador', () => {
  const base: Textos = { es: { 'zona.titulo': 'Escoge una zona' } }

  it('solo toma de la base las claves editables', () => {
    expect(
      textosDeLaBase([
        { clave: 'zona.titulo', idioma: 'en', texto: 'Pick' },
        { clave: 'comun.continuar', idioma: 'es', texto: 'Seguir' },
      ]),
    ).toEqual({ en: { 'zona.titulo': 'Pick' } })
  })

  it('el campo muestra el borrador, si no la base, si no el JSON', () => {
    expect(valorCampo(base, {}, 'es', 'zona.titulo')).toBe('Escoge una zona')
    expect(valorCampo(base, {}, 'es', 'idioma.titulo')).toBe(es.idioma.titulo)
    const borradores = conTexto({}, 'es', 'zona.titulo', 'Tu zona')
    expect(valorCampo(base, borradores, 'es', 'zona.titulo')).toBe('Tu zona')
  })

  it('un borrador igual a lo publicado no cuenta como cambio', () => {
    expect(
      estaCambiado(base, conTexto({}, 'es', 'zona.titulo', 'Escoge una zona'), 'es', 'zona.titulo'),
    ).toBe(false)
    const borradores = conTexto({}, 'es', 'zona.titulo', 'Otra')
    expect(estaCambiado(base, borradores, 'es', 'zona.titulo')).toBe(true)
    expect(cambiosDe(base, borradores, 'es', ['zona.titulo', 'idioma.titulo'])).toEqual([
      'zona.titulo',
    ])
    // Los borradores son por idioma.
    expect(cambiosDe(base, borradores, 'en', ['zona.titulo'])).toEqual([])
  })

  it('dice de dónde viene lo publicado', () => {
    expect(origenDe(base, 'es', 'zona.titulo')).toBe('editado')
    expect(origenDe(base, 'es', 'idioma.titulo')).toBe('original')
  })

  it.runIf(sinCak)(
    'en kaqchikel sin traducción, el campo empieza vacío y la vista previa usa el español',
    () => {
      const clave = sinCak!
      expect(origenDe({}, 'cak', clave)).toBe('sinTraduccion')
      expect(valorCampo({}, {}, 'cak', clave)).toBe('')
      expect(textosParaVistaPrevia({}, {}, 'cak', [clave])).toEqual({
        [clave]: textoOriginal('es', clave),
      })
    },
  )

  it('cak.json se lee tal cual, sin completar', () => {
    expect(textoOriginal('cak', 'bienvenida.titulo')).toBe(
      (cak as { bienvenida?: { titulo?: string } }).bienvenida?.titulo ?? null,
    )
  })
})

describe('validación', () => {
  it('no deja guardar vacío', () => {
    expect(problemaDe('zona.titulo', '   ')).toBe('vacio')
    expect(problemaDe('zona.titulo', 'Elige')).toBeNull()
  })

  it('pide los mismos marcadores que el español', () => {
    // zona.titulo no tiene marcadores: agregar uno rompería la pantalla.
    expect(problemaDe('zona.titulo', 'Elige {{zona}}')).toBe('marcadores')
  })
})

describe('textosParaVistaPrevia', () => {
  it('usa el borrador válido y, si no es válido, lo publicado', () => {
    const base: Textos = { en: { 'ruta.titulo': 'Pick a route' } }
    expect(
      textosParaVistaPrevia(base, conTexto({}, 'en', 'ruta.titulo', 'Your route'), 'en', [
        'ruta.titulo',
      ]),
    ).toEqual({ 'ruta.titulo': 'Your route' })
    expect(
      textosParaVistaPrevia(base, conTexto({}, 'en', 'ruta.titulo', ''), 'en', ['ruta.titulo']),
    ).toEqual({ 'ruta.titulo': 'Pick a route' })
  })
})

describe('conTexto', () => {
  it('cambia y quita sin tocar el original', () => {
    const antes: Textos = { es: { a: '1' } }
    const despues = conTexto(antes, 'es', 'b', '2')
    expect(despues).toEqual({ es: { a: '1', b: '2' } })
    expect(antes).toEqual({ es: { a: '1' } })
    expect(conTexto(despues, 'es', 'a', undefined)).toEqual({ es: { b: '2' } })
  })
})
