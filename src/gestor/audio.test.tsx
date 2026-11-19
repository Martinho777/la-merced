import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ErrorAudio, TAMANO_MAXIMO_AUDIO, tipoMimeAudio, validarAudio } from '@/gestor/audio'
import { CampoContrasena } from '@/gestor/componentes/Campo'

const archivo = (name: string, type: string, size = 1000) => ({ name, type, size })

describe('archivo de la narración', () => {
  it('acepta MP3 y M4A, aunque el navegador los nombre distinto o no los nombre', () => {
    expect(tipoMimeAudio(archivo('a.mp3', 'audio/mpeg'))).toBe('audio/mpeg')
    expect(tipoMimeAudio(archivo('a.mp3', ''))).toBe('audio/mpeg')
    expect(tipoMimeAudio(archivo('a.m4a', 'audio/x-m4a'))).toBe('audio/mp4')
    expect(tipoMimeAudio(archivo('a.M4A', ''))).toBe('audio/mp4')
    expect(tipoMimeAudio(archivo('a.m4a', 'audio/mp4'))).toBe('audio/mp4')
  })

  it('rechaza otros formatos', () => {
    expect(tipoMimeAudio(archivo('a.wav', 'audio/wav'))).toBeNull()
    expect(() => validarAudio(archivo('a.ogg', 'audio/ogg'))).toThrow(ErrorAudio)
  })

  it('rechaza archivos de más de 50 MB', () => {
    expect(() => validarAudio(archivo('a.mp3', 'audio/mpeg', TAMANO_MAXIMO_AUDIO + 1))).toThrow(
      expect.objectContaining({ motivo: 'tamano' }),
    )
    expect(validarAudio(archivo('a.mp3', 'audio/mpeg', TAMANO_MAXIMO_AUDIO))).toBe('audio/mpeg')
  })
})

describe('campo de contraseña', () => {
  const html = renderToStaticMarkup(
    <CampoContrasena
      etiqueta="Contraseña"
      etiquetaMostrar="Mostrar contraseña"
      etiquetaOcultar="Ocultar contraseña"
      autoComplete="current-password"
      value=""
      onChange={() => {}}
    />,
  )

  it('empieza oculta, con un botón que dice que la mostrará', () => {
    expect(html).toMatch(/<input[^>]*type="password"/)
    expect(html).toContain('aria-label="Mostrar contraseña"')
  })

  it('el botón no envía el formulario y controla el campo', () => {
    const id = /<input[^>]*id="([^"]+)"/.exec(html)?.[1]
    expect(html).toMatch(/<button type="button"/)
    expect(html).toContain(`aria-controls="${id}"`)
  })

  it('conserva el autocompletado de la contraseña guardada', () => {
    expect(html).toContain('autoComplete="current-password"')
  })
})
