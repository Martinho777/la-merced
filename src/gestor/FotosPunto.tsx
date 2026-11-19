import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagePlus, Pencil, Plus, Save, Trash2, TriangleAlert } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Insignia } from '@/componentes/Insignia'
import {
  actualizarFoto,
  borrarFoto,
  listarFotosPunto,
  subirFoto,
  type DatosFoto,
  type FotoGestor,
  type ImagenPreparada,
  type TipoFoto,
} from '@/datos/fotos'
import { Campo } from '@/gestor/componentes/Campo'
import { datosVacios, faltantesFoto, siguienteOrden } from '@/gestor/fotos'
import { ErrorImagen, prepararImagen, TIPOS_ACEPTADOS } from '@/gestor/imagen'

type Punto = { id: string; slug: string }

/** Campos de créditos y textos alternativos, compartidos por la subida y la edición. */
function CamposFoto({
  datos,
  historica,
  faltaAlt,
  alCambiar,
}: {
  datos: DatosFoto
  /** En las históricas el crédito y el permiso son obligatorios (vienen de un archivo). */
  historica: boolean
  faltaAlt: boolean
  alCambiar: (datos: DatosFoto) => void
}) {
  const deArchivo = historica ? 'obligatorio' : 'opcional'
  const { t } = useTranslation('gestor')
  const campo = (clave: keyof DatosFoto) => ({
    value: datos[clave],
    onChange: (e: { target: { value: string } }) =>
      alCambiar({ ...datos, [clave]: e.target.value }),
  })

  return (
    <>
      <Campo
        etiqueta={t('fotos.campos.altEs')}
        ayuda={t('fotos.campos.altEsAyuda')}
        error={faltaAlt ? t('fotos.faltaAlt') : undefined}
        requisito="obligatorio"
        {...campo('textoAlternativoEs')}
      />
      <Campo
        etiqueta={t('fotos.campos.altEn')}
        lang="en"
        requisito="opcional"
        {...campo('textoAlternativoEn')}
      />
      <Campo
        etiqueta={t('fotos.campos.credito')}
        ayuda={t('fotos.campos.creditoAyuda')}
        requisito={deArchivo}
        {...campo('credito')}
      />
      <Campo
        etiqueta={t('fotos.campos.fecha')}
        ayuda={t('fotos.campos.fechaAyuda')}
        requisito="opcional"
        {...campo('fechaOriginal')}
      />
      <Campo
        etiqueta={t('fotos.campos.derechos')}
        ayuda={t('fotos.campos.derechosAyuda')}
        requisito={deArchivo}
        {...campo('derechos')}
      />
    </>
  )
}

type AvisoFoto =
  | 'subida'
  | 'guardada'
  | 'borrada'
  | 'faltaArchivo'
  | 'errorFormato'
  | 'errorConversion'
  | 'errorSubir'
  | 'errorGuardar'
  | 'errorBorrar'
  | null

function Aviso({ aviso }: { aviso: AvisoFoto }) {
  const { t } = useTranslation('gestor')
  if (!aviso) return null
  const bueno = aviso === 'subida' || aviso === 'guardada' || aviso === 'borrada'
  return (
    <p
      className={bueno ? 'gestor__texto texto-body' : 'gestor__error texto-body'}
      role={bueno ? 'status' : 'alert'}
    >
      {t(`fotos.${aviso}`)}
    </p>
  )
}

/** Datos de una foto ya subida, en el panel de edición (uno a la vez). */
function EditarFoto({
  foto,
  alGuardar,
  alCerrar,
}: {
  foto: FotoGestor
  alGuardar: (foto: FotoGestor) => void
  alCerrar: () => void
}) {
  const { t } = useTranslation('gestor')
  const [datos, setDatos] = useState<DatosFoto>(foto)
  const [faltaAlt, setFaltaAlt] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState<AvisoFoto>(null)

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!datos.textoAlternativoEs.trim()) {
      setFaltaAlt(true)
      return
    }
    setGuardando(true)
    try {
      alGuardar(await actualizarFoto(foto.id, datos))
    } catch {
      setAviso('errorGuardar')
      setGuardando(false)
    }
  }

  return (
    <form
      className="gestor__panel"
      onSubmit={guardar}
      noValidate
      aria-label={t('fotos.editandoTitulo')}
    >
      <div className="gestor__panel-cabecera">
        <img className="gestor__panel-miniatura" src={foto.url} alt="" />
        <h4 className="gestor__subtitulo texto-heading">{t('fotos.editandoTitulo')}</h4>
      </div>
      <CamposFoto
        datos={datos}
        historica={foto.tipo === 'foto_historica'}
        faltaAlt={faltaAlt}
        alCambiar={(nuevos) => {
          setDatos(nuevos)
          setFaltaAlt(false)
          setAviso(null)
        }}
      />
      <Aviso aviso={aviso} />
      <div className="gestor__pestanas">
        <Boton type="submit" tamano="sm" icono={Save} cargando={guardando}>
          {t('fotos.guardarDatos')}
        </Boton>
        <Boton variante="secundario" tamano="sm" onClick={alCerrar}>
          {t('fotos.cancelar')}
        </Boton>
      </div>
    </form>
  )
}

