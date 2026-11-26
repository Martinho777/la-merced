import { useContext, useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, CircleCheck, CircleDashed, Save } from 'lucide-react'
import { BarraSuperior } from '@/componentes/BarraSuperior'
import { Boton } from '@/componentes/Boton'
import { Insignia } from '@/componentes/Insignia'
import {
  cambiarEstadoFicha,
  guardarFicha,
  IDIOMAS_GESTOR,
  obtenerPuntoGestor,
  type CamposFicha,
  type DetallePunto,
} from '@/datos/gestor'
import { Campo, CampoArea } from '@/gestor/componentes/Campo'
import type { Rol } from '@/datos/sesion'
import {
  CAMPOS_NARRACION,
  CAMPOS_TEXTOS,
  camposDe,
  camposParaGuardar,
  hayCambios,
  type IdiomaGestor,
} from '@/gestor/editor'
import { AudioFicha } from '@/gestor/AudioFicha'
import { FotosPunto } from '@/gestor/FotosPunto'
import { FuentesPunto } from '@/gestor/FuentesPunto'
import { accionesDisponibles, DESTINO, type AccionEstado } from '@/gestor/estados'
import { RUTA_SECCION } from '@/gestor/secciones'
import { marcarCambiosSinPublicar } from '@/gestor/publicacionPendiente'
import { BarraAvance } from '@/gestor/BarraAvance'
import { FijarEncabezado } from '@/gestor/contexto'
import { PasosEditor } from '@/gestor/PasosEditor'
import {
  avanceDe,
  conBorradores,
  estadoDePaso,
  PASOS,
  pasoDe,
  requisitosDeIdioma,
  type EstadoPaso,
  type Paso,
  type ResumenMedios,
} from '@/gestor/pasos'
import { TONO_ESTADO } from '@/gestor/lista'
import type es from '@/i18n/es.json'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'noExiste' }
  | { tipo: 'listo'; punto: DetallePunto }

type Aviso =
  | 'guardado'
  | 'errorGuardar'
  | 'faltaTitulo'
  | 'sinCambios'
  | 'estadoCambiado'
  | 'errorEstado'
  | 'guardaPrimero'
  | null

type AvisoTranscripcion = 'guardada' | 'error' | 'sinCambios' | null

const FORMATO_FECHA = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' })

type ClaveZona = `zonas.${keyof typeof es.zonas}`

