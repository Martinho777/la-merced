import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Boton } from '@/componentes/Boton'
import { GrupoOpciones } from '@/componentes/GrupoOpciones'
import { Santi } from '@/componentes/Santi/Santi'
import { guardarRuta, leerRuta, RUTA_POR_DEFECTO, RUTAS, type Ruta } from '@/lib/preferencias'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import '@/visitante/pantalla.css'

/** Pantalla 3 (/ruta): la ruta elegida se guarda en el dispositivo y se restaura al volver. */
export function PantallaRuta() {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const [ruta, setRuta] = useState<Ruta>(() => leerRuta() ?? RUTA_POR_DEFECTO)

  // La duración real todavía no existe: se muestra el marcador de es.json ("[X] min").
  const duracion = t('ruta.duracionPendiente')

  function elegir(nueva: Ruta) {
    setRuta(nueva)
    guardarRuta(nueva)
  }

  return (
    <div className="pantalla">
      <BarraVisitante
        volverA="/idioma"
        etiqueta={t('navegacion.idioma')}
        etiquetaAccesible={t('navegacion.volverAIdioma')}
      />
      <div className="pantalla__cuerpo">
        <div className="pantalla__encabezado pantalla__encabezado--santi-derecha">
          <div className="pantalla__titulos">
            <h1 className="pantalla__titulo texto-title-1">{t('ruta.titulo')}</h1>
            <p className="pantalla__texto texto-body">{t('ruta.intro')}</p>
          </div>
          <Santi pose="thinking" tamano="md" />
        </div>
        <GrupoOpciones<Ruta>
          leyenda={t('ruta.intro')}
          nombre="ruta"
          valor={ruta}
          onCambiar={elegir}
          opciones={RUTAS.map((opcion) => ({
            valor: opcion,
            titulo: t(`ruta.${opcion}.nombre`),
            subtitulo: t(`ruta.${opcion}.detalle`, { duracion }),
          }))}
        />
      </div>
      <div className="pantalla__acciones">
        <Boton anchoCompleto onClick={() => navegar('/zona')}>
          {t('comun.continuar')}
        </Boton>
      </div>
    </div>
  )
}
