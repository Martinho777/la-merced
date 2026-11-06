import { beforeEach, describe, expect, it, vi } from 'vitest'

// Cliente simulado: auth y la consulta a perfiles responden con lo que cada prueba define.
let sesionGuardada: { user: { id: string; email: string } } | null
let respuestaLogin: {
  data: { user: { id: string; email: string } | null }
  error: { status: number; message: string } | null
}
let perfil: { data: unknown; error: { message: string } | null }
const consultas: { metodo: string; args: unknown[] }[] = []

function consultaPerfiles() {
  const consulta: Record<string, unknown> = {}
  for (const metodo of ['select', 'eq']) {
    consulta[metodo] = (...args: unknown[]) => {
      consultas.push({ metodo, args })
      return consulta
    }
  }
  consulta.maybeSingle = async () => perfil
  return consulta
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: sesionGuardada }, error: null }),
      signInWithPassword: async () => respuestaLogin,
      signOut: async () => ({ error: null }),
    },
    from: (tabla: string) => {
      consultas.push({ metodo: 'from', args: [tabla] })
      return consultaPerfiles()
    },
  },
}))

const { ErrorInicioSesion, iniciarSesion, obtenerSesion } = await import('@/datos/sesion')

describe('sesión del gestor', () => {
  beforeEach(() => {
    consultas.length = 0
    sesionGuardada = null
    perfil = { data: { nombre: 'Prueba editor', rol: 'editor' }, error: null }
  })

  it('sin sesión guardada devuelve null y no consulta perfiles', async () => {
    expect(await obtenerSesion()).toBeNull()
    expect(consultas).toHaveLength(0)
  })

  it('con sesión guardada devuelve el nombre y el rol del perfil', async () => {
    sesionGuardada = { user: { id: 'u1', email: 'editor@prueba.test' } }

    expect(await obtenerSesion()).toEqual({
      usuarioId: 'u1',
      correo: 'editor@prueba.test',
      nombre: 'Prueba editor',
      rol: 'editor',
    })
    expect(consultas).toContainEqual({ metodo: 'from', args: ['perfiles'] })
    expect(consultas).toContainEqual({ metodo: 'eq', args: ['id', 'u1'] })
  })

  it('un usuario sin rol asignado entra con rol null', async () => {
    sesionGuardada = { user: { id: 'u2', email: 'nuevo@prueba.test' } }
    perfil = { data: { nombre: null, rol: null }, error: null }

    expect((await obtenerSesion())?.rol).toBeNull()
  })

  it('inicia sesión y devuelve el perfil', async () => {
    respuestaLogin = { data: { user: { id: 'u3', email: 'revisor@prueba.test' } }, error: null }
    perfil = { data: { nombre: 'Prueba revisor', rol: 'revisor' }, error: null }

    const sesion = await iniciarSesion(' revisor@prueba.test ', 'clave')
    expect(sesion.rol).toBe('revisor')
    expect(sesion.correo).toBe('revisor@prueba.test')
  })

  it('distingue credenciales incorrectas de un problema de conexión', async () => {
    respuestaLogin = { data: { user: null }, error: { status: 400, message: 'Invalid login' } }
    await expect(iniciarSesion('a@b.test', 'x')).rejects.toMatchObject({ motivo: 'credenciales' })

    respuestaLogin = { data: { user: null }, error: { status: 0, message: 'Failed to fetch' } }
    const error = await iniciarSesion('a@b.test', 'x').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ErrorInicioSesion)
    expect(error).toMatchObject({ motivo: 'conexion' })
  })
})
