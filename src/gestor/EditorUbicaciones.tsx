// Editor de ubicaciones (/gestor/ubicaciones): sobre la ilustración de cada zona, ubicar los puntos,
// marcarlos como esenciales u opcionales y cambiar su orden con «Subir» y «Bajar». Todo vive en un
// borrador local hasta «Guardar cambios»; el borrador es de todas las zonas, así que cambiar de zona no
// pierde nada. Posiciones, clasificación y orden se guardan por separado (ver `guardado.ts`).

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useBlocker } from 'react-router'
import { ArrowDown, ArrowUp, Image, Plus, Trash2 } from 'lucide-react'
import { Boton } from '@/componentes/Boton'
import { Insignia } from '@/componentes/Insignia'
import { Tarjeta } from '@/componentes/Tarjeta'
import { listarPuntosGestor, type PuntoGestor } from '@/datos/gestor'
import type { Rol } from '@/datos/sesion'
import { crearPunto, type PuntoNuevo } from '@/datos/ubicaciones'
import { CambiarMapa } from '@/gestor/CambiarMapa'
import { EncabezadoSeccion } from '@/gestor/IntroSanti'
import { marcarCambiosSinPublicar } from '@/gestor/publicacionPendiente'
import { obtenerZonas } from '@/datos/zonas'
import { MarcadorEditable } from '@/gestor/componentes/MarcadorEditable'
import {
  aplicarCambios,
  guardarCambios,
  hayCambios,
  tipoDeCambios,
  type ResultadoCambios,
} from '@/gestor/guardado'
import {
  crearOrden,
  moverPunto,
  ordenProyectado,
  posicionEnOrden,
  puedeMover,
  puntosConOrdenCambiado,
  puntosDeZonaEnOrden,
  zonasConOrdenPendiente,
  type OrdenBorrador,
} from '@/gestor/orden'
import {
  clasificarPunto,
  colocarPunto,
  crearBorrador,
  desplazarPunto,
  ilustracionDeZona,
  posicionDelPuntero,
  puntosPendientes,
  zonaElegida,
  zonasDe,
  type Borrador,
  type TipoResultado,
} from '@/gestor/ubicacion'
import type es from '@/i18n/es.json'

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo' }

type ClaveZona = `zonas.${keyof typeof es.zonas}`

/** Qué se le cuenta al usuario tras guardar, descartar o mover un punto. */
type Aviso =
  | { tipo: TipoResultado; resultado: ResultadoCambios }
  | { tipo: 'descartado' }
  | { tipo: 'movido'; texto: string }
  | { tipo: 'nuevos'; creados: number; error: string | null }

/** Punto agregado en el editor que todavía no está en la base (se crea al guardar). */
type Nuevo = PuntoNuevo & { clave: string }

