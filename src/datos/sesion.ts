// Sesión del gestor: inicio y cierre de sesión con Supabase Auth y el rol del usuario (tabla perfiles).
// El registro público está desactivado: las cuentas se crean por invitación y un admin asigna el rol.

import { supabase } from '@/lib/supabase'
import type { Enums } from '@/lib/tipos-db'

export type Rol = Enums<'rol_usuario'>

export type SesionGestor = {
  usuarioId: string
  correo: string
  nombre: string | null
  /** Null mientras un admin no le asigne un rol: entra, pero no puede trabajar. */
  rol: Rol | null
}

export type MotivoErrorSesion = 'credenciales' | 'conexion'

/** Error al iniciar sesión, con el motivo para que la pantalla elija el mensaje. */
export class ErrorInicioSesion extends Error {
  readonly motivo: MotivoErrorSesion

  constructor(motivo: MotivoErrorSesion, mensaje: string) {
    super(mensaje)
    this.name = 'ErrorInicioSesion'
    this.motivo = motivo
  }
}

async function sesionDe(usuarioId: string, correo: string): Promise<SesionGestor> {
  const { data, error } = await supabase
    .from('perfiles')
    .select('nombre, rol')
    .eq('id', usuarioId)
    .maybeSingle()

  if (error) throw new Error(`No se pudo leer el perfil del usuario: ${error.message}`)

  return { usuarioId, correo, nombre: data?.nombre ?? null, rol: data?.rol ?? null }
}

/** La sesión guardada en este navegador, o null si nadie ha iniciado sesión. */
export async function obtenerSesion(): Promise<SesionGestor | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw new Error(`No se pudo leer la sesión: ${error.message}`)

  const usuario = data.session?.user
  if (!usuario) return null
  return sesionDe(usuario.id, usuario.email ?? '')
}

export async function iniciarSesion(correo: string, contrasena: string): Promise<SesionGestor> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: correo.trim(),
    password: contrasena,
  })

  if (error) {
    // 400 = correo o contraseña incorrectos; cualquier otra cosa es un problema de red o del servidor.
    const motivo: MotivoErrorSesion = error.status === 400 ? 'credenciales' : 'conexion'
    throw new ErrorInicioSesion(motivo, `No se pudo iniciar sesión: ${error.message}`)
  }

  return sesionDe(data.user.id, data.user.email ?? correo.trim())
}

export async function cerrarSesion(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(`No se pudo cerrar la sesión: ${error.message}`)
}

/**
 * Avisa cuando la sesión cambia (inicio, cierre, vencimiento o desde otra pestaña).
 * Devuelve la función para dejar de escuchar.
 */
export function alCambiarSesion(avisar: () => void): () => void {
  const { data } = supabase.auth.onAuthStateChange(() => {
    // Supabase no permite consultar la base dentro de este callback: se avisa en el siguiente turno.
    setTimeout(avisar, 0)
  })
  return () => data.subscription.unsubscribe()
}
