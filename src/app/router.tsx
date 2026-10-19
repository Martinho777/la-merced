import { createBrowserRouter } from 'react-router'
import { LayoutRaiz } from '@/app/LayoutRaiz'
import { PantallaPrueba } from '@/visitante/PantallaPrueba'

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
    ],
  },
])
