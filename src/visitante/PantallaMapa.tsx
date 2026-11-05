import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { Image } from 'lucide-react'
import { ilustracionLocalDeZona } from '@/assets/zonas'
import { BarraProgreso } from '@/componentes/BarraProgreso'
import { Boton } from '@/componentes/Boton'
import { MarcadorPunto, MuestraMarcador } from '@/componentes/MarcadorPunto'
import { Santi } from '@/componentes/Santi/Santi'
import { SantiBurbuja } from '@/componentes/SantiBurbuja'
import type { PuntoConFicha } from '@/datos/puntos'
import { idiomaActual } from '@/i18n'
import type es from '@/i18n/es.json'
import { leerRuta, RUTA_POR_DEFECTO } from '@/lib/preferencias'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import { zonaDeBusqueda } from '@/visitante/camara'
import { ControlesMapa } from '@/visitante/ControlesMapa'
import {
  alternarZoom,
  enfocarPunto,
  escalas,
  FACTOR_CONTROL,
  mismaVista,
  mover,
  PROPORCION,
  reajustar,
  traerAVista,
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
import { esperaTrasEnfocar, useMovimientoReducido } from '@/visitante/movimiento'
import {
  leerSesionMapa,
  recordarSeleccion,
  recordarVista,
  type Seleccion,
} from '@/visitante/sesionMapa'
import { useRecorrido } from '@/visitante/useRecorrido'
import '@/visitante/pantalla.css'
import './PantallaMapa.css'

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

/** Captura un dedo si sigue activo: el navegador lanza un error si ya se levantó. */
function capturar(elemento: Element, idPuntero: number) {
  try {
    elemento.setPointerCapture(idPuntero)
  } catch {
    // Ese dedo ya no está; el gesto sigue con los demás.
  }
}

/**
 * Pantalla 7 (/mapa?zona=…): la ilustración de la zona con sus puntos. Un dedo mueve, dos dedos
 * acercan o alejan (pellizcar) y el doble toque alterna entre la fachada entera y la vista que llena
 * el lienzo; también hay botones para todo eso. Tocar un punto lo selecciona, acerca el mapa y, tras
 * dejar ver el acercamiento, abre su pantalla. Debajo, la leyenda y Santi indicando el siguiente
 * punto de la ruta elegida.
 */
export function PantallaMapa() {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const slug = zonaDeBusqueda(parametros)
  const idioma = idiomaActual()
  const [ruta] = useState(() => leerRuta() ?? RUTA_POR_DEFECTO)
  const movimientoReducido = useMovimientoReducido()
  const { estado, reintentar } = useRecorrido(slug, idioma)

  const lienzoRef = useRef<HTMLDivElement>(null)
  const medidas = useRef<Lienzo>({ ancho: 0, alto: 0 })
  const [lienzo, setLienzo] = useState<Lienzo>({ ancho: 0, alto: 0 })
  const [paginaConScroll, setPaginaConScroll] = useState(false)
  const [vista, setVista] = useState<Vista | null>(null)
  const vistaActual = useRef<Vista | null>(null)
  // Solo los cambios automáticos se animan; los gestos siguen al dedo.
  const [animada, setAnimada] = useState(false)
  const [seleccion, setSeleccion] = useState<Seleccion | null>(() =>
    slug ? leerSesionMapa(slug).seleccion : null,
  )
  // Espera entre el acercamiento a un punto y abrir su pantalla.
  const espera = useRef<number | undefined>(undefined)

  // Gestos: dedos apoyados, si el gesto ya es un arrastre (para no abrir un punto al soltar) y el
  // último toque (para el doble toque).
  const punteros = useRef(new Map<number, Posicion>())
  const gesto = useRef({ inicio: { x: 0, y: 0 }, arrastre: false })
  const ultimoToque = useRef<{ tiempo: number; posicion: Posicion } | null>(null)

  // Medidas del lienzo: la primera vez se restaura la vista de la sesión o se encuadra la fachada;
  // después (girar, teclado, algo que aparece alrededor) se conserva el mismo lugar en el centro.
  useEffect(() => {
    const elemento = lienzoRef.current
    if (!elemento) return
    const observador = new ResizeObserver(([entrada]) => {
      if (!entrada) return
      const nuevas = { ancho: entrada.contentRect.width, alto: entrada.contentRect.height }
      const anteriores = medidas.current
      medidas.current = nuevas
      setLienzo(nuevas)
      setPaginaConScroll(document.documentElement.scrollHeight > window.innerHeight)
      setAnimada(false)
      setVista((actual) => {
        if (actual) return reajustar(actual, anteriores, nuevas)
        const sesion = slug ? leerSesionMapa(slug) : null
        if (!sesion?.vista) return vistaInicial(nuevas)
        const restaurada = reajustar(sesion.vista.valor, sesion.vista.lienzo, nuevas)
        // La selección pudo cambiar con Anterior/Siguiente en la ficha: que se vea al volver.
        return sesion.seleccion
          ? traerAVista(restaurada, nuevas, sesion.seleccion.x, sesion.seleccion.y)
          : restaurada
      })
    })
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [slug])

  // Rueda del ratón o pellizco del touchpad (escritorio). Listener nativo porque el de React es
  // pasivo: solo se bloquea el scroll de la página si de verdad cambió el zoom, no en los límites.
  useEffect(() => {
    const elemento = lienzoRef.current
    if (!elemento) return
    function alGirarRueda(evento: WheelEvent) {
      const actual = vistaActual.current
      if (!actual) return
      const caja = elemento!.getBoundingClientRect()
      const sensibilidad = evento.ctrlKey ? 0.01 : 0.0015
      const nueva = zoomEn(
        actual,
        medidas.current,
        { x: evento.clientX - caja.left, y: evento.clientY - caja.top },
        Math.exp(-evento.deltaY * sensibilidad),
      )
      if (nueva.escala === actual.escala) return
      evento.preventDefault()
      window.clearTimeout(espera.current)
      vistaActual.current = nueva
      setAnimada(false)
      setVista(nueva)
    }
    elemento.addEventListener('wheel', alGirarRueda, { passive: false })
    return () => elemento.removeEventListener('wheel', alGirarRueda)
  }, [])

  useEffect(() => {
    vistaActual.current = vista
    if (slug && vista) recordarVista(slug, vista, medidas.current)
  }, [slug, vista])

  useEffect(() => () => window.clearTimeout(espera.current), [])

  if (!slug || estado.tipo === 'sinZona') return <Navigate to="/zona" replace />

  function posicionEnLienzo(evento: { clientX: number; clientY: number }): Posicion {
    const caja = lienzoRef.current?.getBoundingClientRect()
    return { x: evento.clientX - (caja?.left ?? 0), y: evento.clientY - (caja?.top ?? 0) }
  }

  function alApoyar(evento: PointerEvent<HTMLDivElement>) {
    // Tocar el mapa mientras se acerca a un punto cancela la apertura: el visitante sigue explorando.
    window.clearTimeout(espera.current)
    const posicion = posicionEnLienzo(evento)
    punteros.current.set(evento.pointerId, posicion)
    if (punteros.current.size === 1) {
      gesto.current = { inicio: posicion, arrastre: false }
    } else if (punteros.current.size === 2) {
      // Pellizco: el lienzo se queda con los dos dedos aunque salgan de él.
      gesto.current.arrastre = true
      setAnimada(false)
      for (const id of punteros.current.keys()) capturar(evento.currentTarget, id)
    }
  }

  function alMover(evento: PointerEvent<HTMLDivElement>) {
    const anterior = punteros.current.get(evento.pointerId)
    if (!anterior) return
    const actual = posicionEnLienzo(evento)
    const medido = medidas.current

    if (punteros.current.size === 1) {
      if (!gesto.current.arrastre) {
        if (distancia(actual, gesto.current.inicio) < UMBRAL_ARRASTRE) return
        // Ya es un arrastre: el lienzo se queda con el dedo aunque salga de él.
        gesto.current.arrastre = true
        setAnimada(false)
        capturar(evento.currentTarget, evento.pointerId)
      }
      setVista((v) => v && mover(v, medido, actual.x - anterior.x, actual.y - anterior.y))
    } else if (punteros.current.size === 2) {
      const otro = [...punteros.current].find(([id]) => id !== evento.pointerId)?.[1]
      if (!otro) return
      const medioAntes = puntoMedio(anterior, otro)
      const medioAhora = puntoMedio(actual, otro)
      const factor = distancia(actual, otro) / Math.max(1, distancia(anterior, otro))
      setVista(
        (v) =>
          v &&
          mover(
            zoomEn(v, medido, medioAntes, factor),
            medido,
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
    // Sobre un marcador, el toque es para seleccionarlo; no cuenta para el doble toque.
    if (evento.target instanceof Element && evento.target.closest('.marcador')) return

    // Fue un toque: si es el segundo seguido en el mismo lugar, doble toque.
    const posicion = posicionEnLienzo(evento)
    const ultimo = ultimoToque.current
    if (
      ultimo &&
      evento.timeStamp - ultimo.tiempo < DOBLE_TOQUE_MS &&
      distancia(posicion, ultimo.posicion) < DOBLE_TOQUE_DISTANCIA
    ) {
      ultimoToque.current = null
      aplicarAnimada((v) => alternarZoom(v, medidas.current, posicion))
    } else {
      ultimoToque.current = { tiempo: evento.timeStamp, posicion }
    }
  }

  // El navegador interrumpió el gesto (p. ej. tomó el scroll de la página): no fue un toque.
  function alCancelar(evento: PointerEvent<HTMLDivElement>) {
    punteros.current.delete(evento.pointerId)
  }

  // Tras un arrastre, el clic que llega al soltar no abre el punto que quedó debajo del dedo. Los
  // clics de teclado (`detail` 0) nunca vienen de un arrastre.
  function alHacerClic(evento: {
    detail: number
    preventDefault(): void
    stopPropagation(): void
  }) {
    if (!gesto.current.arrastre || evento.detail === 0) return
    gesto.current.arrastre = false
    evento.preventDefault()
    evento.stopPropagation()
  }

  // Con teclado: si el punto enfocado quedó fuera de la vista, se trae al centro.
  function alEnfocar(evento: { target: EventTarget }) {
    const elemento = lienzoRef.current
    if (!elemento || !(evento.target instanceof HTMLElement)) return
    const caja = elemento.getBoundingClientRect()
    const punto = evento.target.getBoundingClientRect()
    const dentro =
      punto.left >= caja.left &&
      punto.right <= caja.right &&
      punto.top >= caja.top &&
      punto.bottom <= caja.bottom
    if (dentro) return
    const dx = caja.left + caja.width / 2 - (punto.left + punto.width / 2)
    const dy = caja.top + caja.height / 2 - (punto.top + punto.height / 2)
    setAnimada(false)
    setVista((v) => v && mover(v, medidas.current, dx, dy))
  }

  function aplicarAnimada(cambio: (v: Vista) => Vista) {
    setAnimada(true)
    setVista((v) => v && cambio(v))
  }

  function seleccionar(punto: { slug: string; pos_x: number; pos_y: number }) {
    if (!slug) return
    const elegido = { slug: punto.slug, x: punto.pos_x, y: punto.pos_y }
    window.clearTimeout(espera.current)
    setSeleccion(elegido)
    recordarSeleccion(slug, elegido)
    aplicarAnimada((v) => enfocarPunto(v, medidas.current, elegido.x, elegido.y))
    espera.current = window.setTimeout(
      () => navegar(rutaDePunto(slug, punto.slug)),
      esperaTrasEnfocar(movimientoReducido),
    )
  }

  function acercarOAlejar(factor: number) {
    window.clearTimeout(espera.current)
    const { ancho, alto } = medidas.current
    aplicarAnimada((v) => zoomEn(v, medidas.current, { x: ancho / 2, y: alto / 2 }, factor))
  }

  function restablecer() {
    window.clearTimeout(espera.current)
    aplicarAnimada(() => vistaInicial(medidas.current))
  }

  const puntos = estado.tipo === 'listo' ? estado.recorrido.puntos : []
  const siguiente = siguientePunto(puntos, ruta, NINGUNO_VISITADO)
  const avance = progreso(puntos, ruta, NINGUNO_VISITADO)

  // La ilustración de la base gana; si no hay, la local (src/assets/zonas/).
  const urlIlustracion = estado.tipo === 'listo' ? estado.recorrido.zona.urlIlustracion : null
  const ilustracion = urlIlustracion
    ? { src: urlIlustracion, srcSet: undefined }
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

  const limites = escalas(lienzo)
  const sinRecorridoVertical =
    vista !== null && (lienzo.ancho / PROPORCION) * vista.escala <= lienzo.alto + 0.5
  const clasesLienzo = [
    'mapa__lienzo',
    paginaConScroll && sinRecorridoVertical && 'mapa__lienzo--deja-scroll',
  ]
    .filter(Boolean)
    .join(' ')

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
          className={clasesLienzo}
          ref={lienzoRef}
          onPointerDown={alApoyar}
          onPointerMove={alMover}
          onPointerUp={alSoltar}
          onPointerCancel={alCancelar}
          onClickCapture={alHacerClic}
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
            <>
              <div
                className={
                  animada && !movimientoReducido
                    ? 'mapa__escena mapa__escena--animada'
                    : 'mapa__escena'
                }
                style={estiloEscena}
              >
                {ilustracion ? (
                  // Decorativa: los puntos llevan su propio nombre accesible.
                  <img
                    className="mapa__ilustracion"
                    src={ilustracion.src}
                    srcSet={ilustracion.srcSet}
                    sizes={`${Math.round(lienzo.ancho * vista.escala)}px`}
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
                    seleccionado={punto.slug === seleccion?.slug}
                    x={punto.pos_x}
                    y={punto.pos_y}
                    etiquetaAccesible={etiquetaDe(punto)}
                    onPresionar={() => seleccionar(punto)}
                  />
                ))}
              </div>
              <ControlesMapa
                puedeAcercar={vista.escala < limites.maxima - 0.001}
                puedeAlejar={vista.escala > limites.contener + 0.001}
                puedeRestablecer={!mismaVista(vista, vistaInicial(lienzo))}
                onAcercar={() => acercarOAlejar(FACTOR_CONTROL)}
                onAlejar={() => acercarOAlejar(1 / FACTOR_CONTROL)}
                onRestablecer={restablecer}
              />
            </>
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