/** Ficha de un punto: se elige el idioma y se editan sus campos. */
export function EditorPunto({ rol }: { rol: Rol }) {
  const { t } = useTranslation('gestor')
  const { t: tGuia } = useTranslation()
  const navegar = useNavigate()
  const { idPunto = '' } = useParams()
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [idioma, setIdioma] = useState<IdiomaGestor>('es')
  // Un borrador por idioma: cambiar de pestaña no pierde lo escrito.
  const [borradores, setBorradores] = useState<Record<IdiomaGestor, CamposFicha> | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState<AccionEstado | null>(null)
  const [aviso, setAviso] = useState<Aviso>(null)
  const [avisoTranscripcion, setAvisoTranscripcion] = useState<AvisoTranscripcion>(null)
  const [guardandoTranscripcion, setGuardandoTranscripcion] = useState(false)
  const [parametros, setParametros] = useSearchParams()
  const paso = pasoDe(parametros.get('paso'))
  // Fotos y fuentes se cargan en sus pasos y avisan cuántas hay, para el estado de cada paso.
  const [medios, setMedios] = useState<ResumenMedios>({ fotos: null, fuentes: null })

  // El título del punto va en el encabezado del gestor, en la fila de "Gestor de fichas".
  const fijarEncabezado = useContext(FijarEncabezado)
  const listo = estado.tipo === 'listo' ? estado.punto : null
  useEffect(() => {
    if (!listo) return
    fijarEncabezado({
      titulo: t('editor.titulo', { numero: listo.orden }),
      detalle: t('editor.zona', {
        zona: tGuia(`zonas.${listo.zona}` as ClaveZona, { defaultValue: listo.zona }),
      }),
    })
    return () => fijarEncabezado(null)
    // Solo cambia con el punto y su zona.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo?.orden, listo?.zona, fijarEncabezado])

  useEffect(() => {
    let vigente = true
    obtenerPuntoGestor(idPunto)
      .then((punto) => {
        if (!vigente) return
        if (!punto) {
          setEstado({ tipo: 'noExiste' })
          return
        }
        setEstado({ tipo: 'listo', punto })
        setBorradores({
          es: camposDe(punto.fichas.es),
          en: camposDe(punto.fichas.en),
          cak: camposDe(punto.fichas.cak),
        })
      })
      .catch(() => vigente && setEstado({ tipo: 'error' }))
    return () => {
      vigente = false
    }
  }, [idPunto])

  const barra = (
    <BarraSuperior
      etiqueta={t('editor.volver')}
      etiquetaAccesible={t('editor.volverAccesible')}
      onVolver={() => navegar(RUTA_SECCION.fichas)}
    />
  )

  if (estado.tipo !== 'listo' || !borradores) {
    return (
      <section className="gestor__seccion">
        {barra}
        {estado.tipo === 'cargando' && (
          <p className="gestor__texto texto-body" role="status">
            {t('comun.cargando')}
          </p>
        )}
        {estado.tipo === 'error' && (
          <p className="gestor__error texto-body" role="alert">
            {t('editor.error')}
          </p>
        )}
        {estado.tipo === 'noExiste' && (
          <p className="gestor__texto texto-body">{t('editor.noExiste')}</p>
        )}
      </section>
    )
  }

  const { punto } = estado
  const ficha = punto.fichas[idioma]
  const campos = borradores[idioma]
  const nombreIdioma = t(`idiomas.${idioma}`)

  function cambiar(campo: keyof CamposFicha, valor: string) {
    setAviso(null)
    setAvisoTranscripcion(null)
    setBorradores(
      (actuales) => actuales && { ...actuales, [idioma]: { ...actuales[idioma], [campo]: valor } },
    )
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!campos.titulo.trim()) {
      setAviso('faltaTitulo')
      return
    }
    if (!hayCambios(campos, ficha, CAMPOS_TEXTOS)) {
      setAviso('sinCambios')
      return
    }
    setGuardando(true)
    try {
      const guardada = await guardarFicha(
        punto.id,
        idioma,
        camposParaGuardar(campos, ficha, CAMPOS_TEXTOS),
        ficha,
      )
      setEstado({
        tipo: 'listo',
        punto: { ...punto, fichas: { ...punto.fichas, [idioma]: guardada } },
      })
      // Solo los campos de este paso: lo escrito en la transcripción sin guardar se conserva.
      setBorradores(
        (actuales) =>
          actuales && {
            ...actuales,
            [idioma]: { ...camposDe(guardada), transcripcion: actuales[idioma].transcripcion },
          },
      )
      setAviso('guardado')
      marcarCambiosSinPublicar()
    } catch {
      setAviso('errorGuardar')
    } finally {
      setGuardando(false)
    }
  }

  async function guardarTranscripcion(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!ficha) return
    if (!hayCambios(campos, ficha, CAMPOS_NARRACION)) {
      setAvisoTranscripcion('sinCambios')
      return
    }
    setGuardandoTranscripcion(true)
    try {
      const guardada = await guardarFicha(
        punto.id,
        idioma,
        camposParaGuardar(campos, ficha, CAMPOS_NARRACION),
        ficha,
      )
      setEstado({
        tipo: 'listo',
        punto: { ...punto, fichas: { ...punto.fichas, [idioma]: guardada } },
      })
      setBorradores(
        (actuales) =>
          actuales && {
            ...actuales,
            [idioma]: { ...actuales[idioma], transcripcion: guardada.transcripcion },
          },
      )
      setAvisoTranscripcion('guardada')
      marcarCambiosSinPublicar()
    } catch {
      setAvisoTranscripcion('error')
    } finally {
      setGuardandoTranscripcion(false)
    }
  }

  async function aplicar(accion: AccionEstado) {
    if (!ficha) return
    if (hayCambios(campos, ficha)) {
      setAviso('guardaPrimero')
      return
    }
    setCambiandoEstado(accion)
    try {
      const actualizada = await cambiarEstadoFicha(ficha.id, DESTINO[accion])
      marcarCambiosSinPublicar()
      setEstado({
        tipo: 'listo',
        punto: { ...punto, fichas: { ...punto.fichas, [idioma]: actualizada } },
      })
      setAviso('estadoCambiado')
    } catch {
      setAviso('errorEstado')
    } finally {
      setCambiandoEstado(null)
    }
  }

  const acciones = ficha ? accionesDisponibles(rol, ficha.estado) : []
  const esError = aviso === 'errorGuardar' || aviso === 'errorEstado'
  const sinGuardar = hayCambios(campos, ficha, CAMPOS_TEXTOS)
  const transcripcionSinGuardar = hayCambios(campos, ficha, CAMPOS_NARRACION)
  const avance = avanceDe(conBorradores(punto, borradores), medios)
  const nombrePunto = punto.fichas.es?.titulo
    ? t('editor.nombrePunto', { numero: punto.orden, nombre: punto.fichas.es.titulo })
    : t('editor.titulo', { numero: punto.orden })
  const indice = PASOS.indexOf(paso)
  const estados = Object.fromEntries(
    PASOS.map((p) => [p, estadoDePaso(p, punto, medios)]),
  ) as Record<Paso, EstadoPaso>
  const irA = (destino: Paso) => {
    setParametros((actuales) => {
      const nuevos = new URLSearchParams(actuales)
      nuevos.set('paso', destino)
      return nuevos
    })
    window.scrollTo({ top: 0 })
  }
  const avisoEstado =
    aviso === 'estadoCambiado' || aviso === 'errorEstado' || aviso === 'guardaPrimero'

  const pestanasIdioma = (
    <div className="gestor__pestanas" role="group" aria-label={t('editor.idioma')}>
      {IDIOMAS_GESTOR.map((codigo) => (
        <Boton
          key={codigo}
          tamano="sm"
          variante={codigo === idioma ? 'primario' : 'secundario'}
          aria-pressed={codigo === idioma}
          onClick={() => {
            setIdioma(codigo)
            setAviso(null)
            setAvisoTranscripcion(null)
          }}
        >
          {t('editor.pestana', {
            idioma: t(`idiomas.${codigo}`),
            estado: t(`estados.${punto.fichas[codigo]?.estado ?? 'falta'}`),
          })}
        </Boton>
      ))}
    </div>
  )

  return (
    <section className="gestor__seccion">
      <BarraAvance hechos={avance.hechos} total={avance.total} />
      {/* Volver y los pasos en una sola fila. */}
      <div className="gestor__barra-pasos">
        {barra}
        <PasosEditor
          actual={paso}
          estados={estados}
          sinGuardar={sinGuardar ? 'textos' : transcripcionSinGuardar ? 'narracion' : null}
          alElegir={irA}
        />
      </div>
      {/* Todos los pasos quedan montados (ocultos los que no se ven): cambiar de paso no pierde lo
          escrito sin guardar. */}
      <div className="gestor__paso" hidden={paso !== 'textos'}>
        <EncabezadoPaso paso="textos" />
        {pestanasIdioma}
        {!ficha && (
          <p className="gestor__aviso texto-small">
            {t('editor.sinFicha', { idioma: nombreIdioma.toLowerCase() })}
          </p>
        )}
        {ficha?.estado === 'aprobado' && (
          <p className="gestor__aviso texto-small">{t('editor.publicada')}</p>
        )}
        {idioma === 'cak' && (
          <p className="gestor__aviso texto-small">{t('editor.revisionKaqchikel')}</p>
        )}

        <form className="gestor__formulario" onSubmit={guardar} noValidate lang={idioma}>
          <Campo
            etiqueta={t('editor.campos.titulo')}
            ayuda={t('editor.campos.tituloAyuda')}
            requisito="obligatorio"
            value={campos.titulo}
            error={aviso === 'faltaTitulo' ? t('editor.faltaTitulo') : undefined}
            onChange={(e) => cambiar('titulo', e.target.value)}
          />
          <CampoArea
            etiqueta={t('editor.campos.queVes')}
            ayuda={t('editor.campos.queVesAyuda')}
            requisito="obligatorio"
            value={campos.que_ves}
            onChange={(e) => cambiar('que_ves', e.target.value)}
          />
          <CampoArea
            etiqueta={t('editor.campos.historia')}
            ayuda={t('editor.campos.historiaAyuda')}
            requisito="obligatorio"
            rows={8}
            value={campos.historia}
            onChange={(e) => cambiar('historia', e.target.value)}
          />
          <CampoArea
            etiqueta={t('editor.campos.datoSanti')}
            ayuda={t('editor.campos.datoSantiAyuda')}
            requisito="opcional"
            value={campos.dato_santi}
            onChange={(e) => cambiar('dato_santi', e.target.value)}
          />

          {aviso && aviso !== 'faltaTitulo' && !avisoEstado && (
            <p
              className={esError ? 'gestor__error texto-body' : 'gestor__texto texto-body'}
              role={esError ? 'alert' : 'status'}
            >
              {t(`editor.${aviso}`, { estado: t(`estados.${ficha?.estado ?? 'falta'}`) })}
            </p>
          )}
          {sinGuardar && !aviso && (
            <p className="gestor__aviso texto-small-strong">{t('editor.sinGuardar')}</p>
          )}

          <Boton type="submit" icono={Save} cargando={guardando}>
            {t('editor.guardar')}
          </Boton>
        </form>
      </div>

      <div className="gestor__paso" hidden={paso !== 'narracion'}>
        <EncabezadoPaso paso="narracion" />
        {pestanasIdioma}
        <AudioFicha
          punto={punto}
          idioma={idioma}
          ficha={ficha}
          alCambiarFicha={(actualizada) =>
            setEstado({
              tipo: 'listo',
              punto: { ...punto, fichas: { ...punto.fichas, [idioma]: actualizada } },
            })
          }
        />
        {ficha && (
          <form
            className="gestor__formulario"
            onSubmit={(e) => void guardarTranscripcion(e)}
            noValidate
            lang={idioma}
          >
            <CampoArea
              etiqueta={t('editor.campos.transcripcion', { idioma: nombreIdioma.toLowerCase() })}
              ayuda={t('editor.campos.transcripcionAyuda')}
              requisito="opcional"
              rows={8}
              value={campos.transcripcion}
              onChange={(e) => cambiar('transcripcion', e.target.value)}
            />
            {ficha.audio && !campos.transcripcion.trim() && (
              <p className="gestor__aviso texto-small">{t('editor.audioSinTranscripcion')}</p>
            )}
            {!ficha.audio && campos.transcripcion.trim() && (
              <p className="gestor__aviso texto-small">{t('editor.transcripcionSinAudio')}</p>
            )}
            {avisoTranscripcion && (
              <p
                className={
                  avisoTranscripcion === 'error'
                    ? 'gestor__error texto-body'
                    : 'gestor__texto texto-body'
                }
                role={avisoTranscripcion === 'error' ? 'alert' : 'status'}
              >
                {t(`editor.transcripcion.${avisoTranscripcion}`)}
              </p>
            )}
            {transcripcionSinGuardar && !avisoTranscripcion && (
              <p className="gestor__aviso texto-small-strong">{t('editor.sinGuardar')}</p>
            )}
            <Boton type="submit" icono={Save} cargando={guardandoTranscripcion}>
              {t('editor.transcripcion.guardar')}
            </Boton>
          </form>
        )}
      </div>

      <div className="gestor__paso" hidden={paso !== 'fotos'}>
        <EncabezadoPaso paso="fotos" />
        <FotosPunto
          punto={punto}
          alResumir={(fotos) => setMedios((actuales) => ({ ...actuales, fotos }))}
        />
      </div>

      <div className="gestor__paso" hidden={paso !== 'fuentes'}>
        <EncabezadoPaso paso="fuentes" />
        <FuentesPunto
          idPunto={punto.id}
          nombrePunto={nombrePunto}
          alResumir={(fuentes) => setMedios((actuales) => ({ ...actuales, fuentes }))}
        />
      </div>

      <div className="gestor__paso" hidden={paso !== 'revision'}>
        <EncabezadoPaso paso="revision" />
        {pestanasIdioma}
        {[false, true].map((comun) => (
          <section key={String(comun)} className="gestor__grupo">
            <h3 className="gestor__subtitulo texto-heading">
              {comun
                ? t('requisitos.comunes')
                : t('requisitos.delIdioma', { idioma: nombreIdioma.toLowerCase() })}
            </h3>
            <ul className="gestor__requisitos">
              {requisitosDeIdioma(punto, medios, idioma)
                .filter((requisito) => requisito.comun === comun)
                .map((requisito) => {
                  const tipo = requisito.cumplido
                    ? 'listo'
                    : requisito.obligatorio
                      ? 'falta'
                      : 'opcional'
                  return (
                    <li
                      key={requisito.clave}
                      className={`gestor__requisito gestor__requisito--${tipo}`}
                    >
                      {requisito.cumplido ? (
                        <CircleCheck className="gestor__requisito-icono" aria-hidden="true" />
                      ) : (
                        <CircleDashed className="gestor__requisito-icono" aria-hidden="true" />
                      )}
                      <span className="gestor__requisito-texto">
                        <span className="texto-body">
                          {t(`requisitos.idioma.${requisito.clave}`)}
                        </span>
                        <span className="gestor__requisito-estado texto-small-strong">
                          {t(`requisitos.${tipo}`)}
                        </span>
                      </span>
                      {!requisito.cumplido && (
                        <Boton variante="fantasma" tamano="sm" onClick={() => irA(requisito.paso)}>
                          {t('requisitos.ir', { paso: t(`pasos.${requisito.paso}.nombre`) })}
                        </Boton>
                      )}
                    </li>
                  )
                })}
            </ul>
          </section>
        ))}

        <div className="gestor__estado">
          <h3 className="gestor__subtitulo texto-heading">
            {t('editor.publicarIdioma', { idioma: nombreIdioma.toLowerCase() })}
          </h3>
          <Insignia tono={TONO_ESTADO[ficha?.estado ?? 'falta']}>
            {t('editor.estado', { estado: t(`estados.${ficha?.estado ?? 'falta'}`) })}
          </Insignia>
          {!ficha && (
            <p className="gestor__texto texto-small">
              {t('editor.sinFicha', { idioma: nombreIdioma.toLowerCase() })}
            </p>
          )}
          {ficha?.estado === 'revision' && acciones.length === 0 && (
            <p className="gestor__texto texto-small">{t('editor.esperandoRevision')}</p>
          )}
          {ficha?.revision && (
            <p className="gestor__texto texto-small">
              {t('editor.revisadaPor', {
                nombre: ficha.revision.nombre ?? t('editor.revisorDesconocido'),
                fecha: FORMATO_FECHA.format(new Date(ficha.revision.fecha)),
              })}
            </p>
          )}
          {acciones.length > 0 && (
            <div className="gestor__pestanas">
              {acciones.map((accion) => (
                <Boton
                  key={accion}
                  tamano="sm"
                  variante={accion === 'devolverABorrador' ? 'secundario' : 'primario'}
                  cargando={cambiandoEstado === accion}
                  disabled={cambiandoEstado !== null && cambiandoEstado !== accion}
                  onClick={() => void aplicar(accion)}
                >
                  {t(`acciones.${accion}`)}
                </Boton>
              ))}
            </div>
          )}
          {avisoEstado && (
            <p
              className={esError ? 'gestor__error texto-body' : 'gestor__texto texto-body'}
              role={esError ? 'alert' : 'status'}
            >
              {t(`editor.${aviso}`, { estado: t(`estados.${ficha?.estado ?? 'falta'}`) })}
            </p>
          )}
        </div>
      </div>

      <nav className="gestor__navegacion-pasos" aria-label={t('pasos.navegacion')}>
        <Boton
          variante="secundario"
          icono={ArrowLeft}
          disabled={indice === 0}
          onClick={() => irA(PASOS[indice - 1] ?? paso)}
        >
          {t('pasos.anterior')}
        </Boton>
        {indice < PASOS.length - 1 && (
          <Boton icono={ArrowRight} onClick={() => irA(PASOS[indice + 1] ?? paso)}>
            {t('pasos.siguiente', { paso: t(`pasos.${PASOS[indice + 1] ?? paso}.nombre`) })}
          </Boton>
        )}
      </nav>
    </section>
  )
}

/** Título y explicación del paso actual ("Paso 2 de 5 · Narración"). */
function EncabezadoPaso({ paso }: { paso: Paso }) {
  const { t } = useTranslation('gestor')
  return (
    <div className="gestor__titulos">
      <p className="gestor__marca texto-label">
        {t('pasos.contador', { numero: PASOS.indexOf(paso) + 1, total: PASOS.length })}
      </p>
      <h2 className="gestor__subtitulo texto-title-2">{t(`pasos.${paso}.nombre`)}</h2>
      <p className="gestor__texto texto-body">{t(`pasos.${paso}.texto`)}</p>
    </div>
  )
}
