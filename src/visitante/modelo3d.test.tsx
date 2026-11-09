/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import '@/i18n'
import { rutaConZona } from '@/visitante/camara'
import { PantallaModelo3d } from '@/visitante/PantallaModelo3d'

const render = (ruta: string) =>
  renderToStaticMarkup(
    <MemoryRouter initialEntries={[ruta]}>
      <PantallaModelo3d />
    </MemoryRouter>,
  )

describe('"Ver cómo era"', () => {
  const html = render(rutaConZona('/ver-como-era', 'fachada-principal'))
  const visor = /<model-viewer[^>]*>/.exec(html)?.[0] ?? ''

  it('muestra el modelo con su descripción y se controla con los dedos', () => {
    expect(visor).toContain('esfera-provisional')
    expect(visor).toContain('alt="Modelo 3D provisional: una esfera de prueba."')
    expect(visor).toContain('camera-controls')
    expect(visor).toContain('touch-action="none"')
  })

  it('no usa la cámara ni realidad aumentada', () => {
    expect(visor).not.toMatch(/\sar[\s=>]/)
    expect(html).not.toContain('<video')
  })

  it('avisa mientras carga, explica los gestos y aclara que es de prueba', () => {
    expect(html).toContain('Cargando…')
    expect(html).toContain('Gira con un dedo. Pellizca para acercar.')
    expect(html).toContain('todavía no representa la iglesia')
  })

  it('sin zona en la URL no muestra el modelo', () => {
    expect(render('/ver-como-era')).not.toContain('<model-viewer')
  })

  it('la esfera es un GLB de verdad y pesa menos que el límite de 5 MB', () => {
    const glb = readFileSync(new URL('../assets/modelos/esfera-provisional.glb', import.meta.url))
    expect(glb.subarray(0, 4).toString('latin1')).toBe('glTF')
    expect(glb.length).toBeLessThan(5 * 1024 * 1024)
  })
})
