import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ExternalLink, Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Insignia } from '@/componentes/Insignia'
import { TONO_NIVEL } from '@/componentes/nivelConfianza'
import {
  actualizarFuente,
  actualizarVinculo,
  crearFuente,
  desvincularFuente,
  listarFuentes,
  listarFuentesPunto,
  NIVELES_CONFIANZA,
  TIPOS_FUENTE,
  vincularFuente,
  type DatosFuente,
  type Fuente,
  type FuentePunto,
  type NivelConfianza,
  type TipoFuente,
} from '@/datos/fuentes'
import { Campo, CampoArea, Selector } from '@/gestor/componentes/Campo'
import { FUENTE_VACIA, fuentesDisponibles } from '@/gestor/fuentes'
import { marcarCambiosSinPublicar } from '@/gestor/publicacionPendiente'

type Aviso = 'agregada' | 'guardada' | 'quitada' | 'faltaCita' | 'faltaFuente' | 'error' | null

function Mensaje({ aviso }: { aviso: Aviso }) {
  const { t } = useTranslation('gestor')
  if (!aviso || aviso === 'faltaCita') return null
  const bueno = aviso === 'agregada' || aviso === 'guardada' || aviso === 'quitada'
  return (
    <p
      className={bueno ? 'gestor__texto texto-body' : 'gestor__error texto-body'}
      role={bueno ? 'status' : 'alert'}
    >
      {t(`fuentes.${aviso}`)}
    </p>
  )
}

/** Cita, tipo y enlace de una fuente (al crearla o corregirla). */
function CamposFuente({
  datos,
  faltaCita,
  alCambiar,
}: {
  datos: DatosFuente
  faltaCita: boolean
  alCambiar: (datos: DatosFuente) => void
}) {
  const { t } = useTranslation('gestor')
  return (
    <>
      <CampoArea
        etiqueta={t('fuentes.campos.cita')}
        ayuda={t('fuentes.campos.citaAyuda')}
        requisito="obligatorio"
        rows={2}
        error={faltaCita ? t('fuentes.faltaCita') : undefined}
        value={datos.cita}
        onChange={(e) => alCambiar({ ...datos, cita: e.target.value })}
      />
      <Selector
        etiqueta={t('fuentes.campos.tipo')}
        value={datos.tipo}
        opciones={TIPOS_FUENTE.map((tipo) => ({ valor: tipo, texto: t(`fuentes.tipos.${tipo}`) }))}
        onChange={(e) => alCambiar({ ...datos, tipo: e.target.value as TipoFuente })}
      />
      <Campo
        etiqueta={t('fuentes.campos.url')}
        requisito="opcional"
        type="url"
        value={datos.url}
        onChange={(e) => alCambiar({ ...datos, url: e.target.value })}
      />
    </>
  )
}

/**
 * Nivel de confianza como tarjetas de opción única: cada una con su insignia (la misma que ve el
 * visitante) y qué significa, para que la insignia no quede sin explicar.
 */
