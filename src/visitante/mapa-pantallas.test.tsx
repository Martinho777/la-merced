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
const { ControlesMapa } = await import('@/visitante/ControlesMapa')

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

  it('el seleccionado se anuncia y no cambia su estado', () => {
    const html = renderToStaticMarkup(
      <MarcadorPunto
        numero={7}
        estado="esencial"
        seleccionado
        x={0.25}
        y={0.5}
        etiquetaAccesible="Punto 7"
        onPresionar={() => {}}
      />,
    )
    expect(html).toContain('marcador--esencial marcador--seleccionado')
    expect(html).toContain('aria-current="true"')
    expect(html).toContain('>7</span>')
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

describe('controles del mapa', () => {
  const nulo = () => {}
  const controles = (puedeAcercar: boolean, puedeAlejar: boolean, puedeRestablecer: boolean) =>
    renderToStaticMarkup(
      <ControlesMapa
        puedeAcercar={puedeAcercar}
        puedeAlejar={puedeAlejar}
        puedeRestablecer={puedeRestablecer}
        onAcercar={nulo}
        onAlejar={nulo}
        onRestablecer={nulo}
      />,
    )

  it('son botones con nombre accesible', () => {
    const html = controles(true, true, true)
    expect(html).toContain('aria-label="Acercar el mapa"')
    expect(html).toContain('aria-label="Alejar el mapa"')
    expect(html).toContain('aria-label="Restablecer la vista del mapa"')
    expect(html).not.toContain('disabled')
  })

  it('se deshabilitan en los límites', () => {
    expect(controles(false, true, true).match(/disabled=""/g)).toHaveLength(1)
    expect(controles(false, false, false).match(/disabled=""/g)).toHaveLength(3)
  })
})

describe('pantalla del mapa', () => {
  const html = renderToStaticMarkup(
    <MemoryRouter initialEntries={['/mapa?zona=fachada-principal']}>
      <PantallaMapa />
    </MemoryRouter>,
  )

  it('sin datos no muestra a Santi ni la ayuda, que llega con el mapa cargado', () => {
    expect(html).not.toContain('Entendido')
  })

  it('tiene el lienzo de gestos', () => {
    expect(html).toContain('class="mapa__lienzo"')
  })

  it('mientras carga lo anuncia y muestra la leyenda y el botón de volver a zonas', () => {
    expect(html).toContain('Cargando…')
    expect(html).toContain('Esencial')
    expect(html).toContain('Opcional')
    expect(html).toContain('Visitado')
    expect(html).toContain('Volver a la elección de zonas')
  })
})
