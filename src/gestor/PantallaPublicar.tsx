import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Send } from 'lucide-react'
import { BarraSuperior } from '@/componentes/BarraSuperior'
import { Boton } from '@/componentes/Boton'
import { Insignia, type TonoInsignia } from '@/componentes/Insignia'
import {
  confirmarPublicacion,
  leerDesplegada,
  listarPublicaciones,
  marcarPublicacionFallida,
  solicitarPublicacion,
  type EstadoPublicacion,
  type Publicacion,
} from '@/datos/publicacion'
import type { Rol } from '@/datos/sesion'
import { comprobarDespliegue, INTERVALO_MS } from '@/gestor/publicacion'

const FORMATO_FECHA = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' })

const TONO: Record<EstadoPublicacion, TonoInsignia> = {
  generando: 'info',
  desplegando: 'advertencia',
  publicada: 'exito',
  fallida: 'error',
}

/** En qué va la publicación que se pidió desde esta pantalla. */
type Fase =
  | { tipo: 'inactiva' }
  | { tipo: 'generando' }
  | { tipo: 'desplegando'; publicacion: Publicacion; desde: number }
  | { tipo: 'publicada'; publicacion: Publicacion }
  | { tipo: 'fallida'; mensaje: string; detalle?: string[] }

/**
 * «Publicar» (/gestor/publicar, solo admin): genera la instantánea de lo aprobado, la despliega en
 * Vercel y solo anuncia el éxito cuando el sitio ya sirve ese JSON exacto. El servidor vuelve a
 * comprobar el rol: esta pantalla oculta el botón, pero no es la protección.
 */
export function PantallaPublicar({ rol }: { rol: Rol }) {
  const { t } = useTranslation('gestor')
  const navegar = useNavigate()
  const barra = (
    <BarraSuperior
      etiqueta={t('textos.volver')}
      etiquetaAccesible={t('textos.volver')}
      onVolver={() => navegar('/gestor')}
    />
  )

  if (rol !== 'admin') {
    return (
      <section className="gestor__seccion">
        {barra}
        <div className="gestor__titulos">
          <h1 className="gestor__titulo texto-title-1">{t('publicar.sinPermisoTitulo')}</h1>
          <p className="gestor__texto texto-body">{t('publicar.sinPermisoTexto')}</p>
        </div>
      </section>
    )
  }
  return <Publicar barra={barra} />
}

