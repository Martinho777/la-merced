import { describe, expect, it, vi } from 'vitest'
import type { DatosPublicos } from '@/publicacion/instantanea'
import { sha256 } from '@/publicacion/instantanea'
import {
  publicar,
  PublicacionEnCurso,
  tokenDe,
  VENCE_EN_CURSO_MS,
  type PuertosPublicacion,
  type RolPublicacion,
} from '@/publicacion/publicar'

const DATOS: DatosPublicos = {
  zonas: [],
  puntos: [
    {
      id: 'p1',
      slug: 'portada',
      orden: 1,
      es_esencial: true,
      pos_x: 0.5,
      pos_y: 0.5,
      tiene_3d: false,
      zona: 'fachada-principal',
      fichas: [
        {
          idioma: 'es',
          estado: 'aprobado',
          titulo: 'Portada',
          que_ves: null,
          historia: null,
          dato_santi: null,
          transcripcion: null,
          audio_id: 'a1',
        },
        {
          idioma: 'en',
          estado: 'revision',
          titulo: 'Pendiente',
          que_ves: null,
          historia: null,
          dato_santi: null,
          transcripcion: null,
          audio_id: null,
        },
      ],
      medios: [
        {
          id: 'a1',
          tipo: 'audio',
          ruta: 'audios/portada-es.mp3',
          idioma: 'es',
          orden: 0,
          credito: null,
          fecha_original: null,
          derechos: null,
          duracion_s: 10,
          texto_alternativo: {},
        },
      ],
      fuentes: [],
    },
  ],
  textos: [],
}

/** Puertos simulados: una "base" en memoria con las publicaciones y lo desplegado. */
function simulados(rol: RolPublicacion | undefined, cambios: Partial<PuertosPublicacion> = {}) {
  const publicaciones: {
    id: string
    version: number
    estado: string
    contenido?: string
    sha256?: string
    error?: string
  }[] = [
    {
      id: 'previa',
      version: 1,
      estado: 'publicada',
      contenido: '{"version":1}',
      sha256: 'x'.repeat(64),
    },
  ]
  const desplegados: { version: number; sha256: string; contenido: string }[] = []
  const puertos: PuertosPublicacion = {
    hayDespliegue: true,
    rolDe: vi.fn(async () => rol),
    liberarAtascadas: vi.fn(async () => {}),
    iniciar: vi.fn(async () => {
      if (publicaciones.some((p) => p.estado === 'generando' || p.estado === 'desplegando')) {
        throw new PublicacionEnCurso()
      }
      const nueva = {
        id: `p${publicaciones.length + 1}`,
        version: publicaciones.length + 1,
        estado: 'generando',
      }
      publicaciones.push(nueva)
      return nueva
    }),
    leerPublico: vi.fn(async () => DATOS),
    aUrl: (ruta) => `https://medios.test/${ruta}`,
    medioAccesible: vi.fn(async () => true),
    guardarGenerada: vi.fn(async (_t, id, datos) => {
      Object.assign(
        publicaciones.find((p) => p.id === id)!,
        { ...datos, estado: 'desplegando' },
      )
    }),
    desplegar: vi.fn(async (datos) => {
      desplegados.push(datos)
    }),
    marcarFallida: vi.fn(async (_t, id, error) => {
      Object.assign(
        publicaciones.find((p) => p.id === id)!,
        { estado: 'fallida', error },
      )
    }),
    ahora: () => new Date('2026-11-25T12:00:00Z'),
    ...cambios,
  }
  return { puertos, publicaciones, desplegados }
}

describe('autorización de «Publicar» en el servidor', () => {
  it('sin token responde 401 y no toca nada', async () => {
    const { puertos } = simulados('admin')
    const r = await publicar(null, puertos)
    expect(r.estado).toBe(401)
    expect(puertos.iniciar).not.toHaveBeenCalled()
  })

  it('un token que no es una sesión válida responde 401', async () => {
    const r = await publicar('falso', simulados(undefined).puertos)
    expect(r).toMatchObject({ estado: 401, cuerpo: { codigo: 'sinSesion' } })
  })

  it.each(['editor', 'revisor', null] as const)(
    '%s no puede publicar aunque llame directo a la API (403)',
    async (rol) => {
      const { puertos, desplegados } = simulados(rol)
      const r = await publicar('token', puertos)
      expect(r).toMatchObject({ estado: 403, cuerpo: { codigo: 'sinPermiso' } })
      expect(puertos.iniciar).not.toHaveBeenCalled()
      expect(puertos.leerPublico).not.toHaveBeenCalled()
      expect(desplegados).toEqual([])
    },
  )

  it('lee el token del encabezado Authorization', () => {
    expect(tokenDe('Bearer abc.def')).toBe('abc.def')
    expect(tokenDe('bearer   xyz')).toBe('xyz')
    expect(tokenDe('Basic abc')).toBeNull()
    expect(tokenDe(null)).toBeNull()
  })
})

