import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { ilustracionLocalDeZona } from '@/assets/zonas'
import { MarcadorPunto, MuestraMarcador } from '@/componentes/MarcadorPunto'

// Sin red ni Supabase: los datos nunca llegan (renderToStaticMarkup no ejecuta efectos de todos modos).
vi.mock('@/datos/zonas', () => ({ obtenerZona: () => new Promise(() => {}) }))
vi.mock('@/datos/puntos', () => ({ obtenerPuntosDeZona: () => new Promise(() => {}) }))

const { PantallaMapa } = await import('@/visitante/PantallaMapa')

describe('marcador de punto', () => {
  const marcador = (estado: 'esencial' | 'opcional' | 'visitado', siguiente = false) =>
    renderToStaticMarkup(
      <MarcadorPunto
        numero={7}
        estado={estado}
        siguiente={siguiente}
        x={0.25}
        y={0.5}
        etiquetaAccesible="Punto 7, Nicho central, esencial, no visitado"
        onPresionar={() => {}}
      />,
    )

  it('es un botón con el estado en palabras, posicionado sobre la ilustración', () => {
    const html = marcador('esencial')
    expect(html).toMatch(/^<button type="button"/)
    expect(html).toContain('aria-label="Punto 7, Nicho central, esencial, no visitado"')
    expect(html).toContain('left:25%;top:50%')
    expect(html).toContain('marcador--esencial')
    expect(html).toContain('>7</span>')
  })

  it('el visitado muestra un check en lugar del número', () => {
    const html = marcador('visitado')
    expect(html).toContain('marcador--visitado')
    expect(html).not.toContain('>7</span>')
    expect(html).toContain('<svg')
  })

  it('el siguiente punto lleva su modificador (halo y pulso)', () => {
    expect(marcador('opcional', true)).toContain('marcador--opcional marcador--siguiente')
  })

  it('la muestra de la leyenda es decorativa', () => {
    expect(renderToStaticMarkup(<MuestraMarcador estado="opcional" />)).toContain(
      'aria-hidden="true"',
    )
  })
})

describe('imágenes locales de la fachada principal', () => {
  it('tiene ilustración del mapa en dos anchos', () => {
    const ilustracion = ilustracionLocalDeZona('fachada-principal')
    expect(ilustracion?.srcSet).toMatch(/ilustracion-1600.*1600w, .*ilustracion-3200.*3200w/)
    expect(ilustracionLocalDeZona('interior')).toBeNull()
  })
})

describe('pantalla del mapa', () => {
  const html = renderToStaticMarkup(
    <MemoryRouter initialEntries={['/mapa?zona=fachada-principal']}>
      <PantallaMapa />
    </MemoryRouter>,
  )

  it('tiene el lienzo de gestos y ningún botón de zoom (se acerca pellizcando)', () => {
    expect(html).toContain('class="mapa__lienzo"')
    expect(html).not.toContain('Acercar')
    expect(html).not.toContain('Alejar')
  })

  it('mientras carga lo anuncia y muestra la leyenda y el botón de volver a zonas', () => {
    expect(html).toContain('Cargando…')
    expect(html).toContain('Esencial')
    expect(html).toContain('Opcional')
    expect(html).toContain('Visitado')
    expect(html).toContain('Volver a la elección de zonas')
  })
})
