import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MarcadorEditable } from '@/gestor/componentes/MarcadorEditable'

const base = {
  numero: 3,
  seleccionado: false,
  x: 0,
  y: 0.5,
  etiquetaAccesible: 'Punto 3, Nicho, esencial',
  deshabilitado: false,
  alSeleccionar: () => {},
  alArrastrar: () => {},
  alDesplazar: () => {},
}

describe('marcador editable', () => {
  it('se coloca con las coordenadas normalizadas (0 es válido) y lleva su nombre accesible', () => {
    const html = renderToStaticMarkup(<MarcadorEditable {...base} esencial />)
    expect(html).toContain('left:0%')
    expect(html).toContain('top:50%')
    expect(html).toContain('aria-label="Punto 3, Nicho, esencial"')
    expect(html).toContain('marcador--esencial')
    expect(html).toContain('>3<')
  })

  it('el opcional usa su propia clase y el seleccionado se anuncia como presionado', () => {
    const html = renderToStaticMarkup(<MarcadorEditable {...base} esencial={false} seleccionado />)
    expect(html).toContain('marcador--opcional')
    expect(html).toContain('marcador--seleccionado')
    expect(html).toContain('aria-pressed="true"')
  })
})
