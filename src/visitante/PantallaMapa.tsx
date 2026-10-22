import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  type WheelEvent,
} from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { Image } from 'lucide-react'
import { ilustracionLocalDeZona } from '@/assets/zonas'
import { BarraProgreso } from '@/componentes/BarraProgreso'
import { Boton } from '@/componentes/Boton'
import { MarcadorPunto, MuestraMarcador } from '@/componentes/MarcadorPunto'
import { Santi } from '@/componentes/Santi/Santi'
import { SantiBurbuja } from '@/componentes/SantiBurbuja'
import { obtenerPuntosDeZona, type PuntoConFicha } from '@/datos/puntos'
import { obtenerZona, type ZonaConContorno } from '@/datos/zonas'
import { idiomaActual } from '@/i18n'
import type es from '@/i18n/es.json'
import { leerRuta, RUTA_POR_DEFECTO } from '@/lib/preferencias'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import { zonaDeBusqueda } from '@/visitante/camara'
import {
  acotar,
  alternarZoom,
  mover,
  vistaInicial,
  zoomEn,
  type Lienzo,
  type Vista,
} from '@/visitante/gestos'
import {
  estadoDePunto,
  progreso,
  puntosConPosicion,
  rutaDePunto,
  siguientePunto,
} from '@/visitante/mapa'
import '@/visitante/pantalla.css'
import './PantallaMapa.css'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'sinZona' }
  | { tipo: 'listo'; zona: ZonaConContorno; puntos: PuntoConFicha[] }

type ClaveZona = `zonas.${keyof typeof es.zonas}`
type Posicion = { x: number; y: number }

// Todavía no hay ficha de punto que marque visitas: por ahora ninguno está visitado.
const NINGUNO_VISITADO: ReadonlySet<string> = new Set()

/** Píxeles que hay que mover un dedo para que deje de ser un toque y pase a ser un arrastre. */
const UMBRAL_ARRASTRE = 8
/** Dos toques en este tiempo (ms) y a esta distancia (px) son un doble toque. */
const DOBLE_TOQUE_MS = 300
const DOBLE_TOQUE_DISTANCIA = 30

const distancia = (a: Posicion, b: Posicion) => Math.hypot(a.x - b.x, a.y - b.y)
const puntoMedio = (a: Posicion, b: Posicion) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/**
 * Pantalla 7 (/mapa?zona=…): la ilustración de la zona con sus puntos. Un dedo mueve, dos dedos
 * acercan o alejan (pellizcar), doble toque alterna entre la fachada entera y la vista que llena el
 * lienzo. Debajo, la leyenda y Santi indicando el siguiente punto de la ruta elegida. Tocar un punto
 * lleva a su ficha (por ahora "En construcción").
 */
