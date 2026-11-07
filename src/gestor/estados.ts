import type { EstadoFicha } from '@/datos/gestor'
import type { Rol } from '@/datos/sesion'

export type AccionEstado = 'enviarARevision' | 'aprobar' | 'devolverABorrador'

/** Estado al que lleva cada acción. */
export const DESTINO: Record<AccionEstado, EstadoFicha> = {
  enviarARevision: 'revision',
  aprobar: 'aprobado',
  devolverABorrador: 'borrador',
}

/**
 * Acciones de estado que puede hacer cada rol (las mismas reglas de acceso de la base, en
 * supabase/migrations/…_reglas_de_acceso.sql): cualquiera del personal envía un borrador a
 * revisión; solo revisor y admin aprueban o devuelven a borrador.
 */
export function accionesDisponibles(rol: Rol | null, estado: EstadoFicha): AccionEstado[] {
  if (!rol) return []
  const revisa = rol === 'revisor' || rol === 'admin'
  switch (estado) {
    case 'borrador':
      return ['enviarARevision']
    case 'revision':
      return revisa ? ['aprobar', 'devolverABorrador'] : []
    case 'aprobado':
      return revisa ? ['devolverABorrador'] : []
  }
}