/** Elegir una imagen, verla y completar sus datos antes de subirla. */
function SubirFoto({
  punto,
  tipo,
  titulo,
  orden,
  anterior,
  alSubir,
  alCerrar,
}: {
  punto: Punto
  tipo: TipoFoto
  titulo: string
  orden: number
  anterior: FotoGestor | null
  alSubir: (foto: FotoGestor) => void
  alCerrar: () => void
}) {
  const { t } = useTranslation('gestor')
  const [imagen, setImagen] = useState<ImagenPreparada | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [datos, setDatos] = useState<DatosFoto>(datosVacios)
  const [faltaAlt, setFaltaAlt] = useState(false)
  const [preparando, setPreparando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [aviso, setAviso] = useState<AvisoFoto>(null)

  useEffect(
    () => () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia)
    },
    [vistaPrevia],
  )

  async function elegir(archivo: File | undefined) {
    setAviso(null)
    setImagen(null)
    setVistaPrevia(null)
    if (!archivo) return
    setPreparando(true)
    try {
      const preparada = await prepararImagen(archivo)
      setImagen(preparada)
      setVistaPrevia(URL.createObjectURL(preparada.archivo))
    } catch (e) {
      setAviso(
        e instanceof ErrorImagen && e.motivo === 'formato' ? 'errorFormato' : 'errorConversion',
      )
    } finally {
      setPreparando(false)
    }
  }

  async function subir(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!imagen) {
      setAviso('faltaArchivo')
      return
    }
    if (!datos.textoAlternativoEs.trim()) {
      setFaltaAlt(true)
      return
    }
    setSubiendo(true)
    try {
      alSubir(await subirFoto(punto, tipo, imagen, datos, orden, anterior))
    } catch {
      setAviso('errorSubir')
      setSubiendo(false)
    }
  }

  return (
    <form className="gestor__panel" onSubmit={subir} noValidate aria-label={titulo}>
      <h4 className="gestor__subtitulo texto-heading">{titulo}</h4>
      <Campo
        etiqueta={t('fotos.archivo')}
        ayuda={t('fotos.archivoAyuda')}
        type="file"
        accept={TIPOS_ACEPTADOS.join(',')}
        onChange={(e) => void elegir(e.target.files?.[0])}
      />
      {preparando && (
        <p className="gestor__texto texto-small" role="status">
          {t('fotos.preparando')}
        </p>
      )}
      {vistaPrevia && (
        <img className="gestor__miniatura" src={vistaPrevia} alt={t('fotos.vistaPrevia')} />
      )}
      <CamposFoto
        datos={datos}
        historica={tipo === 'foto_historica'}
        faltaAlt={faltaAlt}
        alCambiar={(nuevos) => {
          setDatos(nuevos)
          setFaltaAlt(false)
          setAviso(null)
        }}
      />
      <Aviso aviso={aviso} />
      <div className="gestor__pestanas">
        <Boton type="submit" icono={ImagePlus} cargando={subiendo} disabled={preparando}>
          {t('fotos.subir')}
        </Boton>
        <Boton variante="secundario" onClick={alCerrar}>
          {t('fotos.cancelar')}
        </Boton>
      </div>
    </form>
  )
}

/**
 * Una foto en la galería: miniatura, fecha y crédito, aviso si le faltan datos, y sus acciones.
 * Borrar pide confirmación en la misma tarjeta.
 */
