import { createBrowserRouter, type RouteObject } from 'react-router'
import { LayoutRaiz } from '@/app/LayoutRaiz'
import { PantallaPrueba } from '@/visitante/PantallaPrueba'

// Rutas solo de desarrollo. En el build de producción import.meta.env.DEV es false y Vite
// elimina el import(), así que la página ni siquiera se compila.
const rutasDeDesarrollo: RouteObject[] = import.meta.env.DEV
  ? [
      {
        path: '/estilos',
        lazy: async () => {
          const { PaginaEstilos } = await import('@/desarrollo/PaginaEstilos')
          return { Component: PaginaEstilos }
        },
      },
    ]
  : []

export const router = createBrowserRouter([
  {
    element: <LayoutRaiz />,
    children: [
      { path: '/', element: <PantallaPrueba /> },
      {
        // El gestor va en su propio chunk: el visitante nunca lo descarga.
        path: '/gestor/*',
        lazy: async () => {
          const { Gestor } = await import('@/gestor/Gestor')
          return { Component: Gestor }
        },
      },
      ...rutasDeDesarrollo,
    ],
  },
])
