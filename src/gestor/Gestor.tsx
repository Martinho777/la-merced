// Panel del gestor (/gestor). Se carga en su propio chunk: nada del visitante lo importa.

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Route, Routes, useNavigate } from 'react-router'
import { LogOut } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { alCambiarSesion, cerrarSesion, obtenerSesion, type SesionGestor } from '@/datos/sesion'
import { EditorPunto } from '@/gestor/EditorPunto'
import { ListaPuntos } from '@/gestor/ListaPuntos'
import { PantallaEntrar } from '@/gestor/PantallaEntrar'
import '@/gestor/i18n'
import './gestor.css'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'sinSesion' }
  | { tipo: 'conSesion'; sesion: SesionGestor }

function EncabezadoGestor({ sesion, alSalir }: { sesion: SesionGestor; alSalir: () => void }) {
  const { t } = useTranslation('gestor')
  const [saliendo, setSaliendo] = useState(false)

  return (
    <header className="gestor__encabezado">
      <div className="gestor__titulos">
        <p className="gestor__marca texto-small-strong">{t('titulo')}</p>
        {sesion.rol && (
          <p className="gestor__texto texto-small">
            {t('sesion.usuario', {
              nombre: sesion.nombre ?? sesion.correo,
              rol: t(`roles.${sesion.rol}`),
            })}
          </p>
        )}
      </div>
      <Boton
        variante="secundario"
        tamano="sm"
        icono={LogOut}
        cargando={saliendo}
        onClick={() => {
          setSaliendo(true)
          alSalir()
        }}
      >
        {t('sesion.salir')}
      </Boton>
    </header>
  )
}

export function Gestor() {
  const { t } = useTranslation('gestor')
  const navegar = useNavigate()
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    const cargar = () =>
      obtenerSesion()
        .then((sesion) => {
          if (vigente) setEstado(sesion ? { tipo: 'conSesion', sesion } : { tipo: 'sinSesion' })
        })
        .catch(() => vigente && setEstado({ tipo: 'error' }))

    void cargar()
    const dejarDeEscuchar = alCambiarSesion(() => void cargar())
    return () => {
      vigente = false
      dejarDeEscuchar()
    }
  }, [intento])

  async function salir() {
    try {
      await cerrarSesion()
    } finally {
      setEstado({ tipo: 'sinSesion' })
    }
  }

  if (estado.tipo === 'cargando') {
    return (
      <p className="gestor__texto texto-body" role="status">
        {t('comun.cargando')}
      </p>
    )
  }

  if (estado.tipo === 'error') {
    return (
      <div className="gestor" role="alert">
        <p className="gestor__error texto-body">{t('sesion.errorCarga')}</p>
        <Boton
          variante="secundario"
          tamano="sm"
          onClick={() => {
            setEstado({ tipo: 'cargando' })
            setIntento((n) => n + 1)
          }}
        >
          {t('comun.reintentar')}
        </Boton>
      </div>
    )
  }

  if (estado.tipo === 'sinSesion') {
    return <PantallaEntrar alEntrar={(sesion) => setEstado({ tipo: 'conSesion', sesion })} />
  }

  const { sesion } = estado
  return (
    <div className="gestor">
      <EncabezadoGestor sesion={sesion} alSalir={() => void salir()} />
      {sesion.rol ? (
        <Routes>
          <Route
            index
            element={<ListaPuntos alAbrir={(punto) => navegar(`/gestor/punto/${punto.id}`)} />}
          />
          <Route path="punto/:idPunto" element={<EditorPunto />} />
          <Route
            path="*"
            element={<ListaPuntos alAbrir={(punto) => navegar(`/gestor/punto/${punto.id}`)} />}
          />
        </Routes>
      ) : (
        <section className="gestor__titulos">
          <h1 className="gestor__titulo texto-title-1">{t('sesion.sinRolTitulo')}</h1>
          <p className="gestor__texto texto-body">{t('sesion.sinRolTexto')}</p>
        </section>
      )}
    </div>
  )
}