function SelectorNivel({
  nombre,
  nivel,
  alCambiar,
}: {
  nombre: string
  nivel: NivelConfianza
  alCambiar: (nivel: NivelConfianza) => void
}) {
  const { t } = useTranslation('gestor')
  return (
    <fieldset className="gestor__niveles">
      <legend className="campo__etiqueta texto-heading">{t('fuentes.campos.nivel')}</legend>
      <p className="campo__ayuda texto-small">{t('fuentes.campos.nivelAyuda')}</p>
      {NIVELES_CONFIANZA.map((n) => (
        <label
          key={n}
          className={n === nivel ? 'gestor__nivel gestor__nivel--elegido' : 'gestor__nivel'}
        >
          <input
            type="radio"
            name={nombre}
            value={n}
            checked={n === nivel}
            onChange={() => alCambiar(n)}
          />
          <span className="gestor__nivel-textos">
            <Insignia tono={TONO_NIVEL[n]}>{t(`fuentes.niveles.${n}`)}</Insignia>
            <span className="gestor__texto texto-small">{t(`fuentes.nivelesTexto.${n}`)}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}

function CampoNota({ nota, alCambiar }: { nota: string; alCambiar: (nota: string) => void }) {
  const { t } = useTranslation('gestor')
  return (
    <CampoArea
      etiqueta={t('fuentes.campos.nota')}
      ayuda={t('fuentes.campos.notaAyuda')}
      requisito="opcional"
      rows={2}
      value={nota}
      onChange={(e) => alCambiar(e.target.value)}
    />
  )
}

/** Una fuente del punto, compacta: cita, tipo, enlace, su nivel de confianza y lo que respalda. */
function TarjetaFuente({
  vinculo,
  editando,
  alEditar,
  alQuitar,
}: {
  vinculo: FuentePunto
  editando: boolean
  alEditar: () => void
  alQuitar: () => Promise<void>
}) {
  const { t } = useTranslation('gestor')
  const [confirmando, setConfirmando] = useState(false)
  const [quitando, setQuitando] = useState(false)
  const { fuente } = vinculo

  async function quitar() {
    setQuitando(true)
    try {
      await alQuitar()
    } catch {
      setQuitando(false)
      setConfirmando(false)
    }
  }

  return (
    <li
      className={
        editando
          ? 'gestor__tarjeta-fuente gestor__tarjeta-fuente--editando'
          : 'gestor__tarjeta-fuente'
      }
    >
      <div className="gestor__tarjeta-fuente-datos">
        <p className="gestor__marca texto-body-strong">{fuente.cita}</p>
        <p className="gestor__texto texto-small">
          {t(`fuentes.tipos.${fuente.tipo}`)}
          {fuente.url && (
            <>
              {' · '}
              <a className="gestor__enlace" href={fuente.url} target="_blank" rel="noreferrer">
                {t('fuentes.enlace')}
                <ExternalLink className="gestor__icono-linea" aria-hidden="true" />
              </a>
            </>
          )}
        </p>
        <p className="gestor__nivel-linea texto-small">
          {t('fuentes.nivelDelPunto')}
          <Insignia tono={TONO_NIVEL[vinculo.nivel]}>
            {t(`fuentes.niveles.${vinculo.nivel}`)}
          </Insignia>
        </p>
        {vinculo.nota && (
          <p className="gestor__texto texto-small">
            {t('fuentes.respalda', { nota: vinculo.nota })}
          </p>
        )}
      </div>
      <div className="gestor__tarjeta-acciones">
        {confirmando ? (
          <>
            <p className="gestor__texto texto-small-strong">{t('fuentes.preguntaQuitar')}</p>
            <Boton
              variante="fantasma"
              destructivo
              tamano="sm"
              icono={Trash2}
              cargando={quitando}
              onClick={() => void quitar()}
            >
              {t('fuentes.confirmarQuitar')}
            </Boton>
            <Boton variante="secundario" tamano="sm" onClick={() => setConfirmando(false)}>
              {t('fuentes.cancelar')}
            </Boton>
          </>
        ) : (
          <>
            <Boton
              variante="secundario"
              tamano="sm"
              icono={Pencil}
              aria-pressed={editando}
              onClick={alEditar}
            >
              {t('fuentes.editar')}
            </Boton>
            <Boton
              variante="fantasma"
              destructivo
              tamano="sm"
              icono={Trash2}
              onClick={() => setConfirmando(true)}
            >
              {t('fuentes.quitar')}
            </Boton>
          </>
        )}
      </div>
    </li>
  )
}

/** Panel para cambiar el nivel y la nota de una fuente del punto, y, si hace falta, la fuente. */
function EditarFuente({
  idPunto,
  vinculo,
  alGuardar,
  alCerrar,
}: {
  idPunto: string
  vinculo: FuentePunto
  alGuardar: (vinculo: FuentePunto) => void
  alCerrar: () => void
}) {
  const { t } = useTranslation('gestor')
  const [nivel, setNivel] = useState(vinculo.nivel)
  const [nota, setNota] = useState(vinculo.nota)
  const [corrigiendo, setCorrigiendo] = useState(false)
  const [datos, setDatos] = useState<DatosFuente>(vinculo.fuente)
  const [faltaCita, setFaltaCita] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState<Aviso>(null)
  const { fuente } = vinculo

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (corrigiendo && !datos.cita.trim()) {
      setFaltaCita(true)
      return
    }
    setGuardando(true)
    try {
      const corregida = corrigiendo ? await actualizarFuente(fuente.id, datos) : fuente
      await actualizarVinculo(idPunto, fuente.id, nivel, nota)
      marcarCambiosSinPublicar()
      alGuardar({ fuente: corregida, nivel, nota: nota.trim() })
    } catch {
      setAviso('error')
      setGuardando(false)
    }
  }

  return (
    <form className="gestor__panel" onSubmit={guardar} noValidate>
      <div className="gestor__titulos">
        <h4 className="gestor__subtitulo texto-heading">{t('fuentes.editandoTitulo')}</h4>
        <p className="gestor__texto texto-small">{fuente.cita}</p>
      </div>
      <SelectorNivel nombre={`nivel-${fuente.id}`} nivel={nivel} alCambiar={setNivel} />
      <CampoNota nota={nota} alCambiar={setNota} />
      {corrigiendo ? (
        <>
          <p className="gestor__aviso texto-small">{t('fuentes.editarFuenteAviso')}</p>
          <CamposFuente
            datos={datos}
            faltaCita={faltaCita}
            alCambiar={(nuevos) => {
              setDatos(nuevos)
              setFaltaCita(false)
            }}
          />
        </>
      ) : (
        <Boton variante="fantasma" tamano="sm" onClick={() => setCorrigiendo(true)}>
          {t('fuentes.editarFuente')}
        </Boton>
      )}
      <Mensaje aviso={aviso} />
      <div className="gestor__pestanas">
        <Boton type="submit" tamano="sm" icono={Save} cargando={guardando}>
          {t('fuentes.guardar')}
        </Boton>
        <Boton variante="secundario" tamano="sm" onClick={alCerrar}>
          {t('fuentes.cancelar')}
        </Boton>
      </div>
    </form>
  )
}

type Origen = 'existente' | 'nueva'

/**
 * Agregar una fuente al punto, en tres preguntas numeradas: qué fuente (una de la biblioteca o una
 * nueva), qué tan segura es para este punto y qué respalda. El título dice a qué punto se agrega.
 */
function AgregarFuente({
  idPunto,
  nombrePunto,
  disponibles,
  alAgregar,
  alCerrar,
}: {
  idPunto: string
  nombrePunto: string
  disponibles: Fuente[]
  alAgregar: (vinculo: FuentePunto, nueva: boolean) => void
  alCerrar: () => void
}) {
  const { t } = useTranslation('gestor')
  const [origen, setOrigen] = useState<Origen>(disponibles.length > 0 ? 'existente' : 'nueva')
  const [eleccion, setEleccion] = useState('')
  const [datos, setDatos] = useState<DatosFuente>(FUENTE_VACIA)
  const [nivel, setNivel] = useState<NivelConfianza>('documentado')
  const [nota, setNota] = useState('')
  const [faltaCita, setFaltaCita] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<Aviso>(null)
  const existente = origen === 'existente' ? disponibles.find((f) => f.id === eleccion) : undefined

  async function agregar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (origen === 'existente' && !existente) {
      setAviso('faltaFuente')
      return
    }
    if (origen === 'nueva' && !datos.cita.trim()) {
      setFaltaCita(true)
      return
    }
    setOcupado(true)
    try {
      const fuente = existente ?? (await crearFuente(datos))
      await vincularFuente(idPunto, fuente.id, nivel, nota)
      marcarCambiosSinPublicar()
      alAgregar({ fuente, nivel, nota: nota.trim() }, !existente)
    } catch {
      setAviso('error')
      setOcupado(false)
    }
  }

  return (
    <form className="gestor__panel" onSubmit={agregar} noValidate>
      <h4 className="gestor__subtitulo texto-heading">
        {t('fuentes.agregarA', { punto: nombrePunto })}
      </h4>

      <fieldset className="gestor__pregunta">
        <legend className="gestor__pregunta-titulo texto-heading">
          <span className="gestor__pregunta-numero texto-small-strong" aria-hidden="true">
            1
          </span>
          {t('fuentes.preguntaCual')}
        </legend>
        {disponibles.length > 0 && (
          <div className="gestor__pestanas" role="group" aria-label={t('fuentes.preguntaCual')}>
            {(['existente', 'nueva'] as const).map((o) => (
              <Boton
                key={o}
                tamano="sm"
                variante={o === origen ? 'primario' : 'secundario'}
                aria-pressed={o === origen}
                onClick={() => {
                  setOrigen(o)
                  setAviso(null)
                }}
              >
                {t(`fuentes.origen.${o}`)}
              </Boton>
            ))}
          </div>
        )}
        {origen === 'existente' ? (
          <Selector
            etiqueta={t('fuentes.campos.fuente')}
            ayuda={t('fuentes.campos.fuenteAyuda')}
            value={eleccion}
            opciones={[
              { valor: '', texto: t('fuentes.campos.elegir') },
              ...disponibles.map((f) => ({ valor: f.id, texto: f.cita })),
            ]}
            onChange={(e) => {
              setEleccion(e.target.value)
              setAviso(null)
            }}
          />
        ) : (
          <CamposFuente
            datos={datos}
            faltaCita={faltaCita}
            alCambiar={(nuevos) => {
              setDatos(nuevos)
              setFaltaCita(false)
              setAviso(null)
            }}
          />
        )}
      </fieldset>

      <fieldset className="gestor__pregunta">
        <legend className="gestor__pregunta-titulo texto-heading">
          <span className="gestor__pregunta-numero texto-small-strong" aria-hidden="true">
            2
          </span>
          {t('fuentes.preguntaNivel')}
        </legend>
        <SelectorNivel nombre="nivel-nueva" nivel={nivel} alCambiar={setNivel} />
      </fieldset>

      <fieldset className="gestor__pregunta">
        <legend className="gestor__pregunta-titulo texto-heading">
          <span className="gestor__pregunta-numero texto-small-strong" aria-hidden="true">
            3
          </span>
          {t('fuentes.preguntaNota')}
        </legend>
        <CampoNota nota={nota} alCambiar={setNota} />
      </fieldset>

      <Mensaje aviso={aviso} />
      <div className="gestor__pestanas">
        <Boton type="submit" icono={Plus} cargando={ocupado}>
          {t('fuentes.agregar')}
        </Boton>
        <Boton variante="secundario" onClick={alCerrar}>
          {t('fuentes.cancelar')}
        </Boton>
      </div>
    </form>
  )
}

type Panel = { tipo: 'editar'; id: string } | { tipo: 'agregar' } | null

/**
 * Fuentes de un punto: las que ya tiene, compactas, y un solo panel para editar una o agregar otra.
 */
export function FuentesPunto({
  idPunto,
  nombrePunto,
  alResumir,
}: {
  idPunto: string
  /** Nombre del punto ("Punto 3 · Nicho central"), para decir a qué se agrega la fuente. */
  nombrePunto: string
  /** Avisa cuántas fuentes tiene el punto, para el estado del paso. */
  alResumir?: (cuantas: number) => void
}) {
  const { t } = useTranslation('gestor')
  const [vinculos, setVinculos] = useState<FuentePunto[] | null>(null)
  const [todas, setTodas] = useState<Fuente[]>([])
  const [error, setError] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [aviso, setAviso] = useState<Aviso>(null)

  useEffect(() => {
    let vigente = true
    Promise.all([listarFuentesPunto(idPunto), listarFuentes()])
      .then(([delPunto, registradas]) => {
        if (!vigente) return
        setVinculos(delPunto)
        setTodas(registradas)
      })
      .catch(() => vigente && setError(true))
    return () => {
      vigente = false
    }
  }, [idPunto])

  useEffect(() => {
    if (vinculos) alResumir?.(vinculos.length)
    // alResumir cambia en cada render del editor; solo importa cuando cambian las fuentes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vinculos])

  if (error) {
    return (
      <p className="gestor__error texto-body" role="alert">
        {t('fuentes.errorCarga')}
      </p>
    )
  }
  if (!vinculos) {
    return (
      <p className="gestor__texto texto-body" role="status">
        {t('comun.cargando')}
      </p>
    )
  }

  const cerrar = () => setPanel(null)
  const enEdicion =
    panel?.tipo === 'editar' ? vinculos.find((v) => v.fuente.id === panel.id) : undefined

  async function quitar(vinculo: FuentePunto) {
    try {
      await desvincularFuente(idPunto, vinculo.fuente.id)
      marcarCambiosSinPublicar()
      setVinculos((actuales) => (actuales ?? []).filter((v) => v.fuente.id !== vinculo.fuente.id))
      if (enEdicion?.fuente.id === vinculo.fuente.id) cerrar()
      setAviso('quitada')
    } catch (e) {
      setAviso('error')
      throw e
    }
  }

  return (
    <div className="gestor__seccion">
      <Mensaje aviso={aviso} />

      <section className="gestor__grupo" aria-labelledby="fuentes-punto-titulo">
        <h3 id="fuentes-punto-titulo" className="gestor__subtitulo texto-heading">
          {t('fuentes.delPunto', { cuantas: vinculos.length })}
        </h3>
        {vinculos.length === 0 && <p className="gestor__aviso texto-small">{t('fuentes.vacio')}</p>}
        <ul className="gestor__fuentes">
          {vinculos.map((vinculo) => (
            <TarjetaFuente
              key={vinculo.fuente.id}
              vinculo={vinculo}
              editando={enEdicion?.fuente.id === vinculo.fuente.id}
              alEditar={() => {
                setAviso(null)
                setPanel(
                  enEdicion?.fuente.id === vinculo.fuente.id
                    ? null
                    : { tipo: 'editar', id: vinculo.fuente.id },
                )
              }}
              alQuitar={() => quitar(vinculo)}
            />
          ))}
        </ul>
        {enEdicion && (
          <EditarFuente
            key={enEdicion.fuente.id}
            idPunto={idPunto}
            vinculo={enEdicion}
            alCerrar={cerrar}
            alGuardar={(nuevo) => {
              setVinculos((actuales) =>
                (actuales ?? []).map((v) => (v.fuente.id === nuevo.fuente.id ? nuevo : v)),
              )
              setTodas((actuales) =>
                actuales.map((f) => (f.id === nuevo.fuente.id ? nuevo.fuente : f)),
              )
              cerrar()
              setAviso('guardada')
            }}
          />
        )}
      </section>

      {panel?.tipo === 'agregar' ? (
        <AgregarFuente
          idPunto={idPunto}
          nombrePunto={nombrePunto}
          disponibles={fuentesDisponibles(todas, vinculos)}
          alCerrar={cerrar}
          alAgregar={(vinculo, nueva) => {
            setVinculos((actuales) => [...(actuales ?? []), vinculo])
            if (nueva) setTodas((actuales) => [...actuales, vinculo.fuente])
            cerrar()
            setAviso('agregada')
          }}
        />
      ) : (
        <button
          type="button"
          className="gestor__agregar-foto gestor__agregar-fuente"
          onClick={() => {
            setAviso(null)
            setPanel({ tipo: 'agregar' })
          }}
        >
          <Plus className="gestor__agregar-icono" aria-hidden="true" />
          <span className="texto-body-strong">{t('fuentes.agregarA', { punto: nombrePunto })}</span>
        </button>
      )}
    </div>
  )
}
