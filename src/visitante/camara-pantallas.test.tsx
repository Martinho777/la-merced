import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import '@/i18n'

// Sin red ni Supabase: la zona nunca llega (renderToStaticMarkup no ejecuta efectos de todos modos).
const obtenerZona = vi.fn(() => new Promise(() => {}))
vi.mock('@/datos/zonas', () => ({ obtenerZona }))

const getUserMedia = vi.fn()
vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } })

const { PantallaCamara } = await import('@/visitante/PantallaCamara')
const { PantallaAlineacion } = await import('@/visitante/PantallaAlineacion')

function render(elemento: React.ReactNode, ruta: string, state?: unknown) {
  return renderToStaticMarkup(
    <MemoryRouter
      initialEntries={[
        { pathname: ruta.split('?')[0], search: ruta.slice(ruta.indexOf('?')), state },
      ]}
    >
      {elemento}
    </MemoryRouter>,
  )
}

afterEach(() => {
  getUserMedia.mockClear()
})

describe('explicación de la cámara', () => {
  const html = render(<PantallaCamara />, '/camara?zona=fachada-principal')

  it('muestra a Santi, el mensaje y los dos botones', () => {
    expect(html).toContain('Apunta la cámara a la fachada para ubicarnos. Solo es una vez.')
    expect(html).toContain('Activar cámara')
    expect(html).toContain('Saltar')
    expect(html).toContain('class="santi santi--lg"')
  })

  it('no pide la cámara al mostrarse', () => {
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it('"Activar cámara" espera a saber si la zona usa cámara', () => {
    expect(/<button[^>]*aria-busy="true"[^>]*>.*?Activar cámara/.test(html)).toBe(true)
  })
})

describe('alineación', () => {
  it('sin haber pulsado "Activar cámara" no muestra la cámara (redirige a la explicación)', () => {
    const html = render(<PantallaAlineacion />, '/alineacion?zona=fachada-principal')
    expect(html).not.toContain('<video')
    expect(getUserMedia).not.toHaveBeenCalled()
  })

  it('desde "Activar cámara" prepara un video en línea, mudo y sin audio', () => {
    const html = render(<PantallaAlineacion />, '/alineacion?zona=fachada-principal', {
      activada: true,
    })
    const video = /<video[^>]*>/.exec(html)?.[0] ?? ''
    expect(video).toContain('playsInline')
    expect(video).toContain('muted')
    expect(video).toContain('autoPlay')
    expect(html).toContain('Abriendo la cámara…')
    expect(html).toContain('Saltar')
  })
})
