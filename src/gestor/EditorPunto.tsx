import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router'
import { Save } from 'lucide-react'
import { BarraSuperior } from '@/componentes/BarraSuperior'
import { Boton } from '@/componentes/Boton'
import { Insignia } from '@/componentes/Insignia'
import {
  cambiarEstadoFicha,
  guardarFicha,
  IDIOMAS_GESTOR,
  obtenerPuntoGestor,
  type CamposFicha,
  type DetallePunto,
} from '@/datos/gestor'
import { Campo, CampoArea } from '@/gestor/componentes/Campo'
import type { Rol } from '@/datos/sesion'
import { camposDe, hayCambios, type IdiomaGestor } from '@/gestor/editor'
import { accionesDisponibles, DESTINO, type AccionEstado } from '@/gestor/estados'
import { TONO_ESTADO } from '@/gestor/lista'
import type es from '@/i18n/es.json'

type Estado =
  | { tipo: 'cargando' }
  | { tipo: 'error' }
  | { tipo: 'noExiste' }
  | { tipo: 'listo'; punto: DetallePunto }

type Aviso =
  | 'guardado'
  | 'errorGuardar'
  | 'faltaTitulo'
  | 'sinCambios'
  | 'estadoCambiado'
  | 'errorEstado'
  | 'guardaPrimero'
  | null

const FORMATO_FECHA = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' })

type ClaveZona = `zonas.${keyof typeof es.zonas}`

