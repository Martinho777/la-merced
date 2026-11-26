import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import '@/i18n'
import '@/gestor/i18n'
import type { DetallePunto, FichaGestor } from '@/datos/gestor'
import { Campo } from '@/gestor/componentes/Campo'
import { faltantesFoto } from '@/gestor/fotos'
import {
  avanceDe,
  conBorradores,
  estadoDePaso,
  pasoDe,
  requisitos,
  requisitosDeIdioma,
  type ResumenMedios,
} from '@/gestor/pasos'

const ficha = (campos: Partial<FichaGestor> = {}): FichaGestor => ({
  id: 'f1',
  estado: 'borrador',
  titulo: 'Nicho central',
  que_ves: 'La Virgen en el nicho.',
  historia: 'Texto.',
  dato_santi: '',
  transcripcion: '',
  revision: null,
  audio: null,
  ...campos,
})
const punto = (
  es: FichaGestor | null,
  en: FichaGestor | null = null,
  cak: FichaGestor | null = null,
): DetallePunto => ({
  id: 'p1',
  slug: 'nicho',
  orden: 2,
  zona: 'fachada-principal',
  fichas: { es, en, cak },
})
const completos: ResumenMedios = { fotos: { detalle: true, historicas: 0 }, fuentes: 1 }

describe('pasos del editor', () => {
  it('textos: completo con nombre, qué ves e historia; falta algo si no', () => {
    expect(estadoDePaso('textos', punto(ficha()), completos)).toBe('opcional')
    // Sin kaqchikel sigue faltando algo opcional; con los tres idiomas, completo.
    expect(estadoDePaso('textos', punto(ficha({ dato_santi: 'Dato' }), ficha()), completos)).toBe(
      'opcional',
    )
    expect(
      estadoDePaso('textos', punto(ficha({ dato_santi: 'Dato' }), ficha(), ficha()), completos),
    ).toBe('completo')
    expect(estadoDePaso('textos', punto(ficha({ historia: ' ' })), completos)).toBe('pendiente')
    expect(estadoDePaso('textos', punto(null), completos)).toBe('pendiente')
  })

  it('la narración es opcional', () => {
    expect(estadoDePaso('narracion', punto(ficha()), completos)).toBe('opcional')
    const conAudio = ficha({ audio: { id: 'a', ruta: 'r', url: 'u', duracionS: 1 } })
    // Con audio pero sin transcripción todavía falta lo opcional.
    expect(estadoDePaso('narracion', punto(conAudio), completos)).toBe('opcional')
    expect(
      estadoDePaso('narracion', punto({ ...conAudio, transcripcion: 'Texto' }), completos),
    ).toBe('completo')
  })

  it('fotos: falta la del detalle; las históricas son opcionales', () => {
    const sinDetalle = { ...completos, fotos: { detalle: false, historicas: 3 } }
    expect(estadoDePaso('fotos', punto(ficha()), sinDetalle)).toBe('pendiente')
    expect(estadoDePaso('fotos', punto(ficha()), completos)).toBe('opcional')
    // Mientras cargan, se considera que falta.
    expect(estadoDePaso('fotos', punto(ficha()), { fotos: null, fuentes: null })).toBe('pendiente')
  })

  it('fuentes: necesita al menos una', () => {
    expect(estadoDePaso('fuentes', punto(ficha()), { ...completos, fuentes: 0 })).toBe('pendiente')
    expect(estadoDePaso('fuentes', punto(ficha()), completos)).toBe('completo')
  })

  it('la revisión está completa cuando la ficha en español está aprobada', () => {
    expect(estadoDePaso('revision', punto(ficha()), completos)).toBe('pendiente')
    expect(estadoDePaso('revision', punto(ficha({ estado: 'aprobado' })), completos)).toBe(
      'completo',
    )
  })

  it('la lista de revisión dice qué falta y a qué paso ir', () => {
    const lista = requisitos(punto(ficha({ que_ves: '' })), { ...completos, fuentes: 0 })
    const faltan = lista.filter((r) => !r.cumplido && r.obligatorio).map((r) => r.clave)
    expect(faltan).toEqual(['queVesEs', 'fuentes'])
    expect(lista.find((r) => r.clave === 'fuentes')?.paso).toBe('fuentes')
  })

  it('el paso de la URL: uno válido o el primero', () => {
    expect(pasoDe('fotos')).toBe('fotos')
    expect(pasoDe('otro')).toBe('textos')
    expect(pasoDe(null)).toBe('textos')
  })
})

