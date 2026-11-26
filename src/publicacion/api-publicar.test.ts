// Petición directa a la función de Vercel `api/publicar.ts` (sin pasar por el botón del gestor).
// Supabase y la red están simulados: esto prueba el código de la función, no la base real.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const ROLES: Record<string, string | null> = {
  'token-editor': 'editor',
  'token-revisor': 'revisor',
  'token-admin': 'admin',
}
const inserciones: unknown[] = []

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: async (token: string) =>
        token in ROLES
          ? { data: { user: { id: token } }, error: null }
          : { data: { user: null }, error: { message: 'invalid JWT' } },
    },
    from: (tabla: string) => {
      const filtros: Record<string, unknown> = {}
      const c: Record<string, unknown> = {}
      c.select = () => c
      c.eq = (columna: string, valor: unknown) => {
        filtros[columna] = valor
        return c
      }
      c.maybeSingle = async () =>
        tabla === 'perfiles'
          ? { data: { rol: ROLES[filtros.id as string] ?? null }, error: null }
          : { data: null, error: null }
      c.insert = (fila: unknown) => {
        inserciones.push({ tabla, fila })
        return c
      }
      c.update = () => c
      c.in = () => c
      c.lt = () => c
      c.then = (resolver: (v: unknown) => unknown) => resolver({ error: null })
      c.single = async () => ({ data: { id: 'pub-1', version: 7 }, error: null })
      return c
    },
    storage: { from: () => ({ getPublicUrl: (r: string) => ({ data: { publicUrl: r } }) }) },
  }),
}))

const { POST } = await import('../../api/publicar')

const pedir = (token?: string) =>
  POST(
    new Request('https://la-merced.test/api/publicar', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),
  )

describe('POST /api/publicar (petición directa)', () => {
  beforeEach(() => {
    inserciones.length = 0
    process.env.VITE_SUPABASE_URL = 'https://supabase.test'
    process.env.VITE_SUPABASE_ANON_KEY = 'clave-publica'
    delete process.env.VERCEL_DEPLOY_HOOK_URL
    delete process.env.DESPLIEGUE_LOCAL
  })
  afterEach(() => {
    delete process.env.VITE_SUPABASE_URL
    delete process.env.VITE_SUPABASE_ANON_KEY
  })

  it('sin sesión: 401', async () => {
    const r = await pedir()
    expect(r.status).toBe(401)
    expect(r.headers.get('cache-control')).toBe('no-store')
  })

  it('con un token inventado: 401', async () => {
    expect((await pedir('cualquier-cosa')).status).toBe(401)
  })

  it.each(['token-editor', 'token-revisor'])(
    '%s: 403 y no se crea ninguna publicación',
    async (t) => {
      const r = await pedir(t)
      expect(r.status).toBe(403)
      expect(await r.json()).toMatchObject({ ok: false, codigo: 'sinPermiso' })
      expect(inserciones).toEqual([])
    },
  )

  it('admin sin deploy hook configurado: 503 que nombra la variable que falta', async () => {
    const r = await pedir('token-admin')
    expect(r.status).toBe(503)
    expect((await r.json()).mensaje).toContain('VERCEL_DEPLOY_HOOK_URL')
    expect(inserciones).toEqual([])
  })
})
