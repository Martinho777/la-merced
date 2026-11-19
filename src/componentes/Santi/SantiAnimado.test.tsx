import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SantiAnimado } from '@/componentes/Santi/SantiAnimado'

const poses = (html: string) => [...html.matchAll(/data-pose="([^"]+)"/g)].map((m) => m[1])

describe('Santi animado', () => {
  it('en reposo solo carga su pose', () => {
    expect(poses(renderToStaticMarkup(<SantiAnimado pose="wave" animacion="reposo" />))).toEqual([
      'wave',
    ])
  })

  it('carga desde el inicio los cuadros de lo que puede llegar a hacer, sin repetirlos', () => {
    const html = renderToStaticMarkup(
      <SantiAnimado pose="idle" animacion="reposo" preparar={['habla', 'celebracion']} />,
    )
    expect(poses(html)).toEqual([
      'idle',
      'talk-0',
      'talk-1',
      'talk-2',
      'talk-3',
      'talk-o',
      'celebrate',
    ])
  })

  it('es decorativo: imágenes sin texto alternativo y confeti oculto a lectores de pantalla', () => {
    const html = renderToStaticMarkup(<SantiAnimado pose="wave" animacion="celebracion" />)
    expect(html.match(/alt=""/g)?.length).toBe(poses(html).length)
    expect(html).toContain('class="santi-animado__confeti" aria-hidden="true"')
  })
})
