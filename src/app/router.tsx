import { createBrowserRouter, type RouteObject } from 'react-router'
import { LayoutRaiz } from '@/app/LayoutRaiz'
import { PantallaAlineacion } from '@/visitante/PantallaAlineacion'
import { PantallaBienvenida } from '@/visitante/PantallaBienvenida'
import { PantallaCamara } from '@/visitante/PantallaCamara'
import { PantallaEnConstruccion } from '@/visitante/PantallaEnConstruccion'
import { PantallaIdioma } from '@/visitante/PantallaIdioma'
import { PantallaRuta } from '@/visitante/PantallaRuta'
import { PantallaZona } from '@/visitante/PantallaZona'

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
      // Entrada del visitante (bloque 4); explicación y alineación de la cámara (bloque 3).
      { path: '/', element: <PantallaBienvenida /> },
      { path: '/idioma', element: <PantallaIdioma /> },
      { path: '/ruta', element: <PantallaRuta /> },
      { path: '/zona', element: <PantallaZona /> },
      { path: '/camara', element: <PantallaCamara /> },
      { path: '/alineacion', element: <PantallaAlineacion /> },
      // Temporal hasta que llegue la ilustración/mapa de la zona (recibe ?zona=<slug>).
      { path: '/mapa', element: <PantallaEnConstruccion /> },
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
