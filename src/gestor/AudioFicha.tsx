import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Upload } from 'lucide-react'
import { BarraProgreso } from '@/componentes/BarraProgreso'
import { Boton } from '@/componentes/Boton'
import { quitarAudioFicha, subirAudioFicha } from '@/datos/audios'
import type { FichaGestor } from '@/datos/gestor'
import { ErrorSubida } from '@/datos/subida'
import { ErrorAudio, prepararAudio, TIPOS_AUDIO_ACEPTADOS } from '@/gestor/audio'
import { Campo } from '@/gestor/componentes/Campo'
import type { IdiomaGestor } from '@/gestor/editor'
import { formatearTiempo } from '@/visitante/audio'

type Aviso =
  | 'subido'
  | 'quitado'
  | 'errorFormato'
  | 'errorTamano'
  | 'errorPermiso'
  | 'errorConexion'
  | 'errorIdioma'
  | 'errorSubir'
  | 'errorQuitar'
  | null

/** Mensaje para un error al subir: lo que dijo el navegador o el servidor. */
function avisoDeError(e: unknown): Aviso {
  if (e instanceof ErrorAudio) return e.motivo === 'formato' ? 'errorFormato' : 'errorTamano'
  if (e instanceof ErrorSubida) {
    if (e.motivo === 'tamano') return 'errorTamano'
    if (e.motivo === 'formato') return 'errorFormato'
    if (e.motivo === 'permiso') return 'errorPermiso'
    if (e.motivo === 'conexion') return 'errorConexion'
  }
  // La base rechaza un audio de otro idioma o de otro punto (validar_audio_de_ficha).
  if (e instanceof Error && /audio es en|otro punto|no es un audio/i.test(e.message)) {
    return 'errorIdioma'
  }
  return 'errorSubir'
}

/**
 * Narración de la ficha del idioma elegido: se sube un MP3 o M4A, se escucha aquí antes de enviarla a
 * revisión, y se puede reemplazar o quitar. Necesita que la ficha ya exista.
 */
export function AudioFicha({
  punto,
  idioma,
  ficha,
  alCambiarFicha,
}: {
  punto: { id: string; slug: string }
  idioma: IdiomaGestor
  ficha: FichaGestor | null
  alCambiarFicha: (ficha: FichaGestor) => void
}) {
  const { t } = useTranslation('gestor')
  const [ocupado, setOcupado] = useState<'subir' | 'quitar' | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [aviso, setAviso] = useState<Aviso>(null)
  const [progreso, setProgreso] = useState<number | null>(null)
  // Cambiar la clave vacía el selector de archivo después de subir.
  const [claveArchivo, setClaveArchivo] = useState(0)
  const nombreIdioma = t(`idiomas.${idioma}`).toLowerCase()

  async function subir(archivo: File | undefined) {
    if (!archivo || !ficha) return
    setAviso(null)
    setOcupado('subir')
    setProgreso(0)
    try {
      const preparado = await prepararAudio(archivo)
      alCambiarFicha(await subirAudioFicha(punto, idioma, ficha, preparado, setProgreso))
      setAviso('subido')
    } catch (e) {
      setAviso(avisoDeError(e))
    } finally {
      setOcupado(null)
      setProgreso(null)
      setClaveArchivo((n) => n + 1)
    }
  }

  async function quitar() {
    if (!ficha) return
    setOcupado('quitar')
    try {
      alCambiarFicha(await quitarAudioFicha(ficha))
      setAviso('quitado')
    } catch {
      setAviso('errorQuitar')
    } finally {
      setOcupado(null)
      setConfirmando(false)
    }
  }

  const bueno = aviso === 'subido' || aviso === 'quitado'
  const duracion = formatearTiempo(ficha?.audio?.duracionS)

  return (
    <section className="gestor__seccion" aria-labelledby="audio-titulo">
      <div className="gestor__titulos">
        <h2 id="audio-titulo" className="gestor__subtitulo texto-title-2">
          {t('audio.titulo', { idioma: nombreIdioma })}
        </h2>
        <p className="gestor__texto texto-body">{t('audio.texto')}</p>
      </div>

      {!ficha ? (
        <p className="gestor__texto texto-body">{t('audio.sinFicha', { idioma: nombreIdioma })}</p>
      ) : (
        <div className="gestor__foto">
          {ficha.audio ? (
            <>
              {/* Para escucharla antes de enviarla a revisión. */}
              <audio
                className="gestor__audio"
                src={ficha.audio.url}
                controls
                preload="metadata"
                aria-label={t('audio.escuchar', { idioma: nombreIdioma })}
              />
              {duracion && (
                <p className="gestor__texto texto-small">{t('audio.duracion', { duracion })}</p>
              )}
            </>
          ) : (
            <p className="gestor__texto texto-body">{t('audio.vacio')}</p>
          )}

          <Campo
            key={claveArchivo}
            etiqueta={ficha.audio ? t('audio.reemplazar') : t('audio.subir')}
            ayuda={t('audio.archivoAyuda')}
            type="file"
            accept={TIPOS_AUDIO_ACEPTADOS.join(',')}
            disabled={ocupado !== null}
            onChange={(e) => void subir(e.target.files?.[0])}
          />
          {ocupado === 'subir' && (
            <>
              <p className="gestor__texto texto-small" role="status">
                <Upload className="gestor__icono-linea" aria-hidden="true" />
                {t('audio.subiendo')}
              </p>
              <BarraProgreso
                valor={Math.round((progreso ?? 0) * 100)}
                maximo={100}
                contador={t('audio.porcentaje', { porcentaje: Math.round((progreso ?? 0) * 100) })}
                etiquetaAccesible={t('audio.progreso')}
              />
            </>
          )}
          {ficha.estado === 'aprobado' && (
            <p className="gestor__texto texto-small">{t('audio.vuelveARevision')}</p>
          )}

          {ficha.audio && (
            <div className="gestor__pestanas">
              {confirmando ? (
                <>
                  <Boton
                    variante="fantasma"
                    destructivo
                    tamano="sm"
                    icono={Trash2}
                    cargando={ocupado === 'quitar'}
                    onClick={() => void quitar()}
                  >
                    {t('audio.confirmarQuitar')}
                  </Boton>
                  <Boton variante="secundario" tamano="sm" onClick={() => setConfirmando(false)}>
                    {t('audio.cancelar')}
                  </Boton>
                </>
              ) : (
                <Boton
                  variante="fantasma"
                  destructivo
                  tamano="sm"
                  icono={Trash2}
                  disabled={ocupado !== null}
                  onClick={() => setConfirmando(true)}
                >
                  {t('audio.quitar')}
                </Boton>
              )}
            </div>
          )}

          {aviso && (
            <p
              className={bueno ? 'gestor__texto texto-body' : 'gestor__error texto-body'}
              role={bueno ? 'status' : 'alert'}
            >
              {t(`audio.${aviso}`)}
            </p>
          )}
        </div>
      )}
    </section>
  )
}
