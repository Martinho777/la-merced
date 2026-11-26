import { Fragment, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock,
  Download,
  Minus,
  X,
  type LucideIcon,
} from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Insignia, type TonoInsignia } from '@/componentes/Insignia'
import { leerPuntosParaReporte } from '@/datos/faltantes'
import {
  aCsv,
  aMarkdown,
  cuadroDeTodo,
  faltantesDeTodo,
  IDIOMAS_REPORTE,
  type CuadroPunto,
  type EstadoCasilla,
  type Faltante,
  type Gravedad,
  type PuntoReporte,
} from '@/gestor/faltantes'
import { EncabezadoSeccion } from '@/gestor/IntroSanti'
import '@/gestor/faltantes.css'

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; puntos: PuntoReporte[] }

const TONO: Record<Gravedad, TonoInsignia> = {
  obligatorio: 'error',
  recomendado: 'advertencia',
  revision: 'info',
}

/** Cada estado tiene su forma además de su color (contraste.md: el color nunca va solo). */
const ICONO: Record<EstadoCasilla, LucideIcon> = {
  listo: Check,
  obligatorio: X,
  recomendado: CircleAlert,
  revision: Clock,
  sinFicha: Minus,
}

const ESTADOS_LEYENDA: readonly EstadoCasilla[] = [
  'listo',
  'obligatorio',
  'recomendado',
  'revision',
]
const PARTES_IDIOMA = ['texto', 'audio', 'aprobacion'] as const

function descargar(nombre: string, contenido: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(url)
}

function Casilla({ estado, parte }: { estado: EstadoCasilla; parte: string }) {
  const { t } = useTranslation('gestor')
  const Icono = ICONO[estado]
  return (
    <td className={`cuadro__casilla cuadro__casilla--${estado}`}>
      <Icono className="cuadro__icono" aria-hidden="true" />
      <span className="visualmente-oculto">
        {t('faltantes.casilla', { parte, estado: t(`faltantes.estado.${estado}`) })}
      </span>
    </td>
  )
}

/**
 * Lo que falta (/gestor/faltantes): un cuadro con una fila por punto y una casilla por parte de la
 * ficha (texto, narración y aprobación por idioma; foto y fuentes), y el detalle de cada punto al
 * abrir su fila. Se descarga en CSV o Markdown para mandárselo a la URL.
 */
