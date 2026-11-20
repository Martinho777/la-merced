// Editor de textos de las pantallas (/gestor/textos), solo para admin. Muestra la pantalla real del
// visitante en un iframe (src/i18n/vistaPrevia.ts) y, al lado, sus textos editables en el idioma
// elegido. Lo que se escribe aparece al instante en la vista previa; al guardar, va a textos_interfaz.

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlocker, useNavigate, useSearchParams } from 'react-router'
import { BarraSuperior } from '@/componentes/BarraSuperior'
import { Boton } from '@/componentes/Boton'
import { Insignia, type TonoInsignia } from '@/componentes/Insignia'
import { listarPuntosGestor } from '@/datos/gestor'
import type { Rol } from '@/datos/sesion'
import { guardarTextoInterfaz, leerTextosInterfaz, restaurarTextoInterfaz } from '@/datos/textos'
import { Campo } from '@/gestor/componentes/Campo'
import {
  cambiosDe,
  conTexto,
  estaCambiado,
  origenDe,
  pantallaDe,
  PANTALLAS_EDITABLES,
  problemaDe,
  textoOriginal,
  textosDeLaBase,
  textosParaVistaPrevia,
  valorCampo,
  type ClaveEditable,
  type Origen,
  type PantallaEditable,
  type Textos,
} from '@/gestor/textos'
import {
  PARAM_VISTA_PREVIA,
  type AvisoVistaPrevia,
  type MensajeVistaPrevia,
} from '@/i18n/vistaPrevia'
import { IDIOMAS, type Idioma } from '@/lib/preferencias'
import '@/gestor/textos.css'

/** Punto que se muestra en la confirmación si la base todavía no tiene puntos (los de prueba). */
const PUNTO_DE_PRUEBA = { zona: 'fachada-principal', punto: 'demo-01' }

const TONO_ORIGEN: Record<Origen, TonoInsignia> = {
  original: 'neutral',
  editado: 'info',
  sinTraduccion: 'advertencia',
}

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'listo'; base: Textos; confirmacion: { zona: string; punto: string } }

type Aviso = { tipo: 'exito' | 'error'; texto: string } | null

export function EditorTextos({ rol }: { rol: Rol }) {
  const { t } = useTranslation('gestor')
  const navegar = useNavigate()

  if (rol !== 'admin') {
    return (
      <section className="gestor__seccion">
        <BarraSuperior
          etiqueta={t('textos.volver')}
          etiquetaAccesible={t('textos.volver')}
          onVolver={() => navegar('/gestor')}
        />
        <div className="gestor__titulos">
          <h1 className="gestor__titulo texto-title-1">{t('textos.sinPermisoTitulo')}</h1>
          <p className="gestor__texto texto-body">{t('textos.sinPermisoTexto')}</p>
        </div>
      </section>
    )
  }
  return <Editor />
}

/** Dirección de la pantalla en modo vista previa. */
function direccionDe(pantalla: PantallaEditable, confirmacion: { zona: string; punto: string }) {
  const parametros = new URLSearchParams({ [PARAM_VISTA_PREVIA]: '' })
  if (pantalla.id === 'confirmacion') {
    parametros.set('zona', confirmacion.zona)
    parametros.set('punto', confirmacion.punto)
  }
  return `${pantalla.ruta}?${parametros.toString()}`
}

