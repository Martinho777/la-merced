import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Insignia, type TonoInsignia } from '@/componentes/Insignia'
import { leerPuntosParaReporte } from '@/datos/faltantes'
import { aCsv, aMarkdown, faltantesDeTodo, type Faltante, type Gravedad } from '@/gestor/faltantes'

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; filas: Faltante[] }

const TONO: Record<Gravedad, TonoInsignia> = {
  obligatorio: 'error',
  recomendado: 'advertencia',
  revision: 'info',
}

function descargar(nombre: string, contenido: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  enlace.click()
  URL.revokeObjectURL(url)
}

/**
 * Reporte de faltantes (/gestor/faltantes): qué le falta a cada ficha, por idioma, para pedírselo a la
 * URL. Se descarga en CSV (hoja de cálculo) o Markdown (para pegar en un correo o documento).
 */
export function PantallaFaltantes() {
  const { t } = useTranslation('gestor')
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    leerPuntosParaReporte()
      .then((puntos) => vigente && setEstado({ tipo: 'listo', filas: faltantesDeTodo(puntos) }))
      .catch(() => vigente && setEstado({ tipo: 'error' }))
    return () => {
      vigente = false
    }
  }, [intento])

  const grupos = useMemo(() => {
    if (estado.tipo !== 'listo') return []
    const porFicha = new Map<string, Faltante[]>()
    for (const fila of estado.filas) {
      const clave = t('faltantes.ficha', { numero: fila.numero, titulo: fila.titulo })
      porFicha.set(clave, [...(porFicha.get(clave) ?? []), fila])
    }
    return [...porFicha.entries()]
  }, [estado, t])

  const fecha = new Date().toISOString().slice(0, 10)

  return (
    <section className="gestor__seccion">
      <div className="gestor__titulos">
        <h1 className="gestor__titulo texto-title-1">{t('faltantes.titulo')}</h1>
        <p className="gestor__texto texto-body">{t('faltantes.texto')}</p>
      </div>

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
          <div className="gestor__pestanas">
            <Boton
              tamano="sm"
              icono={Download}
              onClick={() =>
                descargar(`faltantes-${fecha}.csv`, aCsv(estado.filas), 'text/csv;charset=utf-8')
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
                  aMarkdown(estado.filas, fecha),
                  'text/markdown;charset=utf-8',
                )
              }
            >
              {t('faltantes.markdown')}
            </Boton>
          </div>
          <p className="gestor__texto texto-small">
            {t('faltantes.resumen', { count: estado.filas.length, fichas: grupos.length })}
          </p>
          <p className="gestor__aviso texto-small">{t('faltantes.envio')}</p>

          {grupos.map(([ficha, filas]) => (
            <section key={ficha} className="gestor__grupo">
              <h2 className="gestor__subtitulo texto-heading">{ficha}</h2>
              <ul className="gestor__fuentes">
                {filas.map((fila, i) => (
                  <li key={i} className="gestor__tarjeta-fuente">
                    <div className="gestor__tarjeta-fuente-datos">
                      <p className="gestor__texto texto-body-strong">
                        {t('faltantes.campo', {
                          campo: fila.campo,
                          idioma: t(`faltantes.idiomas.${fila.idioma}`),
                        })}
                      </p>
                      <p className="gestor__texto texto-small">{fila.problema}</p>
                      <p className="gestor__texto texto-small">
                        {t('faltantes.accion', { accion: fila.accion })}
                      </p>
                    </div>
                    <Insignia tono={TONO[fila.gravedad]}>
                      {t(`faltantes.gravedad.${fila.gravedad}`)}
                    </Insignia>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </section>
  )
}
