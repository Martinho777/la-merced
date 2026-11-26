import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import {
  ClipboardList,
  DatabaseBackup,
  MapPin,
  MessageSquareText,
  PenLine,
  type LucideIcon,
} from 'lucide-react'
import { Insignia } from '@/componentes/Insignia'
import { Tarjeta } from '@/componentes/Tarjeta'
import type { Rol } from '@/datos/sesion'
import { hayCambiosSinPublicar } from '@/gestor/publicacionPendiente'
import { RUTA_SECCION, seccionesVisibles, type Seccion } from '@/gestor/secciones'
import '@/gestor/intro.css'

const ICONO: Record<Seccion, LucideIcon> = {
  fichas: PenLine,
  ubicacion: MapPin,
  faltantes: ClipboardList,
  textos: MessageSquareText,
  publicar: DatabaseBackup,
}

/**
 * Inicio del gestor: una tarjeta por tarea, con un nombre en palabras de todos los días y una línea que
 * explica qué se hace ahí. Cada rol ve solo las tareas que puede hacer.
 */
export function InicioGestor({ rol }: { rol: Rol }) {
  const { t } = useTranslation('gestor')
  const navegar = useNavigate()
  const [pendiente] = useState(hayCambiosSinPublicar)
  const visibles = seccionesVisibles(rol)
  // «Publicar» no es una tarea más: es la copia de respaldo, aparte y al final.
  const tareas = visibles.filter((seccion) => seccion !== 'publicar')

  return (
    <section className="gestor__seccion">
      <div className="gestor__titulos">
        <h1 className="gestor__titulo texto-title-1">{t('inicio.titulo')}</h1>
        <p className="gestor__texto texto-body">{t('inicio.texto')}</p>
      </div>
      <ul className="gestor__lista inicio__tareas">
        {tareas.map((seccion) => (
          <li key={seccion}>
            <Tarjeta
              icono={ICONO[seccion]}
              titulo={t(`inicio.${seccion}.titulo`)}
              subtitulo={t(`inicio.${seccion}.texto`)}
              onPresionar={() => navegar(RUTA_SECCION[seccion])}
            />
          </li>
        ))}
      </ul>

      {visibles.includes('publicar') && (
        <section className="gestor__grupo" aria-labelledby="inicio-mantenimiento">
          <h2 id="inicio-mantenimiento" className="gestor__subtitulo texto-heading">
            {t('inicio.mantenimiento')}
          </h2>
          <ul className="gestor__lista inicio__tareas">
            <li
              className={
                pendiente ? 'inicio__respaldo inicio__respaldo--llamar' : 'inicio__respaldo'
              }
            >
              <Tarjeta
                icono={ICONO.publicar}
                titulo={t('inicio.publicar.titulo')}
                subtitulo={t('inicio.publicar.texto')}
                onPresionar={() => navegar(RUTA_SECCION.publicar)}
                final={
                  pendiente ? (
                    <Insignia tono="advertencia">{t('inicio.publicar.pendiente')}</Insignia>
                  ) : undefined
                }
              />
            </li>
          </ul>
        </section>
      )}
    </section>
  )
}
