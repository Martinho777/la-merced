import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagePlus, Save, Trash2 } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
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
import { datosVacios, siguienteOrden } from '@/gestor/fotos'
import { ErrorImagen, prepararImagen, TIPOS_ACEPTADOS } from '@/gestor/imagen'

type Punto = { id: string; slug: string }

/** Campos de créditos y textos alternativos, compartidos por la subida y la edición. */
function CamposFoto({
  datos,
  faltaAlt,
  alCambiar,
}: {
  datos: DatosFoto
  faltaAlt: boolean
  alCambiar: (datos: DatosFoto) => void
}) {
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
        {...campo('textoAlternativoEs')}
      />
      <Campo etiqueta={t('fotos.campos.altEn')} lang="en" {...campo('textoAlternativoEn')} />
      <Campo
        etiqueta={t('fotos.campos.credito')}
        ayuda={t('fotos.campos.creditoAyuda')}
        {...campo('credito')}
      />
      <Campo
        etiqueta={t('fotos.campos.fecha')}
        ayuda={t('fotos.campos.fechaAyuda')}
        {...campo('fechaOriginal')}
      />
      <Campo
        etiqueta={t('fotos.campos.derechos')}
        ayuda={t('fotos.campos.derechosAyuda')}
        {...campo('derechos')}
      />
    </>
  )
}

type AvisoFoto =
  | 'subida'
  | 'guardada'
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
  const bueno = aviso === 'subida' || aviso === 'guardada'
  return (
    <p
      className={bueno ? 'gestor__texto texto-body' : 'gestor__error texto-body'}
      role={bueno ? 'status' : 'alert'}
    >
      {t(`fotos.${aviso}`)}
    </p>
  )
}

/** Una foto ya subida: miniatura, sus datos editables y borrar (con confirmación). */
function FotoExistente({
  foto,
  alCambiar,
  alBorrar,
}: {
  foto: FotoGestor
  alCambiar: (foto: FotoGestor) => void
  alBorrar: () => void
}) {
  const { t } = useTranslation('gestor')
  const [datos, setDatos] = useState<DatosFoto>(foto)
  const [faltaAlt, setFaltaAlt] = useState(false)
  const [ocupado, setOcupado] = useState<'guardar' | 'borrar' | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [aviso, setAviso] = useState<AvisoFoto>(null)

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!datos.textoAlternativoEs.trim()) {
      setFaltaAlt(true)
      return
    }
    setOcupado('guardar')
    try {
      alCambiar(await actualizarFoto(foto.id, datos))
      setAviso('guardada')
    } catch {
      setAviso('errorGuardar')
    } finally {
      setOcupado(null)
    }
  }

  async function borrar() {
    setOcupado('borrar')
    try {
      await borrarFoto(foto)
      alBorrar()
    } catch {
      setAviso('errorBorrar')
      setOcupado(null)
      setConfirmando(false)
    }
  }

  return (
    <form className="gestor__foto" onSubmit={guardar} noValidate>
      <img className="gestor__miniatura" src={foto.url} alt={foto.textoAlternativoEs} />
      <CamposFoto
        datos={datos}
        faltaAlt={faltaAlt}
        alCambiar={(nuevos) => {
          setDatos(nuevos)
          setFaltaAlt(false)
          setAviso(null)
        }}
      />
      <Aviso aviso={aviso} />
      <div className="gestor__pestanas">
        <Boton type="submit" tamano="sm" icono={Save} cargando={ocupado === 'guardar'}>
          {t('fotos.guardarDatos')}
        </Boton>
        {confirmando ? (
          <>
            <Boton
              variante="fantasma"
              tamano="sm"
              destructivo
              icono={Trash2}
              cargando={ocupado === 'borrar'}
              onClick={() => void borrar()}
            >
              {t('fotos.confirmarBorrar')}
            </Boton>
            <Boton variante="fantasma" tamano="sm" onClick={() => setConfirmando(false)}>
              {t('fotos.cancelar')}
            </Boton>
          </>
        ) : (
          <Boton
            variante="fantasma"
            tamano="sm"
            destructivo
            icono={Trash2}
            onClick={() => setConfirmando(true)}
          >
            {t('fotos.borrar')}
          </Boton>
        )}
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
}: {
  punto: Punto
  tipo: TipoFoto
  titulo: string
  orden: number
  anterior: FotoGestor | null
  alSubir: (foto: FotoGestor) => void
}) {
  const { t } = useTranslation('gestor')
  const [imagen, setImagen] = useState<ImagenPreparada | null>(null)
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null)
  const [datos, setDatos] = useState<DatosFoto>(datosVacios)
  const [faltaAlt, setFaltaAlt] = useState(false)
  const [preparando, setPreparando] = useState(false)
  const [subiendo, setSubiendo] = useState(false)
  const [aviso, setAviso] = useState<AvisoFoto>(null)
  // Cambiar la clave vacía el selector de archivo después de subir.
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
      setImagen(null)
      setVistaPrevia(null)
      setDatos(datosVacios)
      setClaveArchivo((n) => n + 1)
      setAviso('subida')
    } catch {
      setAviso('errorSubir')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <form className="gestor__foto gestor__foto--nueva" onSubmit={subir} noValidate>
      <h4 className="gestor__subtitulo texto-body-strong">{titulo}</h4>
      <Campo
        key={claveArchivo}
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
        faltaAlt={faltaAlt}
        alCambiar={(nuevos) => {
          setDatos(nuevos)
          setFaltaAlt(false)
          setAviso(null)
        }}
      />
      <Aviso aviso={aviso} />
      <Boton type="submit" icono={ImagePlus} cargando={subiendo} disabled={preparando}>
        {t('fotos.subir')}
      </Boton>
    </form>
  )
}