function Publicar({ barra }: { barra: ReactNode }) {
  const { t } = useTranslation('gestor')
  const [historial, setHistorial] = useState<Publicacion[] | 'error' | null>(null)
  const [fase, setFase] = useState<Fase>({ tipo: 'inactiva' })

  const recargar = useCallback(() => {
    listarPublicaciones()
      .then((lista) => {
        setHistorial(lista)
        // Si al abrir hay una desplegándose (p. ej. se recargó la página), se sigue comprobando.
        const enCurso = lista.find((p) => p.estado === 'desplegando')
        if (enCurso && enCurso.sha256) {
          setFase((actual) =>
            actual.tipo === 'inactiva'
              ? {
                  tipo: 'desplegando',
                  publicacion: enCurso,
                  desde: new Date(enCurso.creadoEn).getTime(),
                }
              : actual,
          )
        }
      })
      .catch(() => setHistorial('error'))
  }, [])

  useEffect(recargar, [recargar])

  // Mientras se despliega: consultar el sitio hasta ver la huella exacta, o vencer.
  useEffect(() => {
    if (fase.tipo !== 'desplegando') return
    let vigente = true
    const { publicacion, desde } = fase
    const revisar = async () => {
      try {
        const desplegada = await leerDesplegada()
        const resultado = comprobarDespliegue(
          desplegada,
          { version: publicacion.version, sha256: publicacion.sha256 ?? '' },
          Date.now() - desde,
        )
        if (!vigente || resultado === 'esperando') return
        if (resultado === 'publicada') {
          const confirmada = await confirmarPublicacion(publicacion.id)
          if (vigente) setFase({ tipo: 'publicada', publicacion: confirmada })
        } else {
          const motivo = t('publicar.vencida')
          await marcarPublicacionFallida(publicacion.id, motivo).catch(() => {})
          if (vigente) setFase({ tipo: 'fallida', mensaje: motivo })
        }
        recargar()
      } catch {
        // Un fallo de red al comprobar no decide nada: se vuelve a intentar.
      }
    }
    void revisar()
    const intervalo = window.setInterval(() => void revisar(), INTERVALO_MS)
    return () => {
      vigente = false
      window.clearInterval(intervalo)
    }
  }, [fase, recargar, t])

  async function publicar() {
    setFase({ tipo: 'generando' })
    const resultado = await solicitarPublicacion()
    if (!resultado.ok) {
      setFase({ tipo: 'fallida', mensaje: resultado.mensaje, detalle: resultado.detalle })
      recargar()
      return
    }
    setFase({
      tipo: 'desplegando',
      desde: Date.now(),
      publicacion: {
        id: resultado.id,
        version: resultado.version,
        estado: 'desplegando',
        sha256: resultado.sha256,
        resumen: resultado.resumen,
        error: null,
        creadoEn: new Date().toISOString(),
        desplegadoEn: null,
      },
    })
    recargar()
  }

  const ocupado = fase.tipo === 'generando' || fase.tipo === 'desplegando'
  const ultimaPublicada = Array.isArray(historial)
    ? historial.find((p) => p.estado === 'publicada')
    : undefined

  return (
    <section className="gestor__seccion">
      {barra}
      <div className="gestor__titulos">
        <h1 className="gestor__titulo texto-title-1">{t('publicar.titulo')}</h1>
        <p className="gestor__texto texto-body">{t('publicar.texto')}</p>
      </div>

      <div className="gestor__estado">
        <Boton icono={Send} cargando={ocupado} disabled={ocupado} onClick={() => void publicar()}>
          {t('publicar.boton')}
        </Boton>
        {ultimaPublicada && (
          <p className="gestor__texto texto-small">
            {t('publicar.ultima', {
              version: ultimaPublicada.version,
              fecha: FORMATO_FECHA.format(
                new Date(ultimaPublicada.desplegadoEn ?? ultimaPublicada.creadoEn),
              ),
            })}
          </p>
        )}

        {fase.tipo === 'generando' && (
          <p className="gestor__texto texto-body" role="status">
            {t('publicar.generando')}
          </p>
        )}
        {fase.tipo === 'desplegando' && (
          <p className="gestor__texto texto-body" role="status">
            {t('publicar.desplegando', { version: fase.publicacion.version })}
          </p>
        )}
        {fase.tipo === 'publicada' && (
          <p className="gestor__texto texto-body-strong" role="status">
            {t('publicar.publicada', {
              version: fase.publicacion.version,
              fichas: fase.publicacion.resumen.fichas ?? 0,
              audios: fase.publicacion.resumen.audios ?? 0,
            })}
          </p>
        )}
        {fase.tipo === 'fallida' && (
          <div role="alert">
            <p className="gestor__error texto-body">
              {t('publicar.fallida', { mensaje: fase.mensaje })}
            </p>
            {fase.detalle?.map((linea) => (
              <p key={linea} className="gestor__texto texto-small">
                {linea}
              </p>
            ))}
            <p className="gestor__texto texto-small">{t('publicar.seConserva')}</p>
          </div>
        )}
      </div>

      <section className="gestor__grupo" aria-labelledby="historial-publicaciones">
        <h2 id="historial-publicaciones" className="gestor__subtitulo texto-heading">
          {t('publicar.historial')}
        </h2>
        {historial === null && (
          <p className="gestor__texto texto-body" role="status">
            {t('comun.cargando')}
          </p>
        )}
        {historial === 'error' && (
          <p className="gestor__error texto-body" role="alert">
            {t('publicar.errorHistorial')}
          </p>
        )}
        {Array.isArray(historial) && historial.length === 0 && (
          <p className="gestor__texto texto-body">{t('publicar.sinHistorial')}</p>
        )}
        {Array.isArray(historial) && historial.length > 0 && (
          <ul className="gestor__fuentes">
            {historial.map((p) => (
              <li key={p.id} className="gestor__tarjeta-fuente">
                <div className="gestor__tarjeta-fuente-datos">
                  <p className="gestor__texto texto-body-strong">
                    {t('publicar.version', { version: p.version })}
                  </p>
                  <p className="gestor__texto texto-small">
                    {p.resumen.fichas === undefined
                      ? FORMATO_FECHA.format(new Date(p.creadoEn))
                      : t('publicar.lineaHistorial', {
                          fecha: FORMATO_FECHA.format(new Date(p.creadoEn)),
                          fichas: p.resumen.fichas,
                          audios: p.resumen.audios ?? 0,
                          fotos: p.resumen.fotos ?? 0,
                        })}
                  </p>
                  {p.error && <p className="gestor__texto texto-small">{p.error}</p>}
                </div>
                <Insignia tono={TONO[p.estado]}>{t(`publicar.estados.${p.estado}`)}</Insignia>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  )
}
