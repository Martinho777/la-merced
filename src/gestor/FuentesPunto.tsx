import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Save, Trash2 } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Insignia } from '@/componentes/Insignia'
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
import { Campo, Selector } from '@/gestor/componentes/Campo'
import { FUENTE_VACIA, fuentesDisponibles, TONO_NIVEL } from '@/gestor/fuentes'

type Aviso = 'agregada' | 'guardada' | 'faltaCita' | 'error' | null

function Mensaje({ aviso }: { aviso: Aviso }) {
  const { t } = useTranslation('gestor')
  if (!aviso || aviso === 'faltaCita') return null
  const bueno = aviso !== 'error'
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
      <Campo
        etiqueta={t('fuentes.campos.cita')}
        ayuda={t('fuentes.campos.citaAyuda')}
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
        type="url"
        value={datos.url}
        onChange={(e) => alCambiar({ ...datos, url: e.target.value })}
      />
    </>
  )
}

/** Nivel de confianza y nota del vínculo con el punto. */
function CamposVinculo({
  nivel,
  nota,
  alCambiar,
}: {
  nivel: NivelConfianza
  nota: string
  alCambiar: (nivel: NivelConfianza, nota: string) => void
}) {
  const { t } = useTranslation('gestor')
  return (
    <>
      <Selector
        etiqueta={t('fuentes.campos.nivel')}
        ayuda={t('fuentes.nivelesAyuda')}
        value={nivel}
        opciones={NIVELES_CONFIANZA.map((n) => ({ valor: n, texto: t(`fuentes.niveles.${n}`) }))}
        onChange={(e) => alCambiar(e.target.value as NivelConfianza, nota)}
      />
      <Campo
        etiqueta={t('fuentes.campos.nota')}
        ayuda={t('fuentes.campos.notaAyuda')}
        value={nota}
        onChange={(e) => alCambiar(nivel, e.target.value)}
      />
    </>
  )
}

/** Una fuente del punto: su nivel y nota editables, corregir la fuente y quitarla del punto. */
function FuenteDelPunto({
  idPunto,
  vinculo,
  alCambiar,
  alQuitar,
}: {
  idPunto: string
  vinculo: FuentePunto
  alCambiar: (vinculo: FuentePunto) => void
  alQuitar: () => void
}) {
  const { t } = useTranslation('gestor')
  const [nivel, setNivel] = useState(vinculo.nivel)
  const [nota, setNota] = useState(vinculo.nota)
  const [editandoFuente, setEditandoFuente] = useState(false)
  const [datosFuente, setDatosFuente] = useState<DatosFuente>(vinculo.fuente)
  const [faltaCita, setFaltaCita] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<Aviso>(null)
  const { fuente } = vinculo

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (editandoFuente && !datosFuente.cita.trim()) {
      setFaltaCita(true)
      return
    }
    setOcupado(true)
    try {
      const corregida = editandoFuente ? await actualizarFuente(fuente.id, datosFuente) : fuente
      await actualizarVinculo(idPunto, fuente.id, nivel, nota)
      alCambiar({ fuente: corregida, nivel, nota })
      setEditandoFuente(false)
      setAviso('guardada')
    } catch {
      setAviso('error')
    } finally {
      setOcupado(false)
    }
  }

  async function quitar() {
    setOcupado(true)
    try {
      await desvincularFuente(idPunto, fuente.id)
      alQuitar()
    } catch {
      setAviso('error')
      setOcupado(false)
      setConfirmando(false)
    }
  }

  return (
    <form className="gestor__foto" onSubmit={guardar} noValidate>
      <div className="gestor__titulos">
        <p className="gestor__marca texto-body-strong">{fuente.cita}</p>
        <p className="gestor__texto texto-small">{t(`fuentes.tipos.${fuente.tipo}`)}</p>
        {fuente.url && (
          <a
            className="gestor__enlace texto-small"
            href={fuente.url}
            target="_blank"
            rel="noreferrer"
          >
            {t('fuentes.enlace')}
          </a>
        )}
        <Insignia tono={TONO_NIVEL[vinculo.nivel]}>
          {t(`fuentes.niveles.${vinculo.nivel}`)}
        </Insignia>
      </div>

      <CamposVinculo
        nivel={nivel}
        nota={nota}
        alCambiar={(n, texto) => {
          setNivel(n)
          setNota(texto)
          setAviso(null)
        }}
      />

      {editandoFuente ? (
        <>
          <p className="gestor__texto texto-small">{t('fuentes.editarFuenteAviso')}</p>
          <CamposFuente
            datos={datosFuente}
            faltaCita={faltaCita}
            alCambiar={(datos) => {
              setDatosFuente(datos)
              setFaltaCita(false)
              setAviso(null)
            }}
          />
        </>
      ) : null}

      <Mensaje aviso={aviso} />

      <div className="gestor__pestanas">
        <Boton type="submit" tamano="sm" icono={Save} cargando={ocupado && !confirmando}>
          {t('fuentes.guardar')}
        </Boton>
        {editandoFuente ? (
          <Boton
            variante="fantasma"
            tamano="sm"
            onClick={() => {
              setEditandoFuente(false)
              setDatosFuente(fuente)
            }}
          >
            {t('fuentes.cancelar')}
          </Boton>
        ) : (
          <Boton variante="fantasma" tamano="sm" onClick={() => setEditandoFuente(true)}>
            {t('fuentes.editarFuente')}
          </Boton>
        )}
        {confirmando ? (
          <Boton
            variante="fantasma"
            tamano="sm"
            destructivo
            icono={Trash2}
            cargando={ocupado}
            onClick={() => void quitar()}
          >
            {t('fuentes.confirmarQuitar')}
          </Boton>
        ) : (
          <Boton
            variante="fantasma"
            tamano="sm"
            destructivo
            icono={Trash2}
            onClick={() => setConfirmando(true)}
          >
            {t('fuentes.quitar')}
          </Boton>
        )}
      </div>
    </form>
  )
}