function Editor() {
  const { t } = useTranslation('gestor')
  const navegar = useNavigate()
  const [parametros, setParametros] = useSearchParams()
  const pantalla = pantallaDe(parametros.get('pantalla'))
  const idioma: Idioma = IDIOMAS.find((i) => i === parametros.get('idioma')) ?? 'es'

  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)
  const [borradores, setBorradores] = useState<Textos>({})
  const [enfocada, setEnfocada] = useState<ClaveEditable | null>(null)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<Aviso>(null)

  useEffect(() => {
    let vigente = true
    // Sin puntos (o si fallan) la confirmación usa uno de prueba: los textos se cargan igual.
    const primerPunto = listarPuntosGestor()
      .then((puntos) => {
        const punto = puntos[0]
        return punto ? { zona: punto.zona.slug, punto: punto.slug } : PUNTO_DE_PRUEBA
      })
      .catch(() => PUNTO_DE_PRUEBA)
    Promise.all([leerTextosInterfaz(), primerPunto])
      .then(([filas, confirmacion]) => {
        if (vigente) setEstado({ tipo: 'listo', base: textosDeLaBase(filas), confirmacion })
      })
      .catch(() => vigente && setEstado({ tipo: 'error' }))
    return () => {
      vigente = false
    }
  }, [intento])

  // Cambios sin guardar en cualquier idioma: se pregunta antes de salir del editor.
  const base = estado.tipo === 'listo' ? estado.base : {}
  const pendientes = IDIOMAS.reduce(
    (total, i) =>
      total +
      PANTALLAS_EDITABLES.reduce(
        (suma, p) => suma + cambiosDe(base, borradores, i, p.claves).length,
        0,
      ),
    0,
  )
  const bloqueo = useBlocker(
    ({ currentLocation, nextLocation }) =>
      pendientes > 0 && currentLocation.pathname !== nextLocation.pathname,
  )
  useEffect(() => {
    if (bloqueo.state !== 'blocked') return
    if (window.confirm(t('textos.confirmarSalir'))) bloqueo.proceed()
    else bloqueo.reset()
  }, [bloqueo, t])
  useEffect(() => {
    if (pendientes === 0) return
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', avisar)
    return () => window.removeEventListener('beforeunload', avisar)
  }, [pendientes])

  const barra = (
    <BarraSuperior
      etiqueta={t('textos.volver')}
      etiquetaAccesible={t('textos.volver')}
      onVolver={() => navegar('/gestor')}
    />
  )

  if (estado.tipo !== 'listo') {
    return (
      <section className="gestor__seccion">
        {barra}
        {estado.tipo === 'cargando' ? (
          <p className="gestor__texto texto-body" role="status">
            {t('comun.cargando')}
          </p>
        ) : (
          <div className="gestor__seccion" role="alert">
            <p className="gestor__error texto-body">{t('textos.error')}</p>
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
      </section>
    )
  }

  const cambios = cambiosDe(estado.base, borradores, idioma, pantalla.claves)
  const conProblema = cambios.some(
    (clave) => problemaDe(clave, valorCampo(estado.base, borradores, idioma, clave)) !== null,
  )

  const elegir = (cambio: { pantalla?: string; idioma?: Idioma }) => {
    setAviso(null)
    setEnfocada(null)
    setParametros(
      (actuales) => {
        const nuevos = new URLSearchParams(actuales)
        if (cambio.pantalla) nuevos.set('pantalla', cambio.pantalla)
        if (cambio.idioma) nuevos.set('idioma', cambio.idioma)
        return nuevos
      },
      { replace: true },
    )
  }

  async function guardar() {
    if (estado.tipo !== 'listo') return
    setOcupado(true)
    setAviso(null)
    let nuevaBase = estado.base
    let nuevosBorradores = borradores
    let guardados = 0
    try {
      for (const clave of cambios) {
        const texto = valorCampo(nuevaBase, nuevosBorradores, idioma, clave).trim()
        await guardarTextoInterfaz({ clave, idioma, texto })
        nuevaBase = conTexto(nuevaBase, idioma, clave, texto)
        nuevosBorradores = conTexto(nuevosBorradores, idioma, clave, undefined)
        guardados += 1
      }
      setAviso({ tipo: 'exito', texto: t('textos.guardado', { count: guardados }) })
    } catch (error) {
      setAviso({
        tipo: 'error',
        texto: t('textos.errorGuardar', { mensaje: (error as Error).message }),
      })
    } finally {
      // Lo que sí se guardó queda guardado aunque otro texto falle.
      setEstado({ ...estado, base: nuevaBase })
      setBorradores(nuevosBorradores)
      setOcupado(false)
    }
  }

  async function restaurar(clave: ClaveEditable) {
    if (estado.tipo !== 'listo') return
    setOcupado(true)
    setAviso(null)
    try {
      await restaurarTextoInterfaz(clave, idioma)
      setEstado({ ...estado, base: conTexto(estado.base, idioma, clave, undefined) })
      setBorradores((actuales) => conTexto(actuales, idioma, clave, undefined))
      setAviso({ tipo: 'exito', texto: t('textos.restaurado') })
    } catch (error) {
      setAviso({
        tipo: 'error',
        texto: t('textos.errorRestaurar', { mensaje: (error as Error).message }),
      })
    } finally {
      setOcupado(false)
    }
  }

  const nombrePantalla = t(`textos.pantalla.${pantalla.id}`)
  const nombreIdioma = t(`textos.idiomas.${idioma}`)
  const vistaPrevia = textosParaVistaPrevia(estado.base, borradores, idioma, pantalla.claves)

  return (
    <section className="gestor__seccion">
      {barra}
      <div className="gestor__titulos">
        <h1 className="gestor__titulo texto-title-1">{t('textos.titulo')}</h1>
        <p className="gestor__texto texto-body">{t('textos.texto')}</p>
      </div>

      <nav className="pasos" aria-label={t('textos.pantallas')}>
        <ol className="pasos__lista">
          {PANTALLAS_EDITABLES.map((p, i) => {
            const actual = p.id === pantalla.id
            const n = cambiosDe(estado.base, borradores, idioma, p.claves).length
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={actual ? 'pasos__paso pasos__paso--actual' : 'pasos__paso'}
                  aria-current={actual ? 'step' : undefined}
                  onClick={() => elegir({ pantalla: p.id })}
                >
                  <span className="pasos__numero texto-small-strong" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="pasos__textos">
                    <span className="pasos__nombre texto-body-strong">
                      {t(`textos.pantalla.${p.id}`)}
                    </span>
                    <span className="pasos__estado texto-small">
                      {n > 0 ? t('textos.cambios', { count: n }) : t('textos.sinCambios')}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <fieldset className="textos__idiomas">
        <legend className="texto-heading">{t('textos.idioma')}</legend>
        {IDIOMAS.map((i) => (
          <Boton
            key={i}
            type="button"
            variante={i === idioma ? 'primario' : 'secundario'}
            tamano="sm"
            aria-pressed={i === idioma}
            onClick={() => elegir({ idioma: i })}
          >
            {t(`textos.idiomas.${i}`)}
          </Boton>
        ))}
      </fieldset>

      <div className="textos__cuerpo">
        <VistaPrevia
          direccion={direccionDe(pantalla, estado.confirmacion)}
          titulo={t('textos.vistaPrevia', { pantalla: nombrePantalla })}
          mensaje={{
            tipo: 'textos',
            idioma,
            textos: vistaPrevia,
            resaltar: enfocada ? (vistaPrevia[enfocada] ?? null) : null,
          }}
        />

        <form
          className="gestor__formulario"
          aria-label={t('textos.campos', { pantalla: nombrePantalla, idioma: nombreIdioma })}
          onSubmit={(evento) => {
            evento.preventDefault()
            void guardar()
          }}
        >
          <h2 className="gestor__subtitulo texto-heading">
            {t('textos.campos', { pantalla: nombrePantalla, idioma: nombreIdioma })}
          </h2>

          {pantalla.claves.map((clave) => {
            const valor = valorCampo(estado.base, borradores, idioma, clave)
            const cambiado = estaCambiado(estado.base, borradores, idioma, clave)
            const problema = cambiado ? problemaDe(clave, valor) : null
            const origen = origenDe(estado.base, idioma, clave)
            const original = textoOriginal(idioma, clave) ?? textoOriginal('es', clave) ?? ''
            return (
              <div key={clave} className="textos__campo">
                <span className="gestor__insignias textos__insignias">
                  <Insignia tono={TONO_ORIGEN[origen]}>{t(`textos.origen.${origen}`)}</Insignia>
                  {cambiado && <Insignia tono="marca">{t('textos.sinGuardar')}</Insignia>}
                </span>
                <Campo
                  etiqueta={t(`textos.clave.${clave}`)}
                  ayuda={t('textos.original', { texto: original })}
                  error={problema ? t(`textos.problema.${problema}`) : undefined}
                  value={valor}
                  lang={idioma}
                  onChange={(evento) =>
                    setBorradores((actuales) =>
                      conTexto(actuales, idioma, clave, evento.target.value),
                    )
                  }
                  onFocus={() => setEnfocada(clave)}
                  onBlur={() => setEnfocada((actual) => (actual === clave ? null : actual))}
                />
                {origen === 'editado' && (
                  <Boton
                    type="button"
                    variante="fantasma"
                    tamano="sm"
                    className="textos__restaurar"
                    title={t('textos.restaurarAyuda')}
                    disabled={ocupado}
                    onClick={() => void restaurar(clave)}
                  >
                    {t('textos.restaurar')}
                  </Boton>
                )}
              </div>
            )
          })}

          {aviso && (
            <p
              className={
                aviso.tipo === 'error' ? 'gestor__error texto-body' : 'gestor__texto texto-body'
              }
              role={aviso.tipo === 'error' ? 'alert' : 'status'}
            >
              {aviso.texto}
            </p>
          )}

          <div className="textos__acciones">
            <Boton type="submit" disabled={ocupado || cambios.length === 0 || conProblema}>
              {t('textos.guardar')}
            </Boton>
            <Boton
              type="button"
              variante="secundario"
              disabled={ocupado || cambios.length === 0}
              onClick={() => {
                setAviso(null)
                setBorradores((actuales) =>
                  pantalla.claves.reduce(
                    (textos, clave) => conTexto(textos, idioma, clave, undefined),
                    actuales,
                  ),
                )
              }}
            >
              {t('textos.descartar')}
            </Boton>
          </div>
        </form>
      </div>
    </section>
  )
}

/**
 * La pantalla real en un iframe con forma de teléfono. Le manda `mensaje` cada vez que cambia, en
 * cuanto la app de dentro avisa que está lista. No se puede tocar: solo se mira.
 */
function VistaPrevia({
  direccion,
  titulo,
  mensaje,
}: {
  direccion: string
  titulo: string
  mensaje: MensajeVistaPrevia
}) {
  const { t } = useTranslation('gestor')
  const marco = useRef<HTMLIFrameElement>(null)
  // Dirección cuya app ya avisó que está lista; al cambiar de pantalla hay que esperar de nuevo.
  const [lista, setLista] = useState<string | null>(null)

  useEffect(() => {
    const escuchar = (evento: MessageEvent) => {
      const aviso = evento.data as Partial<AvisoVistaPrevia> | null
      if (evento.origin !== window.location.origin) return
      if (evento.source !== marco.current?.contentWindow || aviso?.tipo !== 'lista') return
      setLista(direccion)
    }
    window.addEventListener('message', escuchar)
    return () => window.removeEventListener('message', escuchar)
  }, [direccion])

  const contenido = JSON.stringify(mensaje)
  useEffect(() => {
    if (lista !== direccion) return
    marco.current?.contentWindow?.postMessage(JSON.parse(contenido), window.location.origin)
  }, [lista, direccion, contenido])

  return (
    <figure className="textos__vista-previa">
      <div className="textos__telefono">
        <iframe
          key={direccion}
          ref={marco}
          className="textos__marco"
          src={direccion}
          title={titulo}
          tabIndex={-1}
          inert
        />
      </div>
      <figcaption className="gestor__texto texto-small">{t('textos.vistaPreviaAyuda')}</figcaption>
    </figure>
  )
}
