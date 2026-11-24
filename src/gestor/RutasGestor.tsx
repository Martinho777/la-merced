import { Route, Routes, useNavigate } from 'react-router'
import type { Rol } from '@/datos/sesion'
import { EditorPunto } from '@/gestor/EditorPunto'
import { EditorTextos } from '@/gestor/EditorTextos'
import { EditorUbicaciones } from '@/gestor/EditorUbicaciones'
import { ListaPuntos } from '@/gestor/ListaPuntos'
import { NavegacionGestor } from '@/gestor/NavegacionGestor'

/**
 * Barra de secciones y rutas del gestor para un usuario con rol (van dentro de `/gestor/*`).
 * `/gestor/textos` existe para todos los roles, pero `EditorTextos` solo monta el editor para un admin
 * y a los demás les muestra «solo para administradores».
 */
export function RutasGestor({ rol }: { rol: Rol }) {
  const navegar = useNavigate()
  const lista = <ListaPuntos alAbrir={(punto) => navegar(`/gestor/punto/${punto.id}`)} />

  return (
    <>
      <NavegacionGestor rol={rol} />
      <Routes>
        <Route index element={lista} />
        <Route path="punto/:idPunto" element={<EditorPunto rol={rol} />} />
        <Route path="ubicaciones" element={<EditorUbicaciones />} />
        <Route path="textos" element={<EditorTextos rol={rol} />} />
        <Route path="*" element={lista} />
      </Routes>
    </>
  )
}