/** Agregar al punto una fuente existente o una nueva, con su nivel de confianza. */
function AgregarFuente({
  idPunto,
  disponibles,
  alAgregar,
}: {
  idPunto: string
  disponibles: Fuente[]
  alAgregar: (vinculo: FuentePunto, nueva: boolean) => void
}) {
  const { t } = useTranslation('gestor')
  const [eleccion, setEleccion] = useState('')
  const [datos, setDatos] = useState<DatosFuente>(FUENTE_VACIA)
  const [nivel, setNivel] = useState<NivelConfianza>('documentado')
  const [nota, setNota] = useState('')
  const [faltaCita, setFaltaCita] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [aviso, setAviso] = useState<Aviso>(null)
  const existente = disponibles.find((f) => f.id === eleccion) ?? null

  async function agregar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!existente && !datos.cita.trim()) {
      setFaltaCita(true)
      return
    }
    setOcupado(true)
    try {
      const fuente = existente ?? (await crearFuente(datos))
      await vincularFuente(idPunto, fuente.id, nivel, nota)
      alAgregar({ fuente, nivel, nota: nota.trim() }, !existente)
      setEleccion('')
      setDatos(FUENTE_VACIA)
      setNivel('documentado')
      setNota('')
      setAviso('agregada')
    } catch {
      setAviso('error')
    } finally {
      setOcupado(false)
    }
  }

  return (
    <form className="gestor__foto gestor__foto--nueva" onSubmit={agregar} noValidate>
      <h3 className="gestor__subtitulo texto-heading">{t('fuentes.agregarTitulo')}</h3>
      {disponibles.length > 0 && (
        <Selector
          etiqueta={t('fuentes.campos.fuente')}
          value={eleccion}
          opciones={[
            { valor: '', texto: t('fuentes.campos.nueva') },
            ...disponibles.map((f) => ({ valor: f.id, texto: f.cita })),
          ]}
          onChange={(e) => {
            setEleccion(e.target.value)
            setAviso(null)
          }}
        />
      )}
      {!existente && (
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
      <CamposVinculo
        nivel={nivel}
        nota={nota}
        alCambiar={(n, texto) => {
          setNivel(n)
          setNota(texto)
        }}
      />
      <Mensaje aviso={aviso} />
      <Boton type="submit" icono={Plus} cargando={ocupado}>
        {t('fuentes.agregar')}
      </Boton>
    </form>
  )
}

/** Sección de fuentes de un punto. */
export function FuentesPunto({ idPunto }: { idPunto: string }) {
  const { t } = useTranslation('gestor')
  const [vinculos, setVinculos] = useState<FuentePunto[] | null>(null)
  const [todas, setTodas] = useState<Fuente[]>([])
  const [error, setError] = useState(false)

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

  return (
    <section className="gestor__seccion" aria-labelledby="fuentes-titulo">
      <div className="gestor__titulos">
        <h2 id="fuentes-titulo" className="gestor__subtitulo texto-title-2">
          {t('fuentes.titulo')}
        </h2>
        <p className="gestor__texto texto-body">{t('fuentes.texto')}</p>
      </div>

      {vinculos.length === 0 && <p className="gestor__texto texto-body">{t('fuentes.vacio')}</p>}
      {vinculos.map((vinculo) => (
        <FuenteDelPunto
          key={vinculo.fuente.id}
          idPunto={idPunto}
          vinculo={vinculo}
          alCambiar={(nuevo) => {
            setVinculos((actuales) =>
              (actuales ?? []).map((v) => (v.fuente.id === nuevo.fuente.id ? nuevo : v)),
            )
            setTodas((actuales) =>
              actuales.map((f) => (f.id === nuevo.fuente.id ? nuevo.fuente : f)),
            )
          }}
          alQuitar={() =>
            setVinculos((actuales) =>
              (actuales ?? []).filter((v) => v.fuente.id !== vinculo.fuente.id),
            )
          }
        />
      ))}

      <AgregarFuente
        idPunto={idPunto}
        disponibles={fuentesDisponibles(todas, vinculos)}
        alAgregar={(vinculo, nueva) => {
          setVinculos((actuales) => [...(actuales ?? []), vinculo])
          if (nueva) setTodas((actuales) => [...actuales, vinculo.fuente])
        }}
      />
    </section>
  )
}
