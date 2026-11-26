import { Route, Routes, useNavigate } from 'react-router'
import type { Rol } from '@/datos/sesion'
import { RolGestor } from '@/gestor/contexto'
import { EditorPunto } from '@/gestor/EditorPunto'
import { EditorTextos } from '@/gestor/EditorTextos'
import { EditorUbicaciones } from '@/gestor/EditorUbicaciones'
import { InicioGestor } from '@/gestor/InicioGestor'
import { ListaPuntos } from '@/gestor/ListaPuntos'
import { PantallaFaltantes } from '@/gestor/PantallaFaltantes'
import { PantallaPublicar } from '@/gestor/PantallaPublicar'

/**
 * Rutas del gestor para un usuario con rol (van dentro de `/gestor/*`): el inicio con las tareas y una
 * dirección por tarea, cada una con su botón de volver al inicio. `/gestor/textos` y
 * `/gestor/publicar` existen para todos los roles, pero solo montan su pantalla para un admin.
 */
export function RutasGestor({ rol }: { rol: Rol }) {
  const navegar = useNavigate()
  const inicio = <InicioGestor rol={rol} />

  return (
    <RolGestor.Provider value={rol}>
      <Routes>
        <Route index element={inicio} />
        <Route
          path="puntos"
          element={<ListaPuntos alAbrir={(punto) => navegar(`/gestor/punto/${punto.id}`)} />}
        />
        <Route path="punto/:idPunto" element={<EditorPunto rol={rol} />} />
        <Route path="ubicaciones" element={<EditorUbicaciones rol={rol} />} />
        <Route path="textos" element={<EditorTextos rol={rol} />} />
        <Route path="faltantes" element={<PantallaFaltantes />} />
        <Route path="publicar" element={<PantallaPublicar rol={rol} />} />
        <Route path="*" element={inicio} />
      </Routes>
    </RolGestor.Provider>
  )
}
