import { renderToStaticMarkup } from 'react-dom/server'
import { createMemoryRouter, MemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import '@/i18n'
import '@/gestor/i18n'
import type { Rol } from '@/datos/sesion'
import { NavegacionGestor } from '@/gestor/NavegacionGestor'
import { RutasGestor } from '@/gestor/RutasGestor'
import es from '@/gestor/i18n/es.json'

// Sin Supabase real: las pantallas se renderizan en su estado inicial ("cargando").
vi.mock('@/lib/supabase', () => ({ supabase: {} }))

const nav = es.navegacion

function barra(rol: Rol | null, ruta: string) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[ruta]}>
      <NavegacionGestor rol={rol} />
    </MemoryRouter>,
  )
}

/** El gestor completo para un rol en una dirección, con el mismo árbol de rutas que la app (/gestor/*). */
function gestor(rol: Rol, ruta: string) {
  const router = createMemoryRouter([{ path: '/gestor/*', element: <RutasGestor rol={rol} /> }], {
    initialEntries: [ruta],
  })
  return renderToStaticMarkup(<RouterProvider router={router} />)
}

describe('barra del gestor', () => {
  it('el admin ve las tres secciones', () => {
    const html = barra('admin', '/gestor')
    for (const texto of [nav.fichas, nav.ubicacion, nav.textos]) expect(html).toContain(texto)
    expect(html).toContain('href="/gestor/textos"')
  })

  it.each(['editor', 'revisor'] as const)('%s no ve Textos, pero sí Fichas y Ubicación', (rol) => {
    const html = barra(rol, '/gestor')
    expect(html).toContain(nav.fichas)
    expect(html).toContain(nav.ubicacion)
    expect(html).not.toContain(nav.textos)
    expect(html).not.toContain('/gestor/textos')
  })

  it('marca como activa solo la sección actual', () => {
    const activas = (ruta: string) => barra('admin', ruta).match(/aria-current="page"/g)?.length
    expect(activas('/gestor')).toBe(1)
    expect(barra('admin', '/gestor')).toMatch(/aria-current="page"[^>]*><span[^>]*>Fichas/)
    expect(barra('admin', '/gestor/ubicaciones')).toMatch(
      /aria-current="page"[^>]*><span[^>]*>Ubicación/,
    )
    expect(barra('admin', '/gestor/textos')).toMatch(/aria-current="page"[^>]*><span[^>]*>Textos/)
    expect(activas('/gestor/textos')).toBe(1)
  })

  it('no se muestra al editar una ficha ni sin rol', () => {
    expect(barra('admin', '/gestor/punto/abc')).toBe('')
    expect(barra(null, '/gestor')).toBe('')
  })
})

describe('rutas del gestor por rol', () => {
  it('la lista de fichas sigue en /gestor, con la barra y sin tarjeta de textos', () => {
    const html = gestor('admin', '/gestor')
    expect(html).toContain(es.lista.titulo)
    expect(html).toContain('gestor__navegacion')
    expect(html).not.toContain(es.textos.enlace)
  })

  it('/gestor/ubicaciones monta el editor de ubicaciones para editor, revisor y admin', () => {
    for (const rol of ['editor', 'revisor', 'admin'] as const) {
      expect(gestor(rol, '/gestor/ubicaciones')).toContain(es.ubicaciones.titulo)
    }
  })

  it('/gestor/textos monta el editor de textos para el admin, con Textos activa', () => {
    const html = gestor('admin', '/gestor/textos')
    // El editor está montado: espera sus datos ("cargando"), no muestra el acceso denegado.
    expect(html).toContain(es.comun.cargando)
    expect(html).not.toContain(es.textos.sinPermisoTitulo)
    expect(html).toMatch(/aria-current="page"[^>]*><span[^>]*>Textos/)
  })

  it.each(['editor', 'revisor'] as const)(
    '%s que entra directo a /gestor/textos recibe acceso denegado y no se monta el editor',
    (rol) => {
      const html = gestor(rol, '/gestor/textos')
      expect(html).toContain(es.textos.sinPermisoTitulo)
      expect(html).not.toContain(es.comun.cargando)
      expect(html).not.toContain('<iframe')
      // La barra tampoco le ofrece Textos.
      expect(html).not.toContain('href="/gestor/textos"')
    },
  )

  it('una dirección desconocida del gestor muestra la lista de fichas', () => {
    expect(gestor('editor', '/gestor/nada')).toContain(es.lista.titulo)
  })
})
