import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImageUp } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { cambiarMapaDeZona, problemaDeMapa, TIPOS_MAPA } from '@/datos/mapas'
import { Campo } from '@/gestor/componentes/Campo'
import { marcarCambiosSinPublicar } from '@/gestor/publicacionPendiente'

type Imagen = { archivo: File; ancho: number; alto: number }

/** Lee el tamaño real de la imagen elegida (null si el navegador no puede abrirla). */
async function medirImagen(archivo: File): Promise<Imagen | null> {
  try {
    const mapa = await createImageBitmap(archivo)
    const imagen = { archivo, ancho: mapa.width, alto: mapa.height }
    mapa.close()
    return imagen
  } catch {
    return null
  }
}

/**
 * «Cambiar la imagen del mapa» de una zona (solo admin): elegir la imagen, comprobar que es 2:1 antes de
 * subirla y pedir su descripción para lectores de pantalla.
 */
export function CambiarMapa({
  zona,
  nombreZona,
  descripcionActual,
  deshabilitado,
  alCambiar,
}: {
  zona: string
  nombreZona: string
  descripcionActual: string
  deshabilitado: boolean
  alCambiar: (url: string, descripcion: string) => void
}) {
  const { t } = useTranslation('gestor')
  const [abierto, setAbierto] = useState(false)
  const [imagen, setImagen] = useState<Imagen | null>(null)
  const [ilegible, setIlegible] = useState(false)
  const [descripcion, setDescripcion] = useState(descripcionActual)
  const [avance, setAvance] = useState<number | null>(null)
  const [aviso, setAviso] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null)

  const problema = imagen
    ? problemaDeMapa({
        tipo: imagen.archivo.type,
        ancho: imagen.ancho,
        alto: imagen.alto,
        descripcion,
      })
    : null
  const subiendo = avance !== null

  if (!abierto) {
    return (
      <div className="ubicacion__mapa">
        <Boton
          tamano="sm"
          variante="secundario"
          icono={ImageUp}
          disabled={deshabilitado}
          onClick={() => {
            setAbierto(true)
            setDescripcion(descripcionActual)
            setAviso(null)
          }}
        >
          {t('mapa.abrir')}
        </Boton>
        {aviso?.tipo === 'exito' && (
          <p className="gestor__texto texto-small" role="status">
            {aviso.texto}
          </p>
        )}
      </div>
    )
  }

  async function subir() {
    if (!imagen || problema) return
    setAvance(0)
    setAviso(null)
    try {
      const url = await cambiarMapaDeZona(
        {
          zonaSlug: zona,
          archivo: imagen.archivo,
          tipo: imagen.archivo.type,
          ancho: imagen.ancho,
          alto: imagen.alto,
          descripcion,
        },
        setAvance,
      )
      alCambiar(url, descripcion.trim())
      marcarCambiosSinPublicar()
      setAviso({ tipo: 'exito', texto: t('mapa.listo') })
      setImagen(null)
      setAbierto(false)
    } catch (error) {
      setAviso({ tipo: 'error', texto: t('mapa.error', { mensaje: (error as Error).message }) })
    } finally {
      setAvance(null)
    }
  }

  return (
    <form
      className="ubicacion__mapa ubicacion__mapa--abierto"
      onSubmit={(evento) => {
        evento.preventDefault()
        void subir()
      }}
    >
      <h3 className="gestor__subtitulo texto-body-strong">
        {t('mapa.titulo', { zona: nombreZona })}
      </h3>
      <p className="gestor__texto texto-small">{t('mapa.ayuda')}</p>
      <Campo
        etiqueta={t('mapa.archivo')}
        type="file"
        accept={Object.keys(TIPOS_MAPA).join(',')}
        disabled={subiendo}
        error={
          ilegible
            ? t('mapa.problema.ilegible')
            : problema === 'formato'
              ? t('mapa.problema.formato')
              : problema === 'proporcion' && imagen
                ? t('mapa.problema.proporcion', { ancho: imagen.ancho, alto: imagen.alto })
                : undefined
        }
        onChange={async (evento) => {
          const archivo = evento.target.files?.[0]
          setAviso(null)
          if (!archivo) {
            setImagen(null)
            return
          }
          const medida = await medirImagen(archivo)
          setIlegible(medida === null)
          setImagen(medida)
        }}
      />
      <Campo
        etiqueta={t('mapa.descripcion')}
        ayuda={t('mapa.descripcionAyuda')}
        value={descripcion}
        disabled={subiendo}
        error={problema === 'sinDescripcion' ? t('mapa.problema.sinDescripcion') : undefined}
        onChange={(evento) => setDescripcion(evento.target.value)}
      />
      {subiendo && (
        <p className="gestor__texto texto-small" role="status">
          {t('mapa.subiendo', { porcentaje: Math.round((avance ?? 0) * 100) })}
        </p>
      )}
      {aviso?.tipo === 'error' && (
        <p className="gestor__error texto-small" role="alert">
          {aviso.texto}
        </p>
      )}
      <div className="gestor__pestanas">
        <Boton
          type="submit"
          tamano="sm"
          cargando={subiendo}
          disabled={!imagen || problema !== null}
        >
          {t('mapa.subir')}
        </Boton>
        <Boton
          type="button"
          tamano="sm"
          variante="secundario"
          disabled={subiendo}
          onClick={() => {
            setAbierto(false)
            setImagen(null)
            setIlegible(false)
            setAviso(null)
          }}
        >
          {t('mapa.cancelar')}
        </Boton>
      </div>
    </form>
  )
}