describe('publicación por un admin', () => {
  it('genera, guarda con su huella y despliega exactamente ese JSON (202)', async () => {
    const { puertos, publicaciones, desplegados } = simulados('admin')
    const r = await publicar('token', puertos)
    expect(r.estado).toBe(202)
    const cuerpo = r.cuerpo
    if (!cuerpo.ok) throw new Error('esperaba éxito')
    const fila = publicaciones.find((p) => p.id === cuerpo.id)!
    expect(fila.estado).toBe('desplegando')
    expect(desplegados).toHaveLength(1)
    expect(desplegados[0]?.contenido).toBe(fila.contenido)
    expect(await sha256(fila.contenido!)).toBe(cuerpo.sha256)
    // Lo aprobado entra; lo que está en revisión no.
    expect(fila.contenido).toContain('Portada')
    expect(fila.contenido).not.toContain('Pendiente')
    expect(cuerpo.resumen).toMatchObject({ fichas: 1, audios: 1 })
    // La publicada anterior no cambia.
    expect(publicaciones[0]?.estado).toBe('publicada')
  })

  it('una segunda publicación mientras otra sigue en curso responde 409', async () => {
    const { puertos } = simulados('admin')
    expect((await publicar('token', puertos)).estado).toBe(202)
    const segunda = await publicar('token', puertos)
    expect(segunda).toMatchObject({ estado: 409, cuerpo: { codigo: 'enCurso' } })
  })

  it('libera antes las publicaciones atascadas (más viejas que el plazo)', async () => {
    const { puertos } = simulados('admin')
    await publicar('token', puertos)
    expect(puertos.liberarAtascadas).toHaveBeenCalledWith(
      'token',
      new Date(new Date('2026-11-25T12:00:00Z').getTime() - VENCE_EN_CURSO_MS),
    )
  })

  it('sin despliegue configurado responde 503 sin crear nada', async () => {
    const { puertos, publicaciones } = simulados('admin', { hayDespliegue: false })
    const r = await publicar('token', puertos)
    expect(r).toMatchObject({ estado: 503, cuerpo: { codigo: 'sinDespliegue' } })
    expect(publicaciones).toHaveLength(1)
  })

  it('si un medio no se puede abrir, falla sin desplegar y conserva la última publicada', async () => {
    const { puertos, publicaciones, desplegados } = simulados('admin', {
      medioAccesible: vi.fn(async () => false),
    })
    const r = await publicar('token', puertos)
    expect(r).toMatchObject({ estado: 502, cuerpo: { codigo: 'mediosInaccesibles' } })
    expect(desplegados).toEqual([])
    expect(publicaciones.at(-1)?.estado).toBe('fallida')
    expect(publicaciones[0]).toMatchObject({ estado: 'publicada', contenido: '{"version":1}' })
  })

  it('si Vercel rechaza el despliegue, queda fallida y la anterior sigue publicada', async () => {
    const { puertos, publicaciones } = simulados('admin', {
      desplegar: vi.fn(async () => {
        throw new Error('Vercel rechazó el despliegue (HTTP 500).')
      }),
    })
    const r = await publicar('token', puertos)
    expect(r).toMatchObject({ estado: 500, cuerpo: { codigo: 'fallo' } })
    expect(publicaciones.at(-1)).toMatchObject({
      estado: 'fallida',
      error: expect.stringContaining('HTTP 500'),
    })
    expect(publicaciones[0]?.estado).toBe('publicada')
  })

  it('si la base no responde al leer el contenido, falla sin desplegar', async () => {
    const { puertos, desplegados } = simulados('admin', {
      leerPublico: vi.fn(async () => {
        throw new Error('timeout')
      }),
    })
    expect((await publicar('token', puertos)).estado).toBe(500)
    expect(desplegados).toEqual([])
  })
})