export function EditorUbicaciones({ rol }: { rol: Rol }) {
  const { t } = useTranslation('gestor')
  const { t: tGuia } = useTranslation()
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)
  // Lo último confirmado por la base, y el borrador que se edita encima.
  const [puntos, setPuntos] = useState<PuntoGestor[]>([])
  const [borrador, setBorrador] = useState<Borrador>({})
  const [orden, setOrden] = useState<OrdenBorrador>({})
  const [urlsIlustracion, setUrlsIlustracion] = useState<Record<string, string | null>>({})
  const [zona, setZona] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [nuevos, setNuevos] = useState<Nuevo[]>([])
  const [colocando, setColocando] = useState(false)
  const [descripciones, setDescripciones] = useState<Record<string, string>>({})
  const escenaRef = useRef<HTMLDivElement>(null)
  // Numera los puntos nuevos del borrador (solo para distinguirlos hasta crearlos).
  const contadorNuevos = useRef(0)
  const listaRef = useRef<HTMLUListElement>(null)
  // Botón de orden que acaba de usarse: al reordenar la fila cambia de lugar, y el foco vuelve a él.
  const focoRef = useRef<{ id: string; sentido: -1 | 1 } | null>(null)

  useEffect(() => {
    let vigente = true
    // Si fallan las zonas solo se pierde la ilustración de la base: se usa la local.
    Promise.all([listarPuntosGestor(), obtenerZonas().catch(() => [])])
      .then(([lista, zonas]) => {
        if (!vigente) return
        setPuntos(lista)
        setBorrador(crearBorrador(lista))
        setOrden(crearOrden(lista))
        setUrlsIlustracion(
          Object.fromEntries(zonas.map((z) => [z.slug, z.ilustracion?.url ?? null])),
        )
        setDescripciones(
          Object.fromEntries(zonas.map((z) => [z.slug, z.ilustracion?.textoAlternativo.es ?? ''])),
        )
        setZona((actual) => zonaElegida(zonasDe(lista), actual))
        setEstado({ tipo: 'listo' })
      })
      .catch(() => vigente && setEstado({ tipo: 'error' }))
    return () => {
      vigente = false
    }
  }, [intento])

  const pendientes = useMemo(() => puntosPendientes(puntos, borrador), [puntos, borrador])
  const zonasPendientes = useMemo(() => zonasConOrdenPendiente(puntos, orden), [puntos, orden])
  const ordenCambiado = useMemo(() => puntosConOrdenCambiado(puntos, orden), [puntos, orden])
  const numeros = useMemo(() => ordenProyectado(puntos, orden), [puntos, orden])
  const hayPendientes = hayCambios(puntos, borrador, orden)
  // Cambios de puntos existentes o puntos nuevos sin crear: los dos cuentan como pendientes.
  const hayAlgoPendiente = hayPendientes || nuevos.length > 0

  // Con cambios sin guardar: confirmar antes de salir a otra pantalla del gestor...
  const bloqueo = useBlocker(hayAlgoPendiente && !guardando)
  useEffect(() => {
    if (bloqueo.state !== 'blocked') return
    if (window.confirm(t('ubicaciones.confirmarSalir'))) bloqueo.proceed()
    else bloqueo.reset()
  }, [bloqueo, t])

  // ...y antes de recargar o cerrar la pestaña.
  useEffect(() => {
    if (!hayAlgoPendiente) return
    const alSalir = (evento: BeforeUnloadEvent) => evento.preventDefault()
    window.addEventListener('beforeunload', alSalir)
    return () => window.removeEventListener('beforeunload', alSalir)
  }, [hayAlgoPendiente])

  // Tras mover un punto, el foco sigue en su botón; si ya no puede moverse más en ese sentido (llegó al
  // primero o al último lugar, y el botón queda deshabilitado), pasa al botón contrario.
  useEffect(() => {
    const foco = focoRef.current
    if (!foco) return
    focoRef.current = null
    const botones = (sentido: -1 | 1) =>
      listaRef.current?.querySelector<HTMLButtonElement>(
        `[data-orden-punto="${foco.id}"][data-sentido="${sentido}"]`,
      )
    const preferido = botones(foco.sentido)
    const otro = botones(foco.sentido === -1 ? 1 : -1)
    ;(preferido && !preferido.disabled ? preferido : otro)?.focus()
  }, [orden])

  const nombreDe = (punto: PuntoGestor) =>
    punto.fichas.es?.titulo ?? t('lista.sinTitulo', { slug: punto.slug })
  const nombreZona = (slug: string) => tGuia(`zonas.${slug}` as ClaveZona, { defaultValue: slug })
  const clasificacionDe = (esencial: boolean) =>
    esencial ? t('ubicaciones.esencial') : t('ubicaciones.opcional')

  if (estado.tipo !== 'listo') {
    return (
      <section className="gestor__seccion">
        <Titulo />
        {estado.tipo === 'cargando' && (
          <p className="gestor__texto texto-body" role="status">
            {t('comun.cargando')}
          </p>
        )}
        {estado.tipo === 'error' && (
          <div className="gestor__seccion" role="alert">
            <p className="gestor__error texto-body">{t('ubicaciones.error')}</p>
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

  const zonas = zonasDe(puntos)
  const zonaId = puntos.find((punto) => punto.zona.slug === zona)?.zona.id ?? null
  const puntosZona = puntosDeZonaEnOrden(puntos, orden, zonaId)
  const numeroDe = (punto: PuntoGestor) => numeros[punto.id] ?? punto.orden
  const elegido = puntosZona.find((punto) => punto.id === seleccion) ?? null
  const ubicacionElegida = elegido ? borrador[elegido.id] : undefined
  const elegidoSinUbicar = ubicacionElegida?.pos_x === null || ubicacionElegida?.pos_y === null
  const ilustracion = zona ? ilustracionDeZona(urlsIlustracion[zona], zona) : null
  const nuevosZona = nuevos.filter((n) => n.zonaId === zonaId)
  // Los nuevos van al final de la ruta: su número sigue al último punto de la zona.
  const numeroNuevo = (i: number) => puntosZona.length + i + 1

  function cambiarZona(slug: string) {
    setZona(slug)
    setSeleccion(null)
    setColocando(false)
    setAviso(null)
  }

  /** Mover el borrador al lugar de la ilustración que está bajo el puntero (en coordenadas de pantalla). */
  function posicionBajo(cliente: { x: number; y: number }) {
    const caja = escenaRef.current?.getBoundingClientRect()
    return caja ? posicionDelPuntero(caja, cliente) : null
  }

  function cambiarNuevo(clave: string, cambio: Partial<PuntoNuevo>) {
    setNuevos((actuales) => actuales.map((n) => (n.clave === clave ? { ...n, ...cambio } : n)))
    setAviso(null)
  }

  function arrastrarNuevo(clave: string, cliente: { x: number; y: number }) {
    const posicion = posicionBajo(cliente)
    if (posicion) cambiarNuevo(clave, { pos_x: posicion.x, pos_y: posicion.y })
  }

  function arrastrar(id: string, cliente: { x: number; y: number }) {
    const posicion = posicionBajo(cliente)
    if (!posicion) return
    setBorrador((actual) => colocarPunto(actual, id, posicion.x, posicion.y))
    setAviso(null)
  }

  // Un punto sin ubicar se coloca tocando la ilustración: no hay posición inicial inventada.
  function colocarSeleccionado(evento: PointerEvent<HTMLDivElement>) {
    if (guardando) return
    // Con «Agregar punto» activo, tocar la ilustración crea el punto nuevo ahí (sin guardar todavía).
    if (colocando && zona && zonaId) {
      const posicion = posicionBajo({ x: evento.clientX, y: evento.clientY })
      if (!posicion) return
      contadorNuevos.current += 1
      const clave = `nuevo-${contadorNuevos.current}`
      setNuevos((actuales) => [
        ...actuales,
        { clave, zonaId, zonaSlug: zona, pos_x: posicion.x, pos_y: posicion.y, es_esencial: false },
      ])
      setColocando(false)
      setSeleccion(clave)
      setAviso(null)
      return
    }
    if (!elegido || !elegidoSinUbicar) return
    const posicion = posicionBajo({ x: evento.clientX, y: evento.clientY })
    if (!posicion) return
    setBorrador((actual) => colocarPunto(actual, elegido.id, posicion.x, posicion.y))
    setAviso(null)
  }

  /** Sube (`-1`) o baja (`1`) un punto en el borrador. Nada se guarda hasta «Guardar cambios». */
  function mover(punto: PuntoGestor, sentido: -1 | 1) {
    if (guardando || zonaId === null) return
    const siguiente = moverPunto(orden, zonaId, punto.id, sentido)
    if (siguiente === orden) return
    setOrden(siguiente)
    focoRef.current = { id: punto.id, sentido }
    setAviso({
      tipo: 'movido',
      texto: t('ubicaciones.movido', {
        nombre: nombreDe(punto),
        posicion: posicionEnOrden(siguiente, zonaId, punto.id) + 1,
        total: siguiente[zonaId]?.length ?? 0,
      }),
    })
  }

  async function guardar() {
    if (!hayAlgoPendiente) return
    setGuardando(true)
    setAviso(null)
    try {
      if (hayPendientes) {
        const resultado = await guardarCambios(puntos, borrador, orden)
        const siguiente = aplicarCambios(puntos, borrador, orden, resultado)
        setPuntos(siguiente.puntos)
        setBorrador(siguiente.borrador)
        setOrden(siguiente.orden)
        setAviso({ tipo: tipoDeCambios(resultado), resultado })
        if (resultado.ubicaciones.guardados.length + resultado.orden.guardadas.length > 0) {
          marcarCambiosSinPublicar()
        }
        // Si algo falló, los puntos nuevos esperan: se crean cuando lo demás quedó guardado.
        if (tipoDeCambios(resultado) !== 'exito') return
      }
      if (nuevos.length > 0) await crearNuevos()
    } finally {
      setGuardando(false)
    }
  }

  /** Crea los puntos nuevos al final de la ruta de su zona y vuelve a leer la lista de la base. */
  async function crearNuevos() {
    let creados = 0
    let error: string | null = null
    const quedan: Nuevo[] = []
    for (const nuevo of nuevos) {
      if (error) {
        quedan.push(nuevo)
        continue
      }
      try {
        await crearPunto(nuevo)
        creados += 1
      } catch (fallo) {
        error = (fallo as Error).message
        quedan.push(nuevo)
      }
    }
    setNuevos(quedan)
    if (creados > 0) {
      marcarCambiosSinPublicar()
      const lista = await listarPuntosGestor()
      setPuntos(lista)
      setBorrador(crearBorrador(lista))
      setOrden(crearOrden(lista))
      setSeleccion(null)
    }
    setAviso({ tipo: 'nuevos', creados, error })
  }

  function descartar() {
    setBorrador(crearBorrador(puntos))
    setOrden(crearOrden(puntos))
    setNuevos([])
    setColocando(false)
    setAviso({ tipo: 'descartado' })
  }

  const resultado = aviso && 'resultado' in aviso ? aviso.resultado : null
  const fallidos = resultado?.ubicaciones.fallidos ?? []
  const zonasFallidas = resultado?.orden.fallidas ?? []
  const tieneDetalle =
    (resultado?.ubicaciones.guardados.length ?? 0) +
      (resultado?.orden.guardadas.length ?? 0) +
      fallidos.length +
      zonasFallidas.length >
    0
  const slugDeZona = (id: string) => puntos.find((p) => p.zona.id === id)?.zona.slug ?? id

  return (
    <section className="gestor__seccion">
      <Titulo />

      {puntos.length === 0 ? (
        <p className="gestor__texto texto-body">{t('ubicaciones.vacio')}</p>
      ) : (
        <>
          <div className="gestor__pestanas" role="group" aria-label={t('ubicaciones.zonas')}>
            {zonas.map((slug) => (
              <Boton
                key={slug}
                tamano="sm"
                variante={slug === zona ? 'primario' : 'secundario'}
                aria-pressed={slug === zona}
                onClick={() => cambiarZona(slug)}
              >
                {nombreZona(slug)}
              </Boton>
            ))}
          </div>

          <div className="ubicacion__cuerpo">
            <div className="ubicacion__lienzo">
              <div className="ubicacion__herramientas">
                <Boton
                  tamano="sm"
                  variante={colocando ? 'secundario' : 'acento'}
                  icono={Plus}
                  aria-pressed={colocando}
                  disabled={guardando || !zonaId}
                  onClick={() => {
                    setColocando((actual) => !actual)
                    setAviso(null)
                  }}
                >
                  {colocando ? t('ubicaciones.cancelarAgregar') : t('ubicaciones.agregar')}
                </Boton>
              </div>
              <div
                ref={escenaRef}
                className={
                  colocando ? 'ubicacion__escena ubicacion__escena--colocando' : 'ubicacion__escena'
                }
                role="group"
                aria-label={t('ubicaciones.escena')}
                onPointerDown={colocarSeleccionado}
              >
                {ilustracion ? (
                  // Decorativa: cada marcador lleva su propio nombre accesible.
                  <img
                    className="ubicacion__ilustracion"
                    src={ilustracion.src}
                    srcSet={ilustracion.srcSet}
                    alt=""
                    draggable={false}
                    decoding="async"
                  />
                ) : (
                  <span className="ubicacion__sin-ilustracion texto-body">
                    <Image className="ubicacion__icono" aria-hidden="true" />
                    {t('ubicaciones.sinIlustracion')}
                  </span>
                )}
                {puntosZona.map((punto) => {
                  const { pos_x, pos_y, es_esencial } = borrador[punto.id] ?? punto
                  if (pos_x === null || pos_y === null) return null
                  return (
                    <MarcadorEditable
                      key={punto.id}
                      numero={numeroDe(punto)}
                      esencial={es_esencial}
                      seleccionado={punto.id === seleccion}
                      x={pos_x}
                      y={pos_y}
                      etiquetaAccesible={t('ubicaciones.marcador', {
                        numero: numeroDe(punto),
                        nombre: nombreDe(punto),
                        clasificacion: clasificacionDe(es_esencial),
                      })}
                      deshabilitado={guardando}
                      alSeleccionar={() => setSeleccion(punto.id)}
                      alArrastrar={(cliente) => arrastrar(punto.id, cliente)}
                      alDesplazar={(dx, dy) =>
                        setBorrador((actual) => desplazarPunto(actual, punto.id, dx, dy))
                      }
                    />
                  )
                })}
                {nuevosZona.map((nuevo, i) => (
                  <MarcadorEditable
                    key={nuevo.clave}
                    numero={numeroNuevo(i)}
                    esencial={nuevo.es_esencial}
                    seleccionado={nuevo.clave === seleccion}
                    x={nuevo.pos_x}
                    y={nuevo.pos_y}
                    etiquetaAccesible={t('ubicaciones.marcadorNuevo', {
                      numero: numeroNuevo(i),
                      clasificacion: clasificacionDe(nuevo.es_esencial),
                    })}
                    deshabilitado={guardando}
                    alSeleccionar={() => setSeleccion(nuevo.clave)}
                    alArrastrar={(cliente) => arrastrarNuevo(nuevo.clave, cliente)}
                    alDesplazar={(dx, dy) =>
                      cambiarNuevo(nuevo.clave, {
                        pos_x: Math.min(1, Math.max(0, nuevo.pos_x + dx)),
                        pos_y: Math.min(1, Math.max(0, nuevo.pos_y + dy)),
                      })
                    }
                  />
                ))}
              </div>
              {colocando && (
                <p className="gestor__aviso texto-small-strong" role="status">
                  {t('ubicaciones.instruccionAgregar')}
                </p>
              )}
              {rol === 'admin' && zona && (
                <CambiarMapa
                  zona={zona}
                  nombreZona={nombreZona(zona)}
                  descripcionActual={descripciones[zona] ?? ''}
                  deshabilitado={guardando}
                  alCambiar={(url, descripcion) => {
                    setUrlsIlustracion((actuales) => ({ ...actuales, [zona]: url }))
                    setDescripciones((actuales) => ({ ...actuales, [zona]: descripcion }))
                  }}
                />
              )}
            </div>

            <div className="gestor__grupo">
              <h2 className="gestor__subtitulo texto-heading">{t('ubicaciones.listaTitulo')}</h2>
              <ul className="ubicacion__lista" ref={listaRef}>
                {puntosZona.map((punto) => {
                  const actual = borrador[punto.id] ?? punto
                  const sinUbicar = actual.pos_x === null || actual.pos_y === null
                  return (
                    <li key={punto.id}>
                      <Tarjeta
                        titulo={nombreDe(punto)}
                        subtitulo={t('lista.punto', { numero: numeroDe(punto) })}
                        seleccionada={punto.id === seleccion}
                        onPresionar={() => setSeleccion(punto.id)}
                        final={
                          <span className="gestor__insignias">
                            {sinUbicar && (
                              <Insignia tono="advertencia">{t('ubicaciones.sinUbicar')}</Insignia>
                            )}
                            {pendientes.includes(punto.id) && (
                              <Insignia tono="info">{t('ubicaciones.modificado')}</Insignia>
                            )}
                            {ordenCambiado.includes(punto.id) && (
                              <Insignia tono="info">{t('ubicaciones.ordenModificado')}</Insignia>
                            )}
                            <Insignia tono={actual.es_esencial ? 'marca' : 'neutral'}>
                              {clasificacionDe(actual.es_esencial)}
                            </Insignia>
                          </span>
                        }
                      />
                      <div className="ubicacion__orden">
                        {([-1, 1] as const).map((sentido) => (
                          <Boton
                            key={sentido}
                            tamano="sm"
                            variante="secundario"
                            icono={sentido === -1 ? ArrowUp : ArrowDown}
                            disabled={
                              guardando ||
                              zonaId === null ||
                              !puedeMover(orden, zonaId, punto.id, sentido)
                            }
                            data-orden-punto={punto.id}
                            data-sentido={sentido}
                            aria-label={t(
                              sentido === -1 ? 'ubicaciones.subirPunto' : 'ubicaciones.bajarPunto',
                              { numero: numeroDe(punto), nombre: nombreDe(punto) },
                            )}
                            onClick={() => mover(punto, sentido)}
                          >
                            {sentido === -1 ? t('ubicaciones.subir') : t('ubicaciones.bajar')}
                          </Boton>
                        ))}
                      </div>
                    </li>
                  )
                })}
                {nuevosZona.map((nuevo, i) => (
                  <li key={nuevo.clave}>
                    <Tarjeta
                      titulo={t('ubicaciones.nuevoTitulo')}
                      subtitulo={t('lista.punto', { numero: numeroNuevo(i) })}
                      seleccionada={nuevo.clave === seleccion}
                      onPresionar={() => setSeleccion(nuevo.clave)}
                      final={
                        <span className="gestor__insignias">
                          <Insignia tono="info">{t('ubicaciones.nuevo')}</Insignia>
                          <Insignia tono={nuevo.es_esencial ? 'marca' : 'neutral'}>
                            {clasificacionDe(nuevo.es_esencial)}
                          </Insignia>
                        </span>
                      }
                    />
                    <div className="ubicacion__orden">
                      {[true, false].map((esencial) => (
                        <Boton
                          key={String(esencial)}
                          tamano="sm"
                          variante={esencial === nuevo.es_esencial ? 'primario' : 'secundario'}
                          aria-pressed={esencial === nuevo.es_esencial}
                          disabled={guardando}
                          onClick={() => cambiarNuevo(nuevo.clave, { es_esencial: esencial })}
                        >
                          {clasificacionDe(esencial)}
                        </Boton>
                      ))}
                      <Boton
                        tamano="sm"
                        variante="fantasma"
                        icono={Trash2}
                        disabled={guardando}
                        onClick={() => {
                          setNuevos((actuales) => actuales.filter((n) => n.clave !== nuevo.clave))
                          if (seleccion === nuevo.clave) setSeleccion(null)
                        }}
                      >
                        {t('ubicaciones.quitarNuevo')}
                      </Boton>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="ubicacion__detalle">
                {nuevosZona.some((n) => n.clave === seleccion) ? (
                  <p className="gestor__texto texto-body">{t('ubicaciones.instruccionNuevo')}</p>
                ) : !elegido || !ubicacionElegida ? (
                  <p className="gestor__texto texto-body">{t('ubicaciones.sinSeleccion')}</p>
                ) : (
                  <>
                    <h3 className="gestor__subtitulo texto-body-strong">
                      {t('ubicaciones.punto', {
                        numero: numeroDe(elegido),
                        nombre: nombreDe(elegido),
                      })}
                    </h3>
                    <p className="gestor__texto texto-body">
                      {elegidoSinUbicar
                        ? t('ubicaciones.instruccionSinUbicar')
                        : t('ubicaciones.instruccionUbicado')}
                    </p>
                    {ubicacionElegida.pos_x !== null && ubicacionElegida.pos_y !== null && (
                      <p className="gestor__texto texto-small">
                        {t('ubicaciones.posicion', {
                          x: Math.round(ubicacionElegida.pos_x * 100),
                          y: Math.round(ubicacionElegida.pos_y * 100),
                        })}
                      </p>
                    )}
                    <div
                      className="gestor__pestanas"
                      role="group"
                      aria-label={t('ubicaciones.clasificacion')}
                    >
                      {[true, false].map((esencial) => (
                        <Boton
                          key={String(esencial)}
                          tamano="sm"
                          variante={
                            esencial === ubicacionElegida.es_esencial ? 'primario' : 'secundario'
                          }
                          aria-pressed={esencial === ubicacionElegida.es_esencial}
                          disabled={guardando}
                          onClick={() => {
                            setBorrador((actual) => clasificarPunto(actual, elegido.id, esencial))
                            setAviso(null)
                          }}
                        >
                          {clasificacionDe(esencial)}
                        </Boton>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="ubicacion__acciones">
            {hayAlgoPendiente ? (
              <div>
                {nuevos.length > 0 && (
                  <p className="gestor__aviso texto-small-strong">
                    {t('ubicaciones.nuevosPendientes', { count: nuevos.length })}
                  </p>
                )}
                {pendientes.length > 0 && (
                  <p className="gestor__aviso texto-small-strong">
                    {t('ubicaciones.pendientes', { count: pendientes.length })}
                  </p>
                )}
                {zonasPendientes.length > 0 && (
                  <p className="gestor__aviso texto-small-strong">
                    {t('ubicaciones.ordenPendiente', { count: zonasPendientes.length })}
                  </p>
                )}
              </div>
            ) : (
              <p className="gestor__texto texto-small">{t('ubicaciones.sinCambios')}</p>
            )}
            <div className="gestor__pestanas">
              <Boton
                cargando={guardando}
                disabled={!hayAlgoPendiente}
                onClick={() => void guardar()}
              >
                {t('ubicaciones.guardar')}
              </Boton>
              <Boton
                variante="secundario"
                disabled={!hayAlgoPendiente || guardando}
                onClick={descartar}
              >
                {t('ubicaciones.descartar')}
              </Boton>
            </div>
          </div>

          <div role="status" className="gestor__estado">
            {aviso?.tipo === 'descartado' && (
              <p className="gestor__texto texto-body">{t('ubicaciones.descartado')}</p>
            )}
            {aviso?.tipo === 'movido' && <p className="gestor__texto texto-small">{aviso.texto}</p>}
            {aviso?.tipo === 'nuevos' && aviso.creados > 0 && (
              <p className="gestor__texto texto-body">
                {t('ubicaciones.nuevosCreados', { count: aviso.creados })}
              </p>
            )}
            {aviso?.tipo === 'nuevos' && aviso.error && (
              <p className="gestor__error texto-body">
                {t('ubicaciones.nuevosError', { mensaje: aviso.error })}
              </p>
            )}
            {aviso?.tipo === 'exito' && (
              <p className="gestor__texto texto-body">{t('ubicaciones.resultadoExito')}</p>
            )}
            {aviso?.tipo === 'parcial' && (
              <p className="gestor__error texto-body">{t('ubicaciones.resultadoParcial')}</p>
            )}
            {aviso?.tipo === 'error' && (
              <p className="gestor__error texto-body">{t('ubicaciones.resultadoError')}</p>
            )}
            {resultado && tieneDetalle && (
              <ul className="ubicacion__fallos">
                {resultado.ubicaciones.guardados.length > 0 && (
                  <li className="gestor__texto texto-small">
                    {t('ubicaciones.detallePosiciones', {
                      count: resultado.ubicaciones.guardados.length,
                    })}
                  </li>
                )}
                {resultado.orden.guardadas.length > 0 && (
                  <li className="gestor__texto texto-small">
                    {t('ubicaciones.detalleOrden', { count: resultado.orden.guardadas.length })}
                  </li>
                )}
                {fallidos.map((fallo) => {
                  const punto = puntos.find((p) => p.id === fallo.id)
                  return (
                    <li key={fallo.id} className="gestor__error texto-small">
                      {punto
                        ? t('ubicaciones.falloPunto', {
                            numero: punto.orden,
                            nombre: nombreDe(punto),
                            mensaje: fallo.mensaje,
                          })
                        : fallo.mensaje}
                    </li>
                  )
                })}
                {zonasFallidas.map((fallo) => (
                  <li key={fallo.zonaId} className="gestor__error texto-small">
                    {t('ubicaciones.falloOrden', {
                      zona: nombreZona(slugDeZona(fallo.zonaId)),
                      mensaje: fallo.mensaje,
                    })}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  )
}

function Titulo() {
  const { t } = useTranslation('gestor')
  return (
    <EncabezadoSeccion
      seccion="ubicacion"
      titulo={t('ubicaciones.titulo')}
      texto={t('ubicaciones.texto')}
    />
  )
}