function TarjetaFoto({
  foto,
  editando,
  acciones,
  alEditar,
  alBorrar,
}: {
  foto: FotoGestor
  editando: boolean
  /** Acciones extra (p. ej. "Cambiar foto" en la del detalle). */
  acciones?: ReactNode
  alEditar: () => void
  alBorrar: () => Promise<void>
}) {
  const { t } = useTranslation('gestor')
  const [confirmando, setConfirmando] = useState(false)
  const [borrando, setBorrando] = useState(false)
  const faltan = faltantesFoto(foto)

  async function borrar() {
    setBorrando(true)
    try {
      await alBorrar()
    } catch {
      setBorrando(false)
      setConfirmando(false)
    }
  }

  return (
    <li
      className={
        editando ? 'gestor__tarjeta-foto gestor__tarjeta-foto--editando' : 'gestor__tarjeta-foto'
      }
    >
      <img className="gestor__tarjeta-imagen" src={foto.url} alt={foto.textoAlternativoEs} />
      <div className="gestor__tarjeta-datos">
        <p className="gestor__marca texto-small-strong">
          {foto.fechaOriginal || t('fotos.sinFecha')}
        </p>
        <p className="gestor__texto texto-small">{foto.credito || t('fotos.sinCredito')}</p>
        {faltan.length > 0 && (
          <Insignia tono="advertencia" icono={TriangleAlert}>
            {t('fotos.faltanDatos', { count: faltan.length, cuantos: faltan.length })}
          </Insignia>
        )}
      </div>
      <div className="gestor__tarjeta-acciones">
        {confirmando ? (
          <>
            <p className="gestor__texto texto-small-strong">{t('fotos.preguntaBorrar')}</p>
            <Boton
              variante="fantasma"
              destructivo
              tamano="sm"
              icono={Trash2}
              cargando={borrando}
              onClick={() => void borrar()}
            >
              {t('fotos.confirmarBorrar')}
            </Boton>
            <Boton variante="secundario" tamano="sm" onClick={() => setConfirmando(false)}>
              {t('fotos.cancelar')}
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
              {t('fotos.editar')}
            </Boton>
            {acciones}
            <Boton
              variante="fantasma"
              destructivo
              tamano="sm"
              icono={Trash2}
              onClick={() => setConfirmando(true)}
            >
              {t('fotos.borrar')}
            </Boton>
          </>
        )}
      </div>
    </li>
  )
}

/**
 * La foto del detalle: es una sola por punto, así que no va en mosaico. Sus datos siempre a la vista
 * y la foto a la derecha (abajo en el teléfono). Elegir otra imagen la cambia al guardar.
 */
