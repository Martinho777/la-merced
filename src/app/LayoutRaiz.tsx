import { Outlet, ScrollRestoration } from 'react-router'

export function LayoutRaiz() {
  return (
    <main className="layout">
      <Outlet />
      {/* Cada pantalla nueva empieza arriba. */}
      <ScrollRestoration />
    </main>
  )
}
