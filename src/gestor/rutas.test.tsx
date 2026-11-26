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

const inicio = es.inicio

function barra(ruta: string) {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[ruta]}>
      <NavegacionGestor />
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

describe('inicio del gestor', () => {
  it('el admin ve las cinco tareas', () => {
    const html = gestor('admin', '/gestor')
    expect(html).toContain(inicio.titulo)
    for (const tarea of ['fichas', 'ubicacion', 'faltantes', 'textos', 'publicar'] as const) {
      expect(html).toContain(inicio[tarea].titulo)
    }
  })

  it.each(['editor', 'revisor'] as const)('%s no ve Textos ni Publicar', (rol) => {
    const html = gestor(rol, '/gestor')
    expect(html).toContain(inicio.fichas.titulo)
    expect(html).toContain(inicio.ubicacion.titulo)
    expect(html).toContain(inicio.faltantes.titulo)
    expect(html).not.toContain(inicio.textos.titulo)
    expect(html).not.toContain(inicio.publicar.titulo)
  })
})

describe('volver al inicio', () => {
  it('cada tarea tiene el botón de volver al inicio', () => {
    for (const ruta of ['/gestor/puntos', '/gestor/ubicaciones', '/gestor/textos']) {
      expect(barra(ruta)).toContain(es.navegacion.inicio)
    }
  })

  it('no aparece en el inicio ni al editar una ficha', () => {
    expect(barra('/gestor')).toBe('')
    expect(barra('/gestor/punto/abc')).toBe('')
  })
})

describe('rutas del gestor por rol', () => {
  it('la lista de puntos está en /gestor/puntos', () => {
    expect(gestor('editor', '/gestor/puntos')).toContain(es.lista.titulo)
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
  })

  it.each(['editor', 'revisor'] as const)(
    '%s que entra directo a /gestor/textos recibe acceso denegado y no se monta el editor',
    (rol) => {
      const html = gestor(rol, '/gestor/textos')
      expect(html).toContain(es.textos.sinPermisoTitulo)
      expect(html).not.toContain(es.comun.cargando)
      expect(html).not.toContain('<iframe')
    },
  )

  it('una dirección desconocida del gestor muestra el inicio', () => {
    expect(gestor('editor', '/gestor/nada')).toContain(inicio.titulo)
  })
})
