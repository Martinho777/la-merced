import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Boton } from '@/componentes/Boton'
import { Insignia } from '@/componentes/Insignia'
import { Tarjeta } from '@/componentes/Tarjeta'
import { IDIOMAS_GESTOR, listarPuntosGestor, type PuntoGestor } from '@/datos/gestor'
import { agruparPorZona, TONO_ESTADO } from '@/gestor/lista'
import type es from '@/i18n/es.json'

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
      <div className="gestor__titulos">
        <h1 className="gestor__titulo texto-title-1">{t('lista.titulo')}</h1>
        <p className="gestor__texto texto-body">{t('lista.texto')}</p>
      </div>

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
            <ul className="gestor__lista">
              {puntos.map((punto) => (
                <li key={punto.id}>
                  <Tarjeta
                    titulo={punto.fichas.es?.titulo ?? t('lista.sinTitulo', { slug: punto.slug })}
                    subtitulo={t('lista.punto', { numero: punto.orden })}
                    onPresionar={alAbrir && (() => alAbrir(punto))}
                    final={
                      <span className="gestor__insignias">
                        {IDIOMAS_GESTOR.map((idioma) => {
                          const ficha = punto.fichas[idioma]
                          const clave = ficha?.estado ?? 'falta'
                          return (
                            <Insignia key={idioma} tono={TONO_ESTADO[clave]}>
                              {t('lista.estadoIdioma', {
                                codigo: idioma.toUpperCase(),
                                estado: t(`estados.${clave}`),
                              })}
                            </Insignia>
                          )
                        })}
                      </span>
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
    </section>
  )
}
