import { Outlet } from 'react-router'

export function LayoutRaiz() {
  return (
    <main className="layout">
      <Outlet />
    </main>
  )
}
