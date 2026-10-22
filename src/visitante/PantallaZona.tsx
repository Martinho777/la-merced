import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Image } from 'lucide-react'
import { fotoLocalDeZona } from '@/assets/zonas'
import { Boton } from '@/componentes/Boton'
import { GrupoOpciones } from '@/componentes/GrupoOpciones'
import type { Opcion } from '@/componentes/opciones'
import { obtenerZonas, type ResumenZona } from '@/datos/zonas'
import { idiomaActual } from '@/i18n'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import { rutaConZona } from '@/visitante/camara'
import { puedeElegirse, zonaInicial } from '@/visitante/zonas'
import type es from '@/i18n/es.json'
import '@/visitante/pantalla.css'
import './PantallaZona.css'

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; zonas: ResumenZona[] }

type ClaveZona = `zonas.${keyof typeof es.zonas}`

/**
 * Imagen de la zona: la ilustración de la base si existe; si no, la foto local de
 * src/assets/zonas/; si tampoco hay, una caja de reemplazo.
 */
function ImagenZona({ zona, textoPendiente }: { zona: ResumenZona; textoPendiente: string }) {
  const idioma = idiomaActual()
  const fotoLocal = fotoLocalDeZona(zona.slug)

  if (zona.ilustracion) {
    return (
      <span className="zona-imagen">
        <img
          src={zona.ilustracion.url}
          alt={
            zona.ilustracion.textoAlternativo[idioma] ?? zona.ilustracion.textoAlternativo.es ?? ''
          }
        />
      </span>
    )
  }

  if (fotoLocal) {
    // Decorativa: el título de la tarjeta ya nombra la zona y la imagen va dentro de la etiqueta
    // del radio, así que un alt solo repetiría el nombre al lector de pantalla.
    return (
      <span className="zona-imagen">
        <picture>
          <source type="image/avif" srcSet={fotoLocal.avif} />
          <img className="zona-imagen__foto" src={fotoLocal.webp} alt="" decoding="async" />
        </picture>
      </span>
    )
  }

  return (
    <span className="zona-imagen">
      <Image className="zona-imagen__icono" aria-hidden="true" />
      <span className="visualmente-oculto">{textoPendiente}</span>
    </span>
  )
}

/** Pantalla 4 (/zona): zonas y número de puntos desde la base; las no disponibles no se eligen. */
export function PantallaZona() {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [zona, setZona] = useState<string | null>(null)
  // Cada intento dispara una nueva carga; "Reintentar" lo incrementa.
  const [intento, setIntento] = useState(0)

  useEffect(() => {
    let vigente = true
    obtenerZonas()
      .then((zonas) => {
        if (!vigente) return
        setEstado({ tipo: 'listo', zonas })
        setZona(zonaInicial(zonas))
      })
      .catch(() => vigente && setEstado({ tipo: 'error' }))
    return () => {
      vigente = false
    }
  }, [intento])

  function reintentar() {
    setEstado({ tipo: 'cargando' })
    setIntento((n) => n + 1)
  }

  const zonas = estado.tipo === 'listo' ? estado.zonas : []

  const opciones: Opcion<string>[] = zonas.map((z) => ({
    valor: z.slug,
    titulo: t(`zonas.${z.slug}` as ClaveZona, { defaultValue: z.slug }),
    subtitulo: z.disponible ? t('zona.puntos', { count: z.totalPuntos }) : undefined,
    contenido: <ImagenZona zona={z} textoPendiente={t('zona.sinImagen')} />,
    etiquetaNoDisponible: z.disponible ? undefined : t('comun.proximamente'),
    destacada: z.disponible,
  }))

  return (
    <div className="pantalla">
      <BarraVisitante
        volverA="/ruta"
        etiqueta={t('navegacion.ruta')}
        etiquetaAccesible={t('navegacion.volverARuta')}
      />
      <div className="pantalla__cuerpo">
        <h1 className="pantalla__titulo texto-title-1">{t('zona.titulo')}</h1>

        {estado.tipo === 'cargando' && (
          <p className="pantalla__estado pantalla__texto texto-body" role="status">
            {t('comun.cargando')}
          </p>
        )}

        {estado.tipo === 'error' && (
          <div className="pantalla__estado" role="alert">
            <p className="pantalla__error texto-body">{t('zona.error')}</p>
            <Boton variante="secundario" tamano="sm" onClick={reintentar}>
              {t('comun.reintentar')}
            </Boton>
          </div>
        )}

        {estado.tipo === 'listo' && (
          <GrupoOpciones
            leyenda={t('zona.titulo')}
            nombre="zona"
            disposicion="cuadricula"
            valor={zona}
            onCambiar={(slug) => puedeElegirse(zonas, slug) && setZona(slug)}
            opciones={opciones}
          />
        )}
      </div>
      <div className="pantalla__acciones">
        <Boton
          anchoCompleto
          disabled={zona === null}
          onClick={() => zona && navegar(rutaConZona('/camara', zona))}
        >
          {t('comun.continuar')}
        </Boton>
      </div>
    </div>
  )
}
