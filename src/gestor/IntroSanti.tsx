import { useContext, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CircleHelp } from 'lucide-react'
import type { SantiPose } from '@/assets/santi'
import { Boton } from '@/componentes/Boton'
import { Santi } from '@/componentes/Santi/Santi'
import { RolGestor } from '@/gestor/contexto'
import '@/gestor/intro.css'

export type SeccionIntro = 'fichas' | 'ubicacion' | 'faltantes' | 'textos' | 'publicar'

const POSE: Record<SeccionIntro, SantiPose> = {
  fichas: 'reading',
  ubicacion: 'point',
  faltantes: 'thinking',
  textos: 'phone',
  publicar: 'excited',
}

/** Secciones donde se cambia algo que la copia de respaldo («Publicar») debe recoger. */
const EDITAN: readonly SeccionIntro[] = ['fichas', 'ubicacion', 'textos']

const claveVista = (seccion: SeccionIntro) => `la-merced:gestor:intro-${seccion}`

function leerVista(seccion: SeccionIntro): boolean {
  try {
    return window.localStorage.getItem(claveVista(seccion)) === 'vista'
  } catch {
    return false
  }
}

/**
 * Encabezado de cada sección del gestor: título y explicación corta, y debajo la explicación con Santi
 * (qué se hace ahí, en tres pasos; en las secciones que cambian contenido recuerda la copia de
 * respaldo). Al cerrarla —se recuerda en este navegador— queda «¿Cómo funciona?» a la derecha del
 * título para volver a abrirla.
 */
export function EncabezadoSeccion({
  seccion,
  titulo,
  texto,
}: {
  seccion: SeccionIntro
  titulo: string
  texto: string
}) {
  const { t } = useTranslation('gestor')
  const rol = useContext(RolGestor)
  const [cerrada, setCerrada] = useState(() => leerVista(seccion))

  const cambiar = (valor: boolean) => {
    setCerrada(valor)
    try {
      if (valor) window.localStorage.setItem(claveVista(seccion), 'vista')
      else window.localStorage.removeItem(claveVista(seccion))
    } catch {
      // Sin almacenamiento: se vuelve a mostrar la próxima vez.
    }
  }

  const idTitulo = `intro-${seccion}-titulo`
  return (
    <>
      <div className="seccion__encabezado">
        <div className="gestor__titulos">
          <h1 className="gestor__titulo texto-title-1">{titulo}</h1>
          <p className="gestor__texto texto-body">{texto}</p>
        </div>
        {cerrada && (
          <Boton
            type="button"
            variante="fantasma"
            tamano="sm"
            className="seccion__ayuda"
            icono={CircleHelp}
            onClick={() => cambiar(false)}
          >
            {t('intro.abrir')}
          </Boton>
        )}
      </div>
      {!cerrada && (
        <aside className="intro-santi" aria-labelledby={idTitulo}>
          <Santi pose={POSE[seccion]} tamano="md" className="intro-santi__santi" />
          <div className="intro-santi__cuerpo">
            <h2 id={idTitulo} className="texto-heading">
              {t(`intro.${seccion}.titulo`)}
            </h2>
            <p className="texto-body">{t(`intro.${seccion}.texto`)}</p>
            <ol className="intro-santi__pasos texto-body">
              <li>{t(`intro.${seccion}.paso1`)}</li>
              <li>{t(`intro.${seccion}.paso2`)}</li>
              <li>{t(`intro.${seccion}.paso3`)}</li>
            </ol>
            {EDITAN.includes(seccion) && (
              <p className="intro-santi__nota texto-body-strong">
                {t(rol === 'admin' ? 'intro.notaPublicarAdmin' : 'intro.notaPublicarEquipo')}
              </p>
            )}
            <Boton
              type="button"
              tamano="sm"
              className="intro-santi__boton"
              onClick={() => cambiar(true)}
            >
              {t('intro.entendido')}
            </Boton>
          </div>
        </aside>
      )}
    </>
  )
}