function FotoDelDetalle({
  punto,
  foto,
  alCambiar,
}: {
  punto: Punto
  foto: FotoGestor | null
  alCambiar: (vieja: FotoGestor | null, nueva: FotoGestor | null) => void
}) {
  const { t } = useTranslation('gestor')
  const [datos, setDatos] = useState<DatosFoto>(foto ?? datosVacios)
  const [imagen, setImagen] = useState<ImagenPreparada | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [faltaAlt, setFaltaAlt] = useState(false)
  const [preparando, setPreparando] = useState(false)
  const [ocupado, setOcupado] = useState<'guardar' | 'borrar' | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [aviso, setAviso] = useState<AvisoFoto>(null)
  // Cambiar la clave vacía el selector de archivo después de guardar.
  const [claveArchivo, setClaveArchivo] = useState(0)

  useEffect(
    () => () => {
      if (vistaPrevia) URL.revokeObjectURL(vistaPrevia)
    },
    [vistaPrevia],
  )

  async function elegir(archivo: File | undefined) {
    setAviso(null)
    setImagen(null)
    setVistaPrevia(null)
    if (!archivo) return
    setPreparando(true)
    try {
      const preparada = await prepararImagen(archivo)
      setImagen(preparada)
      setVistaPrevia(URL.createObjectURL(preparada.archivo))
    } catch (e) {
      setAviso(
        e instanceof ErrorImagen && e.motivo === 'formato' ? 'errorFormato' : 'errorConversion',
      )
    } finally {
      setPreparando(false)
    }
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!foto && !imagen) {
      setAviso('faltaArchivo')
      return
    }
    if (!datos.textoAlternativoEs.trim()) {
      setFaltaAlt(true)
      return
    }
    setOcupado('guardar')
    try {
      const nueva = imagen
        ? await subirFoto(punto, 'foto', imagen, datos, 0, foto)
        : await actualizarFoto(foto!.id, datos)
      alCambiar(foto, nueva)
      setImagen(null)
      setVistaPrevia(null)
      setClaveArchivo((n) => n + 1)
      setAviso(imagen ? 'subida' : 'guardada')
    } catch {
      setAviso(imagen ? 'errorSubir' : 'errorGuardar')
    } finally {
      setOcupado(null)
    }
  }

  async function borrar() {
    if (!foto) return
    setOcupado('borrar')
    try {
      await borrarFoto(foto)
      alCambiar(foto, null)
      setDatos(datosVacios)
      setAviso('borrada')
    } catch {
      setAviso('errorBorrar')
    } finally {
      setOcupado(null)
      setConfirmando(false)
    }
  }

  const imagenVisible = vistaPrevia ?? foto?.url ?? null

  return (
    <form className="gestor__detalle" onSubmit={guardar} noValidate>
      <div className="gestor__detalle-campos">
        <Campo
          key={claveArchivo}
          etiqueta={foto ? t('fotos.cambiar') : t('fotos.archivo')}
          ayuda={t('fotos.archivoAyuda')}
          type="file"
          accept={TIPOS_ACEPTADOS.join(',')}
          onChange={(e) => void elegir(e.target.files?.[0])}
        />
        {preparando && (
          <p className="gestor__texto texto-small" role="status">
            {t('fotos.preparando')}
          </p>
        )}
        <CamposFoto
          datos={datos}
          historica={false}
          faltaAlt={faltaAlt}
          alCambiar={(nuevos) => {
            setDatos(nuevos)
            setFaltaAlt(false)
            setAviso(null)
          }}
        />
        <Aviso aviso={aviso} />
        <div className="gestor__pestanas">
          <Boton
            type="submit"
            icono={imagen ? ImagePlus : Save}
            cargando={ocupado === 'guardar'}
            disabled={preparando}
          >
            {imagen ? t('fotos.subir') : t('fotos.guardarDatos')}
          </Boton>
          {foto &&
            (confirmando ? (
              <>
                <Boton
                  variante="fantasma"
                  destructivo
                  icono={Trash2}
                  cargando={ocupado === 'borrar'}
                  onClick={() => void borrar()}
                >
                  {t('fotos.confirmarBorrar')}
                </Boton>
                <Boton variante="secundario" onClick={() => setConfirmando(false)}>
                  {t('fotos.cancelar')}
                </Boton>
              </>
            ) : (
              <Boton
                variante="fantasma"
                destructivo
                icono={Trash2}
                onClick={() => setConfirmando(true)}
              >
                {t('fotos.borrar')}
              </Boton>
            ))}
        </div>
      </div>

      <figure className="gestor__detalle-foto">
        {imagenVisible ? (
          <img src={imagenVisible} alt={datos.textoAlternativoEs} />
        ) : (
          <span className="gestor__detalle-vacia texto-body">{t('fotos.sinDetalle')}</span>
        )}
        {vistaPrevia && (
          <figcaption className="gestor__texto texto-small">
            {t('fotos.vistaPreviaNueva')}
          </figcaption>
        )}
      </figure>
    </form>
  )
}

/** Mosaico punteado para agregar una foto (abre el panel de subida). */
function AgregarFoto({ texto, alPresionar }: { texto: string; alPresionar: () => void }) {
  return (
    <li>
      <button type="button" className="gestor__agregar-foto" onClick={alPresionar}>
        <Plus className="gestor__agregar-icono" aria-hidden="true" />
        <span className="texto-body-strong">{texto}</span>
      </button>
    </li>
  )
}

type Panel = { tipo: 'editar'; id: string } | { tipo: 'subir'; foto: TipoFoto } | null

/**
 * Fotos de un punto: la del detalle y la galería de históricas, como mosaicos. Editar o agregar abre
 * un solo panel bajo su grupo; las demás fotos quedan compactas.
 */
