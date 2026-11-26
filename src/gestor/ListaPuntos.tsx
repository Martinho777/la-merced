import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Boton } from '@/componentes/Boton'
import { Insignia } from '@/componentes/Insignia'
import { ChevronRight } from 'lucide-react'
import { IDIOMAS_GESTOR, listarPuntosGestor, type PuntoGestor } from '@/datos/gestor'
import { EncabezadoSeccion } from '@/gestor/IntroSanti'
import { agruparPorZona, TONO_ESTADO } from '@/gestor/lista'
import type es from '@/i18n/es.json'
import '@/gestor/lista.css'

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; puntos: PuntoGestor[] }

type ClaveZona = `zonas.${keyof typeof es.zonas}`

type FiltroLista = 'todas' | 'revision'
const FILTROS: readonly FiltroLista[] = ['todas', 'revision']

/** Si alguna ficha del punto espera revisión. */
const enRevision = (punto: PuntoGestor) =>
  IDIOMAS_GESTOR.some((idioma) => punto.fichas[idioma]?.estado === 'revision')

/** Lista de puntos de todas las zonas con el estado de su ficha en cada idioma. */
export function ListaPuntos({ alAbrir }: { alAbrir?: (punto: PuntoGestor) => void }) {
  const { t } = useTranslation('gestor')
  const { t: tGuia } = useTranslation()
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)
  const [filtro, setFiltro] = useState<FiltroLista>('todas')

  useEffect(() => {
    let vigente = true
    listarPuntosGestor()
      .then((puntos) => vigente && setEstado({ tipo: 'listo', puntos }))
      .catch(() => vigente && setEstado({ tipo: 'error' }))
    return () => {
      vigente = false
    }
  }, [intento])

  return (
    <section className="gestor__seccion">
      <EncabezadoSeccion seccion="fichas" titulo={t('lista.titulo')} texto={t('lista.texto')} />

      {estado.tipo === 'cargando' && (
        <p className="gestor__texto texto-body" role="status">
          {t('comun.cargando')}
        </p>
      )}

      {estado.tipo === 'error' && (
        <div className="gestor__seccion" role="alert">
          <p className="gestor__error texto-body">{t('lista.error')}</p>
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
      )}

      {estado.tipo === 'listo' && estado.puntos.length > 0 && (
        <div className="gestor__pestanas" role="group" aria-label={t('lista.filtro')}>
          {FILTROS.map((opcion) => (
            <Boton
              key={opcion}
              tamano="sm"
              variante={opcion === filtro ? 'primario' : 'secundario'}
              aria-pressed={opcion === filtro}
              onClick={() => setFiltro(opcion)}
            >
              {t(`lista.filtros.${opcion}`, {
                count:
                  opcion === 'todas'
                    ? estado.puntos.length
                    : estado.puntos.filter(enRevision).length,
              })}
            </Boton>
          ))}
        </div>
      )}

      {estado.tipo === 'listo' &&
        filtro === 'revision' &&
        estado.puntos.length > 0 &&
        !estado.puntos.some(enRevision) && (
          <p className="gestor__texto texto-body">{t('lista.sinRevision')}</p>
        )}

      {estado.tipo === 'listo' && estado.puntos.length === 0 && (
        <p className="gestor__texto texto-body">{t('lista.vacio')}</p>
      )}

      {estado.tipo === 'listo' &&
        agruparPorZona(
          filtro === 'revision' ? estado.puntos.filter(enRevision) : estado.puntos,
        ).map(([zona, puntos]) => (
          <section key={zona} className="gestor__grupo">
            <h2 className="gestor__subtitulo texto-heading">
              {tGuia(`zonas.${zona}` as ClaveZona, { defaultValue: zona })}
            </h2>
            <TablaPuntos puntos={puntos} alAbrir={alAbrir} />
          </section>
        ))}
    </section>
  )
}

/**
 * Los puntos de una zona como filas de una tabla: número, nombre y el estado de la ficha en cada
 * idioma, en columnas. En un teléfono, los idiomas pasan debajo del nombre (cada estado dice su idioma
 * para el lector de pantalla). Toda la fila abre el punto.
 */
function TablaPuntos({
  puntos,
  alAbrir,
}: {
  puntos: readonly PuntoGestor[]
  alAbrir?: (punto: PuntoGestor) => void
}) {
  const { t } = useTranslation('gestor')
  return (
    <div className="tabla-puntos">
      <div
        className="tabla-puntos__fila tabla-puntos__encabezado texto-small-strong"
        aria-hidden="true"
      >
        <span className="tabla-puntos__principal">
          <span className="tabla-puntos__numero">#</span>
          <span>{t('lista.columnaPunto')}</span>
        </span>
        <span className="tabla-puntos__idiomas">
          {IDIOMAS_GESTOR.map((idioma) => (
            <span key={idioma}>{idioma.toUpperCase()}</span>
          ))}
        </span>
        <span className="tabla-puntos__flecha" />
      </div>
      <ul className="tabla-puntos__lista">
        {puntos.map((punto) => (
          <li key={punto.id}>
            <button
              type="button"
              className="tabla-puntos__fila tabla-puntos__boton"
              onClick={alAbrir && (() => alAbrir(punto))}
            >
              <span className="tabla-puntos__principal">
                <span className="tabla-puntos__numero texto-body-strong">{punto.orden}</span>
                <span className="tabla-puntos__nombre texto-body-strong">
                  {punto.fichas.es?.titulo ?? t('lista.sinTitulo', { slug: punto.slug })}
                </span>
              </span>
              <span className="tabla-puntos__idiomas">
                {IDIOMAS_GESTOR.map((idioma) => {
                  const clave = punto.fichas[idioma]?.estado ?? 'falta'
                  return (
                    <span key={idioma}>
                      <Insignia tono={TONO_ESTADO[clave]}>
                        <span className="visualmente-oculto">{t(`lista.idioma.${idioma}`)}: </span>
                        {t(`estados.${clave}`)}
                      </Insignia>
                    </span>
                  )
                })}
              </span>
              <ChevronRight className="tabla-puntos__flecha" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