export function PantallaMapa() {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const slug = zonaDeBusqueda(parametros)
  const idioma = idiomaActual()
  const [ruta] = useState(() => leerRuta() ?? RUTA_POR_DEFECTO)

  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)

  const lienzoRef = useRef<HTMLDivElement>(null)
  const medidas = useRef<Lienzo>({ ancho: 0, alto: 0 })
  const [vista, setVista] = useState<Vista | null>(null)
  // Ancho del lienzo para `sizes` de la ilustración (las medidas del ref no se leen al renderizar).
  const [anchoLienzo, setAnchoLienzo] = useState(0)

  // Gestos: dedos apoyados, si el gesto ya es un arrastre (para no abrir un punto al soltar) y el
  // último toque (para el doble toque).
  const punteros = useRef(new Map<number, Posicion>())
  const gesto = useRef({ inicio: { x: 0, y: 0 }, arrastre: false })
  const ultimoToque = useRef<{ tiempo: number; posicion: Posicion } | null>(null)

  // Al cambiar de idioma se vuelven a pedir los puntos (los nombres cambian); mientras tanto se
  // sigue mostrando el mapa anterior.
  useEffect(() => {
    if (!slug) return
    let vigente = true
    Promise.all([obtenerZona(slug), obtenerPuntosDeZona(slug, idioma)])
      .then(([zona, puntos]) => {
        if (vigente) setEstado(zona ? { tipo: 'listo', zona, puntos } : { tipo: 'sinZona' })
      })
      .catch(() => vigente && setEstado({ tipo: 'error' }))
    return () => {
      vigente = false
    }
  }, [slug, idioma, intento])

  // Medidas del lienzo: la primera vez se encuadra la fachada; después (girar, teclado) se ajusta.
  useEffect(() => {
    const lienzo = lienzoRef.current
    if (!lienzo) return
    const observador = new ResizeObserver(([entrada]) => {
      if (!entrada) return
      const nuevas = { ancho: entrada.contentRect.width, alto: entrada.contentRect.height }
      const primeraVez = medidas.current.ancho === 0
      medidas.current = nuevas
      setAnchoLienzo(nuevas.ancho)
      setVista((actual) => (primeraVez || !actual ? vistaInicial(nuevas) : acotar(actual, nuevas)))
    })
    observador.observe(lienzo)
    return () => observador.disconnect()
  }, [])

  if (!slug || estado.tipo === 'sinZona') return <Navigate to="/zona" replace />

  function posicionEnLienzo(evento: { clientX: number; clientY: number }): Posicion {
    const caja = lienzoRef.current?.getBoundingClientRect()
    return { x: evento.clientX - (caja?.left ?? 0), y: evento.clientY - (caja?.top ?? 0) }
  }

  function alApoyar(evento: PointerEvent<HTMLDivElement>) {
    const posicion = posicionEnLienzo(evento)
    punteros.current.set(evento.pointerId, posicion)
    if (punteros.current.size === 1) gesto.current = { inicio: posicion, arrastre: false }
  }

  function alMover(evento: PointerEvent<HTMLDivElement>) {
    const anterior = punteros.current.get(evento.pointerId)
    if (!anterior) return
    const actual = posicionEnLienzo(evento)
    const lienzo = medidas.current

    if (punteros.current.size === 1) {
      if (!gesto.current.arrastre) {
        if (distancia(actual, gesto.current.inicio) < UMBRAL_ARRASTRE) return
        // Ya es un arrastre: el lienzo se queda con el dedo aunque salga de él.
        gesto.current.arrastre = true
        evento.currentTarget.setPointerCapture(evento.pointerId)
      }
      setVista((v) => v && mover(v, lienzo, actual.x - anterior.x, actual.y - anterior.y))
    } else if (punteros.current.size === 2) {
      const otro = [...punteros.current].find(([id]) => id !== evento.pointerId)?.[1]
      if (!otro) return
      gesto.current.arrastre = true
      const medioAntes = puntoMedio(anterior, otro)
      const medioAhora = puntoMedio(actual, otro)
      const factor = distancia(actual, otro) / Math.max(1, distancia(anterior, otro))
      setVista(
        (v) =>
          v &&
          mover(
            zoomEn(v, lienzo, medioAntes, factor),
            lienzo,
            medioAhora.x - medioAntes.x,
            medioAhora.y - medioAntes.y,
          ),
      )
    }
    punteros.current.set(evento.pointerId, actual)
  }

  function alSoltar(evento: PointerEvent<HTMLDivElement>) {
    if (!punteros.current.delete(evento.pointerId) || punteros.current.size > 0) return
    if (gesto.current.arrastre) return

    // Fue un toque: si es el segundo seguido en el mismo lugar, doble toque.
    const posicion = posicionEnLienzo(evento)
    const ultimo = ultimoToque.current
    if (
      ultimo &&
      evento.timeStamp - ultimo.tiempo < DOBLE_TOQUE_MS &&
      distancia(posicion, ultimo.posicion) < DOBLE_TOQUE_DISTANCIA
    ) {
      ultimoToque.current = null
      setVista((v) => v && alternarZoom(v, medidas.current, posicion))
    } else {
      ultimoToque.current = { tiempo: evento.timeStamp, posicion }
    }
  }

  // Tras un arrastre, el clic que llega al soltar no abre el punto que quedó debajo del dedo.
  function alHacerClic(evento: MouseEvent<HTMLDivElement>) {
    if (!gesto.current.arrastre) return
    evento.preventDefault()
    evento.stopPropagation()
  }

  // Rueda del ratón o pellizco del touchpad (escritorio).
  function alGirarRueda(evento: WheelEvent<HTMLDivElement>) {
    const factor = Math.exp(-evento.deltaY * 0.0015)
    const posicion = posicionEnLienzo(evento)
    setVista((v) => v && zoomEn(v, medidas.current, posicion, factor))
  }

  // Con teclado: si el punto enfocado quedó fuera de la vista, se trae al centro.
  function alEnfocar(evento: { target: EventTarget }) {
    const lienzo = lienzoRef.current
    if (!lienzo || !(evento.target instanceof HTMLElement)) return
    const caja = lienzo.getBoundingClientRect()
    const punto = evento.target.getBoundingClientRect()
    const dentro =
      punto.left >= caja.left &&
      punto.right <= caja.right &&
      punto.top >= caja.top &&
      punto.bottom <= caja.bottom
    if (dentro) return
    const dx = caja.left + caja.width / 2 - (punto.left + punto.width / 2)
    const dy = caja.top + caja.height / 2 - (punto.top + punto.height / 2)
    setVista((v) => v && mover(v, medidas.current, dx, dy))
  }

  function reintentar() {
    setEstado({ tipo: 'cargando' })
    setIntento((n) => n + 1)
  }

  const puntos = estado.tipo === 'listo' ? estado.puntos : []
  const siguiente = siguientePunto(puntos, ruta, NINGUNO_VISITADO)
  const avance = progreso(puntos, ruta, NINGUNO_VISITADO)

  // La ilustración de la base gana; si no hay, la local (src/assets/zonas/).
  const ilustracion =
    estado.tipo === 'listo' && estado.zona.urlIlustracion
      ? { src: estado.zona.urlIlustracion, srcSet: undefined }
      : ilustracionLocalDeZona(slug)

  function etiquetaDe(punto: PuntoConFicha) {
    const datos = {
      numero: punto.orden,
      nombre: punto.ficha?.titulo ?? '',
      tipo: t(punto.es_esencial ? 'mapa.tipo.esencial' : 'mapa.tipo.opcional'),
      estado: t(
        estadoDePunto(punto, NINGUNO_VISITADO) === 'visitado'
          ? 'mapa.estado.visitado'
          : 'mapa.estado.noVisitado',
      ),
    }
    return punto.ficha ? t('mapa.marcador', datos) : t('mapa.marcadorSinNombre', datos)
  }

  // Los marcadores se contraescalan para conservar su tamaño (y su área táctil) con cualquier zoom.
  const estiloEscena = vista
    ? ({
        transform: `translate(${vista.x}px, ${vista.y}px) scale(${vista.escala})`,
        '--escala-inversa': 1 / vista.escala,
      } as CSSProperties)
    : undefined

  return (
    <div className="pantalla mapa">
      <BarraVisitante
        volverA="/zona"
        etiqueta={t('navegacion.zonas')}
        etiquetaAccesible={t('navegacion.volverAZonas')}
      />
      <div className="mapa__cuerpo">
        <h1 className="visualmente-oculto">
          {t(`zonas.${slug}` as ClaveZona, { defaultValue: slug })}
        </h1>

        {estado.tipo === 'listo' && (
          <BarraProgreso
            valor={avance.visitados}
            maximo={avance.total}
            contador={t('mapa.progreso', { visitados: avance.visitados, count: avance.total })}
            etiquetaAccesible={t('mapa.progresoAccesible')}
          />
        )}

        <div
          className="mapa__lienzo"
          ref={lienzoRef}
          onPointerDown={alApoyar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alSoltar}
          onClickCapture={alHacerClic}
          onWheel={alGirarRueda}
          onFocus={alEnfocar}
        >
          {estado.tipo === 'cargando' && (
            <p className="mapa__estado texto-body" role="status">
              {t('comun.cargando')}
            </p>
          )}

          {estado.tipo === 'error' && (
            <div className="mapa__estado" role="alert">
              <p className="pantalla__error texto-body">{t('mapa.error')}</p>
              <Boton variante="secundario" tamano="sm" onClick={reintentar}>
                {t('comun.reintentar')}
              </Boton>
            </div>
          )}

          {estado.tipo === 'listo' && vista && (
            <div className="mapa__escena" style={estiloEscena}>
              {ilustracion ? (
                // Decorativa: los puntos llevan su propio nombre accesible.
                <img
                  className="mapa__ilustracion"
                  src={ilustracion.src}
                  srcSet={ilustracion.srcSet}
                  sizes={`${Math.round(anchoLienzo * vista.escala)}px`}
                  alt=""
                  draggable={false}
                  decoding="async"
                />
              ) : (
                <span className="mapa__sin-ilustracion">
                  <Image className="mapa__icono" aria-hidden="true" />
                  <span className="visualmente-oculto">{t('zona.sinImagen')}</span>
                </span>
              )}
              {puntosConPosicion(puntos).map((punto) => (
                <MarcadorPunto
                  key={punto.slug}
                  numero={punto.orden}
                  estado={estadoDePunto(punto, NINGUNO_VISITADO)}
                  siguiente={punto.slug === siguiente?.slug}
                  x={punto.pos_x}
                  y={punto.pos_y}
                  etiquetaAccesible={etiquetaDe(punto)}
                  onPresionar={() => navegar(rutaDePunto(slug, punto.slug))}
                />
              ))}
            </div>
          )}
        </div>

        <ul className="mapa__leyenda" aria-label={t('mapa.leyenda.titulo')}>
          {(['esencial', 'opcional', 'visitado'] as const).map((tipo) => (
            <li key={tipo} className="mapa__leyenda-item texto-small">
              <MuestraMarcador estado={tipo} />
              {t(`mapa.leyenda.${tipo}`)}
            </li>
          ))}
        </ul>

        {estado.tipo === 'listo' && (
          <div className="mapa__santi">
            <Santi pose="head-smile" tamano="sm" />
            <SantiBurbuja cola="izquierda">
              {siguiente
                ? t('mapa.santi.siguiente', { numero: siguiente.orden })
                : t('mapa.santi.libre')}
            </SantiBurbuja>
          </div>
        )}
      </div>
    </div>
  )
}
