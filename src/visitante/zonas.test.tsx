import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GrupoOpciones } from '@/componentes/GrupoOpciones'
import { esSeleccionable, type Opcion } from '@/componentes/opciones'
import { puedeElegirse, zonaInicial } from '@/visitante/zonas'

const zonas = [
  { slug: 'fachada-principal', disponible: true },
  { slug: 'fachada-secundaria', disponible: false },
  { slug: 'interior', disponible: false },
]

describe('selector de zonas', () => {
  it('elige de entrada la primera zona disponible', () => {
    expect(zonaInicial(zonas)).toBe('fachada-principal')
    expect(zonaInicial([{ slug: 'interior', disponible: false }, ...zonas])).toBe(
      'fachada-principal',
    )
  })

  it('no elige nada si ninguna zona está disponible', () => {
    expect(zonaInicial(zonas.filter((z) => !z.disponible))).toBeNull()
    expect(zonaInicial([])).toBeNull()
  })

  it('una zona no disponible no se puede elegir', () => {
    expect(puedeElegirse(zonas, 'fachada-principal')).toBe(true)
    expect(puedeElegirse(zonas, 'fachada-secundaria')).toBe(false)
    expect(puedeElegirse(zonas, 'interior')).toBe(false)
    expect(puedeElegirse(zonas, 'no-existe')).toBe(false)
  })
})

describe('GrupoOpciones', () => {
  const opciones: Opcion<string>[] = [
    { valor: 'fachada-principal', titulo: 'Fachada principal', destacada: true },
    { valor: 'interior', titulo: 'Interior', etiquetaNoDisponible: 'Próximamente' },
  ]

  const html = renderToStaticMarkup(
    <GrupoOpciones
      leyenda="Elige tu zona"
      nombre="zona"
      valor="fachada-principal"
      onCambiar={() => {}}
      opciones={opciones}
    />,
  )

  it('es un grupo de radios con leyenda', () => {
    expect(html).toMatch(/^<fieldset/)
    expect(html).toContain('<legend class="visualmente-oculto">Elige tu zona</legend>')
    expect(html.match(/type="radio"/g)).toHaveLength(2)
  })

  it('deshabilita el radio de una opción no disponible y muestra su insignia', () => {
    const radioInterior = /<input[^>]*value="interior"[^>]*>/.exec(html)?.[0]
    expect(radioInterior).toContain('disabled')
    expect(html).toContain('Próximamente')
    expect(esSeleccionable(opciones[1]!)).toBe(false)
  })

  it('marca la opción elegida y deja la no disponible sin marcar', () => {
    expect(/<input[^>]*value="fachada-principal"[^>]*>/.exec(html)?.[0]).toContain('checked')
    expect(/<input[^>]*value="interior"[^>]*>/.exec(html)?.[0]).not.toContain('checked')
  })

  it('aunque el valor apunte a una opción no disponible, no la marca', () => {
    const conValorInvalido = renderToStaticMarkup(
      <GrupoOpciones
        leyenda="Elige tu zona"
        nombre="zona"
        valor="interior"
        onCambiar={() => {}}
        opciones={opciones}
      />,
    )
    expect(conValorInvalido).not.toContain('checked')
  })
})
