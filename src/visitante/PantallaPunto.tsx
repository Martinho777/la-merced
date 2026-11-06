import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Check, MoveRight } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Santi } from '@/componentes/Santi/Santi'
import type { PuntoConFicha } from '@/datos/puntos'
import type es from '@/i18n/es.json'
import { leerRuta, RUTA_POR_DEFECTO } from '@/lib/preferencias'
import { BarraAudio } from '@/visitante/BarraAudio'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import { rutaConZona } from '@/visitante/camara'
import { FotoReservada } from '@/visitante/FotoReservada'
import { numeroDeDetalle, rutaDePunto, vecinosEnRuta } from '@/visitante/mapa'
import { completarPunto, useCompletados } from '@/visitante/progreso'
import { PuntoDeRecorrido } from '@/visitante/PuntoDeRecorrido'
import { recordarPuntoAbierto } from '@/visitante/sesionMapa'
import '@/visitante/pantalla.css'
import './PantallaPunto.css'

type ClaveZona = `zonas.${keyof typeof es.zonas}`

/**
 * Ficha de un punto (/punto?zona=…&punto=…): encabezado, narración, textos, archivo y navegación por
 * la ruta. El punto solo se completa con la acción explícita de esta pantalla. El contenido que falta
 * se indica como pendiente; nunca se inventa.
 */
export function PantallaPunto() {
  return (
    <PuntoDeRecorrido>
      {({ zona, punto, recorrido }) => (
        // `key`: cambiar de punto reinicia la narración y la transcripción.
        <Ficha key={punto.slug} zona={zona} punto={punto} puntos={recorrido.puntos} />
      )}
    </PuntoDeRecorrido>
  )
}

function Ficha({
  zona,
  punto,
  puntos,
}: {
  zona: string
  punto: PuntoConFicha
  puntos: readonly PuntoConFicha[]
}) {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const completado = useCompletados(zona).has(punto.slug)
  const rutaMapa = rutaConZona('/mapa', zona)
  const { anterior, siguiente } = vecinosEnRuta(puntos, leerRuta() ?? RUTA_POR_DEFECTO, punto.slug)
  const identificador = t('punto.identificador', { numero: numeroDeDetalle(punto.orden) })
  const nombreZona = t(`zonas.${zona}` as ClaveZona, { defaultValue: zona })

  useEffect(() => recordarPuntoAbierto(zona, punto), [zona, punto])

  // Anterior y Siguiente reemplazan la entrada del historial: "atrás" no recorre punto por punto.
  const irA = (vecino: PuntoConFicha) => navegar(rutaDePunto(zona, vecino.slug), { replace: true })

  return (
    <div className="pantalla ficha">
      <header className="ficha__encabezado">
        <BarraVisitante
          volverA={rutaMapa}
          etiqueta={t('navegacion.volverAlMapa')}
          etiquetaAccesible={t('navegacion.volverAlMapa')}
        />
        <div className="ficha__titulos">
          <div className="ficha__titulos-texto">
            <p className="ficha__eyebrow texto-label">
              {t('punto.identificadorConZona', { identificador, zona: nombreZona })}
            </p>
            <h1 className="ficha__titulo texto-display">{punto.ficha?.titulo ?? identificador}</h1>
          </div>
          <Santi pose="wave" tamano="head" className="ficha__santi" />
        </div>
      </header>

      <main className="ficha__cuerpo">
        <BarraAudio audio={punto.audio} transcripcion={punto.ficha?.transcripcion ?? null} />

        <section className="ficha__seccion">
          <h2 className="ficha__subtitulo texto-title-2">{t('punto.queVes')}</h2>
          <TextoOPendiente texto={punto.ficha?.que_ves} />
        </section>

        <section className="ficha__seccion">
          <h2 className="ficha__subtitulo texto-title-2">{t('punto.historia')}</h2>
          <TextoOPendiente texto={punto.ficha?.historia} />
        </section>

        {punto.archivo.length > 0 && (
          <section className="ficha__seccion">
            <div className="ficha__archivo-encabezado">
              <h2 className="ficha__archivo-titulo texto-label">{t('punto.archivo.titulo')}</h2>
              {punto.archivo.length > 1 && (
                <p className="ficha__archivo-pista texto-small-strong">
                  {t('punto.archivo.desliza')}
                  <MoveRight className="ficha__archivo-flecha" aria-hidden="true" />
                </p>
              )}
            </div>
            {/* Enfocable para poder desplazarla con las flechas del teclado. */}
            <ul className="ficha__archivo" tabIndex={0} aria-label={t('punto.archivo.titulo')}>
              {punto.archivo.map((registro) => (
                <li key={registro.id} className="ficha__registro">
                  <FotoReservada imagen={registro} className="ficha__registro-foto" />
                  <div className="ficha__registro-datos">
                    <p className="ficha__registro-fecha texto-small-strong">
                      {registro.fecha ?? t('punto.archivo.sinFecha')}
                    </p>
                    <p className="ficha__registro-credito texto-caption">
                      {registro.credito ?? t('punto.archivo.sinCredito')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="ficha__completar">
          {completado ? (
            <p className="ficha__completado texto-body-strong" role="status">
              <Check className="ficha__completado-icono" aria-hidden="true" />
              {t('punto.completado')}
            </p>
          ) : (
            <Boton
              variante="secundario"
              tamano="sm"
              icono={Check}
              onClick={() => completarPunto(zona, punto.slug)}
            >
              {t('punto.marcarCompletado')}
            </Boton>
          )}
        </div>
      </main>

      <nav className="ficha__navegacion" aria-label={t('punto.navegacion')}>
        <Boton variante="secundario" disabled={!anterior} onClick={() => anterior && irA(anterior)}>
          {t('punto.anterior')}
        </Boton>
        <Boton className="ficha__volver" onClick={() => navegar(rutaMapa)}>
          {t('navegacion.volverAlMapa')}
        </Boton>
        <Boton
          variante="secundario"
          disabled={!siguiente}
          onClick={() => siguiente && irA(siguiente)}
        >
          {t('punto.siguiente')}
        </Boton>
      </nav>
    </div>
  )
}

function TextoOPendiente({ texto }: { texto: string | null | undefined }) {
  const { t } = useTranslation()
  return texto ? (
    <p className="ficha__texto texto-body">{texto}</p>
  ) : (
    <p className="pantalla__texto texto-body">{t('punto.contenidoPendiente')}</p>
  )
}