export function PantallaFaltantes() {
  const { t } = useTranslation('gestor')
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)
  const [abierto, setAbierto] = useState<string | null>(null)

  useEffect(() => {
    let vigente = true
    leerPuntosParaReporte()
      .then((puntos) => vigente && setEstado({ tipo: 'listo', puntos }))
      .catch(() => vigente && setEstado({ tipo: 'error' }))
    return () => {
      vigente = false
    }
  }, [intento])

  const { filas, cuadros } = useMemo(() => {
    if (estado.tipo !== 'listo') return { filas: [] as Faltante[], cuadros: [] as CuadroPunto[] }
    return { filas: faltantesDeTodo(estado.puntos), cuadros: cuadroDeTodo(estado.puntos) }
  }, [estado])

  const fecha = new Date().toISOString().slice(0, 10)
  const total = (gravedad: Gravedad) => filas.filter((f) => f.gravedad === gravedad).length
  const columnas = IDIOMAS_REPORTE.length * PARTES_IDIOMA.length + 3

  return (
    <section className="gestor__seccion">
      <EncabezadoSeccion
        seccion="faltantes"
        titulo={t('faltantes.titulo')}
        texto={t('faltantes.texto')}
      />

      {estado.tipo === 'cargando' && (
        <p className="gestor__texto texto-body" role="status">
          {t('comun.cargando')}
        </p>
      )}
      {estado.tipo === 'error' && (
        <div className="gestor__seccion" role="alert">
          <p className="gestor__error texto-body">{t('faltantes.error')}</p>
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

      {estado.tipo === 'listo' && (
        <>
          <p className="cuadro__resumen texto-body-strong">
            {t('faltantes.resumenCorto', {
              obligatorios: total('obligatorio'),
              recomendados: total('recomendado'),
              revision: total('revision'),
              puntos: cuadros.length,
            })}
          </p>

          <ul className="cuadro__leyenda texto-small" aria-label={t('faltantes.leyenda')}>
            {ESTADOS_LEYENDA.map((clave) => {
              const Icono = ICONO[clave]
              return (
                <li key={clave} className={`cuadro__casilla--${clave}`}>
                  <Icono className="cuadro__icono" aria-hidden="true" />
                  {t(`faltantes.estado.${clave}`)}
                </li>
              )
            })}
          </ul>

          <div className="cuadro__marco">
            <table className="cuadro">
              <caption className="visualmente-oculto">{t('faltantes.cuadro')}</caption>
              <thead className="texto-small-strong">
                <tr>
                  <th scope="col" rowSpan={2} className="cuadro__punto">
                    {t('faltantes.columnas.punto')}
                  </th>
                  {IDIOMAS_REPORTE.map((idioma) => (
                    <th key={idioma} scope="colgroup" colSpan={PARTES_IDIOMA.length}>
                      {t(`faltantes.idiomas.${idioma}`)}
                    </th>
                  ))}
                  <th scope="col" rowSpan={2}>
                    {t('faltantes.columnas.foto')}
                  </th>
                  <th scope="col" rowSpan={2}>
                    {t('faltantes.columnas.fuentes')}
                  </th>
                </tr>
                <tr>
                  {IDIOMAS_REPORTE.flatMap((idioma) =>
                    PARTES_IDIOMA.map((parte) => (
                      <th key={`${idioma}-${parte}`} scope="col" className="cuadro__subcolumna">
                        {t(`faltantes.columnas.${parte}`)}
                      </th>
                    )),
                  )}
                </tr>
              </thead>
              <tbody>
                {cuadros.map((cuadro) => {
                  const abiertoAqui = abierto === cuadro.numero
                  const Flecha = abiertoAqui ? ChevronDown : ChevronRight
                  return (
                    <Fragment key={cuadro.numero}>
                      <tr>
                        <th scope="row" className="cuadro__punto">
                          <button
                            type="button"
                            className="cuadro__abrir texto-body-strong"
                            aria-expanded={abiertoAqui}
                            onClick={() => setAbierto(abiertoAqui ? null : cuadro.numero)}
                          >
                            <Flecha className="cuadro__icono" aria-hidden="true" />
                            {t('faltantes.ficha', { numero: cuadro.numero, titulo: cuadro.titulo })}
                          </button>
                        </th>
                        {IDIOMAS_REPORTE.flatMap((idioma) =>
                          PARTES_IDIOMA.map((parte) => (
                            <Casilla
                              key={`${idioma}-${parte}`}
                              estado={cuadro.idiomas[idioma][parte]}
                              parte={`${t(`faltantes.columnas.${parte}`)} (${t(`faltantes.idiomas.${idioma}`)})`}
                            />
                          )),
                        )}
                        <Casilla estado={cuadro.foto} parte={t('faltantes.columnas.foto')} />
                        <Casilla estado={cuadro.fuentes} parte={t('faltantes.columnas.fuentes')} />
                      </tr>
                      {abiertoAqui && (
                        <tr className="cuadro__detalle">
                          <td colSpan={columnas}>
                            <DetallePunto cuadro={cuadro} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="cuadro__descargas">
            <p className="gestor__texto texto-small">{t('faltantes.descargaAyuda')}</p>
            <div className="gestor__pestanas">
              <Boton
                tamano="sm"
                icono={Download}
                onClick={() =>
                  descargar(`faltantes-${fecha}.csv`, aCsv(filas), 'text/csv;charset=utf-8')
                }
              >
                {t('faltantes.csv')}
              </Boton>
              <Boton
                tamano="sm"
                variante="secundario"
                icono={Download}
                onClick={() =>
                  descargar(
                    `faltantes-${fecha}.md`,
                    aMarkdown(filas, fecha),
                    'text/markdown;charset=utf-8',
                  )
                }
              >
                {t('faltantes.markdown')}
              </Boton>
            </div>
            <p className="gestor__aviso texto-small">{t('faltantes.envio')}</p>
          </div>
        </>
      )}
    </section>
  )
}

/** Lo que le falta a un punto, de lo más urgente a lo menos, en una línea por cosa. */
function DetallePunto({ cuadro }: { cuadro: CuadroPunto }) {
  const { t } = useTranslation('gestor')
  const orden: Record<Gravedad, number> = { obligatorio: 0, recomendado: 1, revision: 2 }
  const filas = [...cuadro.filas].sort((a, b) => orden[a.gravedad] - orden[b.gravedad])
  if (filas.length === 0) {
    return <p className="gestor__texto texto-body">{t('faltantes.nadaQueHacer')}</p>
  }
  return (
    <ul className="cuadro__faltantes">
      {filas.map((fila, i) => (
        <li key={i} className="cuadro__faltante">
          <Insignia tono={TONO[fila.gravedad]}>{t(`faltantes.gravedad.${fila.gravedad}`)}</Insignia>
          <span className="texto-body">
            <strong>
              {t('faltantes.campo', {
                campo: fila.campo,
                idioma: t(`faltantes.idiomas.${fila.idioma}`),
              })}
            </strong>
            {' · '}
            {fila.problema}
            {' · '}
            <span className="gestor__texto">{fila.accion}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}
