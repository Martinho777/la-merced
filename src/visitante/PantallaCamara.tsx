import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { Boton } from '@/componentes/Boton'
import { Santi } from '@/componentes/Santi/Santi'
import { SantiBurbuja } from '@/componentes/SantiBurbuja'
import { obtenerZona } from '@/datos/zonas'
import { BarraVisitante } from '@/visitante/BarraVisitante'
import {
  rutaConZona,
  siguientePaso,
  zonaDeBusqueda,
  type EstadoAlineacion,
  type SiguientePaso,
} from '@/visitante/camara'
import '@/visitante/pantalla.css'

type Estado = { tipo: 'cargando' } | { tipo: 'error' } | { tipo: 'listo'; paso: SiguientePaso }

/**
 * Pantalla 5 (/camara?zona=…): Santi explica para qué es la cámara antes de pedir el permiso. Aquí
 * no se pide nada: "Activar cámara" lleva a /alineacion, que es la que solicita la cámara, y
 * "Saltar" va directo al mapa. Si la zona no usa cámara, se pasa al mapa sin mostrar esta pantalla.
 */
export function PantallaCamara() {
  const { t } = useTranslation()
  const navegar = useNavigate()
  const [parametros] = useSearchParams()
  const slug = zonaDeBusqueda(parametros)
  const [estado, setEstado] = useState<Estado>({ tipo: 'cargando' })
  const [intento, setIntento] = useState(0)
  // Evita navegar dos veces si se pulsa "Activar cámara" repetidamente.
  const saliendo = useRef(false)

  useEffect(() => {
    if (!slug) return
    let vigente = true
    obtenerZona(slug)
      .then((zona) => vigente && setEstado({ tipo: 'listo', paso: siguientePaso(zona) }))
      .catch(() => vigente && setEstado({ tipo: 'error' }))
    return () => {
      vigente = false
    }
  }, [slug, intento])

  // Sin zona en la URL (entrada directa o enlace viejo): a elegir zona.
  if (!slug) return <Navigate to="/zona" replace />
  if (estado.tipo === 'listo' && estado.paso === 'zonas') return <Navigate to="/zona" replace />
  if (estado.tipo === 'listo' && estado.paso === 'mapa') {
    return <Navigate to={rutaConZona('/mapa', slug)} replace />
  }

  function reintentar() {
    setEstado({ tipo: 'cargando' })
    setIntento((n) => n + 1)
  }

  function irA(ruta: string, estadoNavegacion?: EstadoAlineacion) {
    if (saliendo.current) return
    saliendo.current = true
    navegar(ruta, { state: estadoNavegacion })
  }

  return (
    <div className="pantalla">
      <BarraVisitante
        volverA="/zona"
        etiqueta={t('navegacion.zonas')}
        etiquetaAccesible={t('navegacion.volverAZonas')}
      />
      <div className="pantalla__cuerpo pantalla__cuerpo--centrado">
        <SantiBurbuja cola="abajo">{t('camara.explicacion')}</SantiBurbuja>
        <Santi pose="phone" tamano="lg" />
        {estado.tipo === 'error' && (
          <div className="pantalla__estado" role="alert">
            <p className="pantalla__error texto-body">{t('camara.errorZona')}</p>
            <Boton variante="secundario" tamano="sm" onClick={reintentar}>
              {t('comun.reintentar')}
            </Boton>
          </div>
        )}
      </div>
      <div className="pantalla__acciones">
        {estado.tipo !== 'error' && (
          <Boton
            anchoCompleto
            cargando={estado.tipo === 'cargando'}
            onClick={() => irA(rutaConZona('/alineacion', slug), { activada: true })}
          >
            {t('camara.activar')}
          </Boton>
        )}
        <Boton variante="secundario" anchoCompleto onClick={() => irA(rutaConZona('/mapa', slug))}>
          {t('camara.saltar')}
        </Boton>
      </div>
    </div>
  )
}
