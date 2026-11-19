import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FichaGestor } from '@/datos/gestor'

// Cliente simulado: registra cada llamada como "tabla.metodo" y responde según la tabla.
const llamadas: { metodo: string; args: unknown[] }[] = []
const errores: Partial<Record<'upload' | 'medios.insert' | 'fichas.update', string>> = {}

function tabla(nombre: string) {
  const c: Record<string, unknown> = {}
  let operacion = ''
  for (const metodo of ['insert', 'update', 'delete', 'eq', 'select']) {
    c[metodo] = (...args: unknown[]) => {
      if (metodo !== 'eq' && metodo !== 'select') operacion = metodo
      llamadas.push({ metodo: `${nombre}.${metodo}`, args })
      return c
    }
  }
  c.single = async () => {
    const error = errores[`${nombre}.${operacion}` as keyof typeof errores]
    if (error) return { data: null, error: { message: error } }
    if (nombre === 'medios') return { data: { id: 'audio-nuevo' }, error: null }
    const cambios = llamadas.findLast((l) => l.metodo === 'fichas.update')?.args[0] as {
      audio_id: string | null
      estado: string
    }
    return {
      data: {
        id: 'f1',
        idioma: 'es',
        estado: cambios.estado,
        titulo: 'Portada',
        que_ves: null,
        historia: null,
        dato_santi: null,
        revisado_en: null,
        revisor: null,
        audio: cambios.audio_id
          ? { id: cambios.audio_id, ruta: 'audios/nuevo.mp3', duracion_s: 62.5 }
          : null,
      },
      error: null,
    }
  }
  c.then = (resolver: (v: unknown) => unknown) => resolver({ error: null })
  return c
}

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (nombre: string) => tabla(nombre),
    storage: {
      from: () => ({
        upload: async (...args: unknown[]) => {
          llamadas.push({ metodo: 'storage.upload', args })
          return { error: errores.upload ? { message: errores.upload } : null }
        },
        remove: async (...args: unknown[]) => {
          llamadas.push({ metodo: 'storage.remove', args })
          return { error: null }
        },
        getPublicUrl: (ruta: string) => ({ data: { publicUrl: `https://cdn/${ruta}` } }),
      }),
    },
  },
}))

const { quitarAudioFicha, rutaAudio, subirAudioFicha } = await import('@/datos/audios')

const punto = { id: 'p1', slug: 'portada' }
const audio = {
  archivo: new Blob(['x'], { type: 'audio/mpeg' }),
  tipoMime: 'audio/mpeg' as const,
  duracionS: 62.5,
}
const ficha = (estado: FichaGestor['estado'], conAudio = false): FichaGestor => ({
  id: 'f1',
  estado,
  titulo: 'Portada',
  que_ves: '',
  historia: '',
  dato_santi: '',
  revision: null,
  audio: conAudio ? { id: 'audio-viejo', ruta: 'audios/viejo.mp3', url: 'x', duracionS: 10 } : null,
})
const metodos = () => llamadas.map((l) => l.metodo)

describe('narración de una ficha en el gestor', () => {
  beforeEach(() => {
    llamadas.length = 0
    for (const clave of Object.keys(errores)) delete errores[clave as keyof typeof errores]
  })

  it('la ruta va en audios/ con el punto, el idioma y la extensión del formato', () => {
    expect(rutaAudio('portada', 'en', 'audio/mp4', 1)).toBe('audios/portada-en-1.m4a')
    expect(rutaAudio('portada', 'es', 'audio/mpeg', 1)).toBe('audios/portada-es-1.mp3')
  })

  it('sube el archivo, lo registra con idioma y duración, y lo asocia a la ficha', async () => {
    const guardada = await subirAudioFicha(punto, 'es', ficha('borrador'), audio)
    expect(metodos().slice(0, 3)).toEqual(['storage.upload', 'medios.insert', 'medios.select'])
    expect(llamadas.find((l) => l.metodo === 'medios.insert')?.args[0]).toMatchObject({
      tipo: 'audio',
      idioma: 'es',
      punto_id: 'p1',
      duracion_s: 62.5,
    })
    expect(llamadas.find((l) => l.metodo === 'fichas.update')?.args[0]).toEqual({
      audio_id: 'audio-nuevo',
      estado: 'borrador',
    })
    expect(guardada.audio).toMatchObject({ id: 'audio-nuevo', duracionS: 62.5 })
  })

  it('en una ficha publicada, cambiar la narración la devuelve a revisión', async () => {
    const guardada = await subirAudioFicha(punto, 'es', ficha('aprobado'), audio)
    expect(guardada.estado).toBe('revision')
  })

  it('al reemplazar, borra el audio anterior después de asociar el nuevo', async () => {
    await subirAudioFicha(punto, 'es', ficha('borrador', true), audio)
    const asociar = metodos().indexOf('fichas.update')
    const borrarViejo = llamadas.findIndex(
      (l) => l.metodo === 'medios.eq' && l.args[1] === 'audio-viejo',
    )
    expect(borrarViejo).toBeGreaterThan(asociar)
    expect(llamadas).toContainEqual({ metodo: 'storage.remove', args: [['audios/viejo.mp3']] })
  })

  it('si no se puede registrar, borra el archivo subido', async () => {
    errores['medios.insert'] = 'sin permiso'
    await expect(subirAudioFicha(punto, 'es', ficha('borrador'), audio)).rejects.toThrow()
    expect(metodos()).toContain('storage.remove')
    expect(metodos()).not.toContain('fichas.update')
  })

  it('si no se puede asociar a la ficha, borra el registro y el archivo nuevos', async () => {
    errores['fichas.update'] = 'sin permiso'
    await expect(subirAudioFicha(punto, 'es', ficha('borrador', true), audio)).rejects.toThrow()
    expect(metodos()).toContain('medios.delete')
    // El audio anterior no se toca: la ficha sigue usándolo.
    expect(llamadas).not.toContainEqual({ metodo: 'storage.remove', args: [['audios/viejo.mp3']] })
  })

  it('si la subida falla, no registra nada', async () => {
    errores.upload = 'red'
    await expect(subirAudioFicha(punto, 'es', ficha('borrador'), audio)).rejects.toThrow()
    expect(metodos()).toEqual(['storage.upload'])
  })

  it('quitar la narración deja la ficha sin audio y borra el archivo', async () => {
    const guardada = await quitarAudioFicha(ficha('aprobado', true))
    expect(llamadas.find((l) => l.metodo === 'fichas.update')?.args[0]).toEqual({
      audio_id: null,
      estado: 'revision',
    })
    expect(guardada.audio).toBeNull()
    expect(llamadas).toContainEqual({ metodo: 'storage.remove', args: [['audios/viejo.mp3']] })
  })
})