describe('línea de avance', () => {
  it('cuenta lo cumplido, obligatorio y opcional, sobre el total', () => {
    expect(avanceDe(punto(ficha()), completos)).toEqual({ hechos: 5, total: 11 })
    expect(avanceDe(punto(null), { fotos: null, fuentes: null })).toEqual({ hechos: 0, total: 11 })
  })

  it('avanza con lo escrito aunque no esté guardado', () => {
    const vacio = { titulo: '', que_ves: '', historia: '', dato_santi: '', transcripcion: '' }
    const borradores = {
      es: {
        titulo: 'Nicho',
        que_ves: 'Algo',
        historia: 'Texto',
        dato_santi: 'Dato',
        transcripcion: '',
      },
      en: vacio,
      cak: vacio,
    }
    const conTexto = conBorradores(punto(null), borradores)
    expect(avanceDe(conTexto, completos).hechos).toBe(avanceDe(punto(null), completos).hechos + 4)
    // Un idioma sin ficha y sin nombre escrito sigue sin ficha.
    expect(conTexto.fichas.en).toBeNull()
  })
})

describe('datos que le faltan a una foto', () => {
  const foto = { textoAlternativoEs: 'Portada', credito: 'Archivo', derechos: 'Autorizada' }

  it('la del detalle solo necesita el texto alternativo', () => {
    expect(faltantesFoto({ ...foto, tipo: 'foto', credito: '', derechos: '' })).toEqual([])
    expect(faltantesFoto({ ...foto, tipo: 'foto', textoAlternativoEs: ' ' })).toEqual([
      'textoAlternativo',
    ])
  })

  it('una histórica también necesita crédito y permiso', () => {
    expect(faltantesFoto({ ...foto, tipo: 'foto_historica' })).toEqual([])
    expect(faltantesFoto({ ...foto, tipo: 'foto_historica', credito: '', derechos: '' })).toEqual([
      'credito',
      'derechos',
    ])
  })
})

describe('campo con requisito', () => {
  const campo = (value: string) =>
    renderToStaticMarkup(
      <Campo etiqueta="Nombre" requisito="obligatorio" value={value} onChange={() => {}} />,
    )

  it('vacío: dice obligatorio y por llenar, con borde punteado', () => {
    const html = campo('  ')
    expect(html).toContain('campo--vacio')
    expect(html).toContain('Obligatorio')
    expect(html).toContain('Por llenar')
  })

  it('lleno: dice listo', () => {
    const html = campo('Nicho central')
    expect(html).toContain('campo--lleno')
    expect(html).toContain('Listo')
  })

  it('sin requisito no muestra nada de esto', () => {
    const html = renderToStaticMarkup(<Campo etiqueta="Correo" value="" onChange={() => {}} />)
    expect(html).not.toContain('Por llenar')
  })
})

describe('revisión por idioma', () => {
  it('lista la ficha del idioma elegido y, aparte, lo común a todos', () => {
    const datos = punto(ficha(), ficha({ historia: '' }), null)
    const en = requisitosDeIdioma(datos, completos, 'en')
    const faltan = (lista: typeof en) =>
      lista.filter((r) => !r.cumplido && r.obligatorio).map((r) => r.clave)
    expect(faltan(en.filter((r) => !r.comun))).toEqual(['historia'])
    // Sin ficha en kaqchikel: faltan sus textos obligatorios.
    expect(faltan(requisitosDeIdioma(datos, completos, 'cak'))).toEqual([
      'nombre',
      'queVes',
      'historia',
    ])
    // Fotos y fuentes son del punto: iguales en todos los idiomas.
    expect(en.filter((r) => r.comun).map((r) => r.clave)).toEqual([
      'fotoDetalle',
      'fotosHistoricas',
      'fuentes',
    ])
  })
})
