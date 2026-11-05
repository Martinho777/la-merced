import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import '@/i18n'
import { formatearTiempo, porcentajeAvance } from '@/visitante/audio'
import { BarraAudio } from '@/visitante/BarraAudio'
import { FotoReservada } from '@/visitante/FotoReservada'
import { esperaTrasEnfocar } from '@/visitante/movimiento'

describe('espera tras acercar el mapa a un punto', () => {
  it('con movimiento reducido no incluye la transición, pero deja ver el resultado', () => {
    expect(esperaTrasEnfocar(true)).toBeGreaterThan(0)
    expect(esperaTrasEnfocar(true)).toBeLessThan(esperaTrasEnfocar(false))
  })
})

describe('tiempo de la narración', () => {
  it('formatea minutos y segundos', () => {
    expect(formatearTiempo(0)).toBe('0:00')
    expect(formatearTiempo(125.9)).toBe('2:05')
  })

  it('una duración desconocida no se muestra', () => {
    expect(formatearTiempo(null)).toBeNull()
    expect(formatearTiempo(Number.NaN)).toBeNull()
    expect(formatearTiempo(Number.POSITIVE_INFINITY)).toBeNull()
  })

  it('sin duración no hay avance, y nunca pasa de los límites', () => {
    expect(porcentajeAvance(5, null)).toBe(0)
    expect(porcentajeAvance(5, 10)).toBe(50)
    expect(porcentajeAvance(20, 10)).toBe(100)
  })
})

describe('barra de audio', () => {
  const barra = (audio: Parameters<typeof BarraAudio>[0]['audio'], transcripcion: string | null) =>
    renderToStaticMarkup(<BarraAudio audio={audio} transcripcion={transcripcion} />)

  it('sin audio ni transcripción avisa y deshabilita todo, sin simular tiempo', () => {
    const html = barra(null, null)
    expect(html).toContain('Audio próximamente')
    expect(html.match(/disabled=""/g)).toHaveLength(2)
    expect(html).not.toContain('<audio')
    expect(html).not.toContain('barra-audio__pista')
    expect(html).not.toContain('barra-audio__tiempo')
  })

  it('con transcripción y sin audio, la transcripción se puede abrir', () => {
    const html = barra(null, 'Texto')
    expect(html.match(/disabled=""/g)).toHaveLength(1)
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('Texto')
    expect(html).toContain('hidden=""')
  })

  it('con audio habilita la reproducción, nunca automática, y muestra la duración', () => {
    const html = barra({ url: '/a.mp3', duracionS: 125 }, null)
    expect(html).toContain('<audio')
    expect(html).toContain('src="/a.mp3"')
    expect(html).not.toContain('autoPlay')
    expect(html).not.toContain('autoplay')
    expect(html).toContain('0:00 / 2:05')
    expect(html).toContain('aria-label="Reproducir la historia"')
    expect(html).not.toContain('Audio próximamente')
  })

  it('con audio de duración desconocida no inventa un tiempo', () => {
    expect(barra({ url: '/a.mp3', duracionS: null }, null)).not.toContain('barra-audio__tiempo')
  })
})

describe('espacio de fotografía', () => {
  it('sin imagen queda vacío, sin <img> rota', () => {
    const vacia = renderToStaticMarkup(<FotoReservada imagen={null} className="marco" />)
    expect(vacia).toBe('<div class="foto-reservada marco"></div>')
    expect(
      renderToStaticMarkup(
        <FotoReservada imagen={{ url: null, textoAlternativo: '' }} className="marco" />,
      ),
    ).toBe(vacia)
  })

  it('con ruta muestra la imagen y su texto alternativo', () => {
    const html = renderToStaticMarkup(
      <FotoReservada imagen={{ url: '/f.webp', textoAlternativo: 'Foto' }} className="marco" />,
    )
    expect(html).toContain('src="/f.webp"')
    expect(html).toContain('alt="Foto"')
  })
})
