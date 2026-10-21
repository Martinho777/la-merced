import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { Boton } from '@/componentes/Boton'
import { GrupoOpciones } from '@/componentes/GrupoOpciones'
import { Santi } from '@/componentes/Santi/Santi'
import { idiomaActual } from '@/i18n'
import { IDIOMAS, type Idioma } from '@/lib/preferencias'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import '@/visitante/pantalla.css'

/** Si se llegó con el botón de idioma de otra pantalla, se vuelve a ella al terminar. */
function rutaDeRegreso(estado: unknown): string | null {
  if (typeof estado !== 'object' || estado === null || !('volverA' in estado)) return null
  return typeof estado.volverA === 'string' ? estado.volverA : null
}

/** Pantalla 2 (/idioma): el idioma cambia en cuanto se elige, y se guarda en el dispositivo. */
export function PantallaIdioma() {
  const { t, i18n } = useTranslation()
  const navegar = useNavigate()
  const volverA = rutaDeRegreso(useLocation().state)
  const idioma = idiomaActual()

  return (
    <div className="pantalla">
      <BarraVisitante
        volverA={volverA ?? '/'}
        etiqueta={t('navegacion.atras')}
        etiquetaAccesible={volverA ? undefined : t('navegacion.volverAlInicio')}
        sinIdioma
      />
      <div className="pantalla__cuerpo">
        <div className="pantalla__encabezado pantalla__encabezado--compacto">
          <Santi pose="head-smile" tamano="head" />
          <h1 className="pantalla__titulo texto-title-1">{t('idioma.titulo')}</h1>
        </div>
        <GrupoOpciones<Idioma>
          leyenda={t('idioma.titulo')}
          nombre="idioma"
          valor={idioma}
          onCambiar={(nuevo) => void i18n.changeLanguage(nuevo)}
          opciones={IDIOMAS.map((opcion) => ({ valor: opcion, titulo: t(`idiomas.${opcion}`) }))}
        />
      </div>
      <div className="pantalla__acciones">
        <Boton anchoCompleto onClick={() => navegar(volverA ?? '/ruta')}>
          {t('comun.continuar')}
        </Boton>
      </div>
    </div>
  )
}