/** Ficha de un punto: se elige el idioma y se editan sus campos. */
export function EditorPunto({ rol }: { rol: Rol }) {
  const { t } = useTranslation('gestor')
  const { t: tGuia } = useTranslation()
  const navegar = useNavigate()
  const { idPunto = '' } = useParams()
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [idioma, setIdioma] = useState<IdiomaGestor>('es')
  // Un borrador por idioma: cambiar de pestaña no pierde lo escrito.
  const [borradores, setBorradores] = useState<Record<IdiomaGestor, CamposFicha> | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [cambiandoEstado, setCambiandoEstado] = useState<AccionEstado | null>(null)
  const [aviso, setAviso] = useState<Aviso>(null)

  useEffect(() => {
    let vigente = true
    obtenerPuntoGestor(idPunto)
      .then((punto) => {
        if (!vigente) return
        if (!punto) {
          setEstado({ tipo: 'noExiste' })
          return
        }
        setEstado({ tipo: 'listo', punto })
        setBorradores({ es: camposDe(punto.fichas.es), en: camposDe(punto.fichas.en) })
      })
      .catch(() => vigente && setEstado({ tipo: 'error' }))
    return () => {
      vigente = false
    }
  }, [idPunto])

  const barra = (
    <BarraSuperior
      etiqueta={t('editor.volver')}
      etiquetaAccesible={t('editor.volverAccesible')}
      onVolver={() => navegar('/gestor')}
    />
  )

  if (estado.tipo !== 'listo' || !borradores) {
    return (
      <section className="gestor__seccion">
        {barra}
        {estado.tipo === 'cargando' && (
          <p className="gestor__texto texto-body" role="status">
            {t('comun.cargando')}
          </p>
        )}
        {estado.tipo === 'error' && (
          <p className="gestor__error texto-body" role="alert">
            {t('editor.error')}
          </p>
        )}
        {estado.tipo === 'noExiste' && (
          <p className="gestor__texto texto-body">{t('editor.noExiste')}</p>
        )}
      </section>
    )
  }

  const { punto } = estado
  const ficha = punto.fichas[idioma]
  const campos = borradores[idioma]
  const nombreIdioma = t(`idiomas.${idioma}`)

  function cambiar(campo: keyof CamposFicha, valor: string) {
    setAviso(null)
    setBorradores(
      (actuales) => actuales && { ...actuales, [idioma]: { ...actuales[idioma], [campo]: valor } },
    )
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!campos.titulo.trim()) {
      setAviso('faltaTitulo')
      return
    }
    if (!hayCambios(campos, ficha)) {
      setAviso('sinCambios')
      return
    }
    setGuardando(true)
    try {
      const guardada = await guardarFicha(punto.id, idioma, campos, ficha)
      setEstado({
        tipo: 'listo',
        punto: { ...punto, fichas: { ...punto.fichas, [idioma]: guardada } },
      })
      setBorradores((actuales) => actuales && { ...actuales, [idioma]: camposDe(guardada) })
      setAviso('guardado')
    } catch {
      setAviso('errorGuardar')
    } finally {
      setGuardando(false)
    }
  }

  async function aplicar(accion: AccionEstado) {
    if (!ficha) return
    if (hayCambios(campos, ficha)) {
      setAviso('guardaPrimero')
      return
    }
    setCambiandoEstado(accion)
    try {
      const actualizada = await cambiarEstadoFicha(ficha.id, DESTINO[accion])
      setEstado({
        tipo: 'listo',
        punto: { ...punto, fichas: { ...punto.fichas, [idioma]: actualizada } },
      })
      setAviso('estadoCambiado')
    } catch {
      setAviso('errorEstado')
    } finally {
      setCambiandoEstado(null)
    }
  }

  const acciones = ficha ? accionesDisponibles(rol, ficha.estado) : []
  const esError = aviso === 'errorGuardar' || aviso === 'errorEstado'

  return (
    <section className="gestor__seccion">
      {barra}
      <div className="gestor__titulos">
        <h1 className="gestor__titulo texto-title-1">
          {t('editor.titulo', { numero: punto.orden })}
        </h1>
        <p className="gestor__texto texto-body">
          {t('editor.zona', {
            zona: tGuia(`zonas.${punto.zona}` as ClaveZona, { defaultValue: punto.zona }),
          })}
        </p>
      </div>

      <div className="gestor__pestanas" role="group" aria-label={t('editor.idioma')}>
        {IDIOMAS_GESTOR.map((codigo) => (
          <Boton
            key={codigo}
            tamano="sm"
            variante={codigo === idioma ? 'primario' : 'secundario'}
            aria-pressed={codigo === idioma}
            onClick={() => {
              setIdioma(codigo)
              setAviso(null)
            }}
          >
            {t(`idiomas.${codigo}`)}
          </Boton>
        ))}
      </div>

      <div className="gestor__estado">
        <Insignia tono={TONO_ESTADO[ficha?.estado ?? 'falta']}>
          {t('editor.estado', { estado: t(`estados.${ficha?.estado ?? 'falta'}`) })}
        </Insignia>
        {!ficha && (
          <p className="gestor__texto texto-small">
            {t('editor.sinFicha', { idioma: nombreIdioma.toLowerCase() })}
          </p>
        )}
        {ficha?.estado === 'aprobado' && (
          <p className="gestor__texto texto-small">{t('editor.publicada')}</p>
        )}
        {ficha?.estado === 'revision' && acciones.length === 0 && (
          <p className="gestor__texto texto-small">{t('editor.esperandoRevision')}</p>
        )}
        {ficha?.revision && (
          <p className="gestor__texto texto-small">
            {t('editor.revisadaPor', {
              nombre: ficha.revision.nombre ?? t('editor.revisorDesconocido'),
              fecha: FORMATO_FECHA.format(new Date(ficha.revision.fecha)),
            })}
          </p>
        )}
        {acciones.length > 0 && (
          <div className="gestor__pestanas">
            {acciones.map((accion) => (
              <Boton
                key={accion}
                tamano="sm"
                variante={accion === 'devolverABorrador' ? 'secundario' : 'primario'}
                cargando={cambiandoEstado === accion}
                disabled={cambiandoEstado !== null && cambiandoEstado !== accion}
                onClick={() => void aplicar(accion)}
              >
                {t(`acciones.${accion}`)}
              </Boton>
            ))}
          </div>
        )}
      </div>

      <form className="gestor__formulario" onSubmit={guardar} noValidate lang={idioma}>
        <Campo
          etiqueta={t('editor.campos.titulo')}
          ayuda={t('editor.campos.tituloAyuda')}
          value={campos.titulo}
          error={aviso === 'faltaTitulo' ? t('editor.faltaTitulo') : undefined}
          onChange={(e) => cambiar('titulo', e.target.value)}
        />
        <CampoArea
          etiqueta={t('editor.campos.queVes')}
          ayuda={t('editor.campos.queVesAyuda')}
          value={campos.que_ves}
          onChange={(e) => cambiar('que_ves', e.target.value)}
        />
        <CampoArea
          etiqueta={t('editor.campos.historia')}
          ayuda={t('editor.campos.historiaAyuda')}
          rows={8}
          value={campos.historia}
          onChange={(e) => cambiar('historia', e.target.value)}
        />
        <CampoArea
          etiqueta={t('editor.campos.datoSanti')}
          ayuda={t('editor.campos.datoSantiAyuda')}
          value={campos.dato_santi}
          onChange={(e) => cambiar('dato_santi', e.target.value)}
        />

        {aviso && aviso !== 'faltaTitulo' && (
          <p
            className={esError ? 'gestor__error texto-body' : 'gestor__texto texto-body'}
            role={esError ? 'alert' : 'status'}
          >
            {t(`editor.${aviso}`, { estado: t(`estados.${ficha?.estado ?? 'falta'}`) })}
          </p>
        )}

        <Boton type="submit" icono={Save} cargando={guardando} anchoCompleto>
          {t('editor.guardar')}
        </Boton>
      </form>
    </section>
  )
}