/** Sección de fotos de un punto: la del detalle y las históricas. */
export function FotosPunto({ punto }: { punto: Punto }) {
  const { t } = useTranslation('gestor')
  const [fotos, setFotos] = useState<FotoGestor[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let vigente = true
    listarFotosPunto(punto.id)
      .then((lista) => vigente && setFotos(lista))
      .catch(() => vigente && setError(true))
    return () => {
      vigente = false
    }
  }, [punto.id])

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

  const detalle = fotos.find((f) => f.tipo === 'foto') ?? null
  const historicas = fotos.filter((f) => f.tipo === 'foto_historica')
  const reemplazar = (vieja: FotoGestor | null, nueva: FotoGestor) =>
    setFotos((actuales) => [...(actuales ?? []).filter((f) => f.id !== vieja?.id), nueva])
  const quitar = (id: string) => setFotos((actuales) => (actuales ?? []).filter((f) => f.id !== id))
  const actualizar = (nueva: FotoGestor) =>
    setFotos((actuales) => (actuales ?? []).map((f) => (f.id === nueva.id ? nueva : f)))

  return (
    <section className="gestor__seccion" aria-labelledby="fotos-titulo">
      <div className="gestor__titulos">
        <h2 id="fotos-titulo" className="gestor__subtitulo texto-title-2">
          {t('fotos.titulo')}
        </h2>
        <p className="gestor__texto texto-body">{t('fotos.texto')}</p>
      </div>

      <section className="gestor__grupo">
        <h3 className="gestor__subtitulo texto-heading">{t('fotos.detalleTitulo')}</h3>
        <p className="gestor__texto texto-small">{t('fotos.detalleTexto')}</p>
        {detalle ? (
          <FotoExistente
            key={detalle.id}
            foto={detalle}
            alCambiar={actualizar}
            alBorrar={() => quitar(detalle.id)}
          />
        ) : (
          <p className="gestor__texto texto-body">{t('fotos.sinDetalle')}</p>
        )}
        <SubirFoto
          punto={punto}
          tipo="foto"
          titulo={detalle ? t('fotos.reemplazar') : t('fotos.detalleTitulo')}
          orden={0}
          anterior={detalle}
          alSubir={(nueva) => reemplazar(detalle, nueva)}
        />
      </section>

      <section className="gestor__grupo">
        <h3 className="gestor__subtitulo texto-heading">{t('fotos.historicasTitulo')}</h3>
        <p className="gestor__texto texto-small">{t('fotos.historicasTexto')}</p>
        {historicas.length === 0 && (
          <p className="gestor__texto texto-body">{t('fotos.sinHistoricas')}</p>
        )}
        {historicas.map((foto) => (
          <FotoExistente
            key={foto.id}
            foto={foto}
            alCambiar={actualizar}
            alBorrar={() => quitar(foto.id)}
          />
        ))}
        <SubirFoto
          punto={punto}
          tipo="foto_historica"
          titulo={t('fotos.nuevaHistorica')}
          orden={siguienteOrden(historicas)}
          anterior={null}
          alSubir={(nueva) => reemplazar(null, nueva)}
        />
      </section>
    </section>
  )
}
