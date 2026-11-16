import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from '@/app/router'
import { leerTextosInterfaz } from '@/datos/textos'
import i18n from '@/i18n'
import { cargarTextosDeLaBase } from '@/i18n/textosBase'
import '@/estilos/tokens.css'
import '@/estilos/base.css'
import '@/app/estilos.css'

// Sin esperar: la app se muestra con los JSON y cambia a los textos de la base cuando llegan.
void cargarTextosDeLaBase(i18n, leerTextosInterfaz)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