export function FotosPunto({
  punto,
  alResumir,
}: {
  punto: Punto
  /** Avisa si hay foto del detalle y cuántas históricas, para el estado del paso. */
  alResumir?: (resumen: { detalle: boolean; historicas: number }) => void
}) {
  const { t } = useTranslation('gestor')
  const [fotos, setFotos] = useState<FotoGestor[] | null>(null)
  const [error, setError] = useState(false)
  const [panel, setPanel] = useState<Panel>(null)
  const [aviso, setAviso] = useState<AvisoFoto>(null)

  useEffect(() => {
    let vigente = true
    listarFotosPunto(punto.id)
      .then((lista) => vigente && setFotos(lista))
      .catch(() => vigente && setError(true))
    return () => {
      vigente = false
    }
  }, [punto.id])

  const detalle = fotos?.find((f) => f.tipo === 'foto') ?? null
  const historicas = (fotos ?? []).filter((f) => f.tipo === 'foto_historica')

  useEffect(() => {
    if (fotos) alResumir?.({ detalle: detalle !== null, historicas: historicas.length })
    // alResumir cambia en cada render del editor; solo importa cuando cambian las fotos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fotos])

  if (error) {
    return (
      <p className="gestor__error texto-body" role="alert">
        {t('fotos.errorCarga')}
      </p>
    )
  }
  if (!fotos) {
    return (
      <p className="gestor__texto texto-body" role="status">
        {t('comun.cargando')}
      </p>
    )
  }

  const reemplazar = (vieja: FotoGestor | null, nueva: FotoGestor) =>
    setFotos((actuales) => [...(actuales ?? []).filter((f) => f.id !== vieja?.id), nueva])
  const quitar = (id: string) => setFotos((actuales) => (actuales ?? []).filter((f) => f.id !== id))
  const actualizar = (nueva: FotoGestor) =>
    setFotos((actuales) => (actuales ?? []).map((f) => (f.id === nueva.id ? nueva : f)))
  const cerrar = () => setPanel(null)
  const borrar = async (foto: FotoGestor) => {
    try {
      await borrarFoto(foto)
      quitar(foto.id)
      if (panel?.tipo === 'editar' && panel.id === foto.id) cerrar()
      setAviso('borrada')
    } catch (e) {
      setAviso('errorBorrar')
      throw e
    }
  }
  const editar = (foto: FotoGestor) => {
    setAviso(null)
    setPanel(
      panel?.tipo === 'editar' && panel.id === foto.id ? null : { tipo: 'editar', id: foto.id },
    )
  }
  const enEdicion = panel?.tipo === 'editar' ? fotos.find((f) => f.id === panel.id) : undefined
  const panelEdicion = (foto: FotoGestor) =>
    enEdicion?.id === foto.id && (
      <EditarFoto
        key={foto.id}
        foto={foto}
        alCerrar={cerrar}
        alGuardar={(nueva) => {
          actualizar(nueva)
          cerrar()
          setAviso('guardada')
        }}
      />
    )

  return (
    <div className="gestor__seccion">
      <Aviso aviso={aviso} />

      <section className="gestor__grupo" aria-labelledby="foto-detalle-titulo">
        <div className="gestor__titulos">
          <h3 id="foto-detalle-titulo" className="gestor__subtitulo texto-heading">
            {t('fotos.detalleTitulo')}
          </h3>
          <p className="gestor__texto texto-small">{t('fotos.detalleTexto')}</p>
        </div>
        <FotoDelDetalle
          key={detalle?.id ?? 'sin-detalle'}
          punto={punto}
          foto={detalle}
          alCambiar={(vieja, nueva) =>
            nueva ? reemplazar(vieja, nueva) : vieja && quitar(vieja.id)
          }
        />
      </section>

      <section className="gestor__grupo" aria-labelledby="fotos-historicas-titulo">
        <div className="gestor__titulos">
          <h3 id="fotos-historicas-titulo" className="gestor__subtitulo texto-heading">
            {t('fotos.historicasTitulo', { cuantas: historicas.length })}
          </h3>
          <p className="gestor__texto texto-small">{t('fotos.historicasTexto')}</p>
        </div>
        <ul className="gestor__galeria">
          {historicas.map((foto) => (
            <TarjetaFoto
              key={foto.id}
              foto={foto}
              editando={enEdicion?.id === foto.id}
              alEditar={() => editar(foto)}
              alBorrar={() => borrar(foto)}
            />
          ))}
          <AgregarFoto
            texto={t('fotos.nuevaHistorica')}
            alPresionar={() => {
              setAviso(null)
              setPanel({ tipo: 'subir', foto: 'foto_historica' })
            }}
          />
        </ul>
        {enEdicion?.tipo === 'foto_historica' && panelEdicion(enEdicion)}
        {panel?.tipo === 'subir' && panel.foto === 'foto_historica' && (
          <SubirFoto
            punto={punto}
            tipo="foto_historica"
            titulo={t('fotos.nuevaHistorica')}
            orden={siguienteOrden(historicas)}
            anterior={null}
            alCerrar={cerrar}
            alSubir={(nueva) => {
              reemplazar(null, nueva)
              cerrar()
              setAviso('subida')
            }}
          />
        )}
      </section>
    </div>
  )
}
