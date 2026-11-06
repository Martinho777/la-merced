// Página de revisión del sistema de diseño, solo en desarrollo (/estilos). No entra al build de
// producción: la ruta se registra con import.meta.env.DEV. Los textos son de prueba, no van a i18n.

import { useEffect, useState, type ComponentType } from 'react'
import { ArrowRight, ChevronRight, Clock, Eye, Info, MapPin, Trash2 } from 'lucide-react'
import { BarraProgreso } from '@/componentes/BarraProgreso'
import { BarraSuperior } from '@/componentes/BarraSuperior'
import { Boton, type TamanoBoton, type VarianteBoton } from '@/componentes/Boton'
import { Insignia, type TonoInsignia } from '@/componentes/Insignia'
import { Tarjeta } from '@/componentes/Tarjeta'
import './PaginaEstilos.css'

type Tema = 'light' | 'contrast'

const ESTILOS_DE_TEXTO = [
  'display',
  'title-1',
  'title-2',
  'heading',
  'body-lg',
  'body',
  'body-strong',
  'small',
  'small-strong',
  'button',
  'bubble',
  'label',
  'caption',
  'marker',
]

const VARIANTES: { variante: VarianteBoton; nombre: string }[] = [
  { variante: 'primario', nombre: 'Primario' },
  { variante: 'acento', nombre: 'Acento' },
  { variante: 'secundario', nombre: 'Secundario' },
  { variante: 'fantasma', nombre: 'Fantasma' },
]

const TAMANOS: TamanoBoton[] = ['md', 'sm']

const TONOS: { tono: TonoInsignia; texto: string }[] = [
  { tono: 'neutral', texto: '50 min' },
  { tono: 'marca', texto: '3 / 12' },
  { tono: 'info', texto: 'Audio' },
  { tono: 'exito', texto: 'Visitado' },
  { tono: 'advertencia', texto: 'Atención' },
  { tono: 'error', texto: 'Sin conexión' },
]

// Secciones extra: cada bloque agrega la suya en ./secciones/ (exportando `Seccion`) sin tocar esta
// página. Se muestran al final, en orden alfabético de archivo.
const SECCIONES_EXTRA = Object.entries(
  import.meta.glob<ComponentType>('./secciones/*.tsx', { eager: true, import: 'Seccion' }),
)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([ruta, Seccion]) => ({ ruta, Seccion }))

const nada = () => {}

export function PaginaEstilos() {
  const [tema, setTema] = useState<Tema>('light')
  const [zona, setZona] = useState('principal')
  const [detalles, setDetalles] = useState(3)

  useEffect(() => {
    const raiz = document.documentElement
    if (tema === 'contrast') raiz.dataset.theme = 'contrast'
    else delete raiz.dataset.theme
    return () => {
      delete raiz.dataset.theme
    }
  }, [tema])

  return (
    <div className="pagina-estilos">
      <header className="pagina-estilos__cabecera">
        <p className="texto-label pagina-estilos__eyebrow">Solo desarrollo</p>
        <h1 className="texto-title-1">Sistema de diseño</h1>
        <p className="texto-small pagina-estilos__nota">
          Usa Tab para revisar el anillo de foco. El estado presionado se muestra forzado.
        </p>
        <div className="pagina-estilos__fila" role="group" aria-label="Tema">
          <Boton
            variante="secundario"
            tamano="sm"
            aria-pressed={tema === 'light'}
            onClick={() => setTema('light')}
          >
            Claro
          </Boton>
          <Boton
            variante="secundario"
            tamano="sm"
            aria-pressed={tema === 'contrast'}
            onClick={() => setTema('contrast')}
          >
            Alto contraste
          </Boton>
        </div>
      </header>

      <section className="pagina-estilos__seccion">
        <h2 className="texto-title-2">Tipografía</h2>
        {ESTILOS_DE_TEXTO.map((estilo) => (
          <div key={estilo} className="pagina-estilos__muestra-texto">
            <span className="texto-caption pagina-estilos__nota">{estilo}</span>
            <span className={`texto-${estilo}`}>Kaqchikel ch'ab'äl: La Merced</span>
          </div>
        ))}
      </section>

      <section className="pagina-estilos__seccion">
        <h2 className="texto-title-2">Boton</h2>
        {TAMANOS.map((tamano) =>
          VARIANTES.map(({ variante, nombre }) => (
            <div key={`${variante}-${tamano}`} className="pagina-estilos__grupo">
              <h3 className="texto-heading">
                {nombre} · {tamano}
              </h3>
              <div className="pagina-estilos__fila">
                <Boton variante={variante} tamano={tamano}>
                  Continuar
                </Boton>
                <Boton variante={variante} tamano={tamano} icono={ArrowRight}>
                  Con icono
                </Boton>
                <Boton variante={variante} tamano={tamano} data-presionado>
                  Presionado
                </Boton>
                <Boton variante={variante} tamano={tamano} disabled>
                  Deshabilitado
                </Boton>
                <Boton variante={variante} tamano={tamano} icono={ArrowRight} cargando>
                  Cargando
                </Boton>
                {variante === 'fantasma' && (
                  <Boton variante={variante} tamano={tamano} icono={Trash2} destructivo>
                    Borrar
                  </Boton>
                )}
              </div>
            </div>
          )),
        )}
        <div className="pagina-estilos__grupo">
          <h3 className="texto-heading">Ancho completo</h3>
          <Boton anchoCompleto>Sí, ver detalle</Boton>
        </div>
      </section>

      <section className="pagina-estilos__seccion">
        <h2 className="texto-title-2">Tarjeta</h2>
        <div className="pagina-estilos__lista">
          <Tarjeta titulo="En reposo" subtitulo="La experiencia completa" icono={MapPin} />
          <Tarjeta
            titulo="Presionable"
            subtitulo="Toca para elegir"
            icono={MapPin}
            final={<ChevronRight aria-hidden="true" />}
            onPresionar={nada}
          />
          <Tarjeta
            titulo="Presionada"
            subtitulo="Estado forzado"
            icono={MapPin}
            onPresionar={nada}
            forzarPresionada
          />
          <Tarjeta
            titulo="Fachada principal"
            subtitulo="Seleccionable: toca para cambiar"
            icono={Eye}
            final={<Insignia icono={Clock}>50 min</Insignia>}
            seleccionada={zona === 'principal'}
            onPresionar={() => setZona('principal')}
          />
          <Tarjeta
            titulo="Fachada secundaria"
            subtitulo="Seleccionable: toca para cambiar"
            icono={Eye}
            final={<Insignia icono={Clock}>20 min</Insignia>}
            seleccionada={zona === 'secundaria'}
            onPresionar={() => setZona('secundaria')}
          />
          <Tarjeta
            titulo="Interior"
            subtitulo="No disponible"
            icono={Eye}
            etiquetaNoDisponible="Próximamente"
            onPresionar={nada}
          />
        </div>
      </section>

      <section className="pagina-estilos__seccion">
        <h2 className="texto-title-2">Insignia</h2>
        <div className="pagina-estilos__fila">
          {TONOS.map(({ tono, texto }) => (
            <Insignia key={tono} tono={tono}>
              {texto}
            </Insignia>
          ))}
        </div>
        <div className="pagina-estilos__fila">
          {TONOS.map(({ tono, texto }) => (
            <Insignia key={tono} tono={tono} icono={Info}>
              {texto}
            </Insignia>
          ))}
        </div>
      </section>

      <section className="pagina-estilos__seccion">
        <h2 className="texto-title-2">BarraSuperior</h2>
        <div className="pagina-estilos__marco">
          <BarraSuperior etiqueta="Mapa" etiquetaAccesible="Volver al mapa" onVolver={nada} />
        </div>
        <div className="pagina-estilos__marco">
          <BarraSuperior
            etiqueta="Zonas"
            etiquetaAccesible="Volver a zonas"
            onVolver={nada}
            conBorde
          />
        </div>
      </section>

      <section className="pagina-estilos__seccion">
        <h2 className="texto-title-2">BarraProgreso</h2>
        <BarraProgreso
          valor={0}
          maximo={12}
          contador="0 / 12 detalles"
          etiquetaAccesible="Progreso vacío"
        />
        <BarraProgreso
          valor={detalles}
          maximo={12}
          contador={`${detalles} / 12 detalles`}
          etiquetaAccesible="Progreso del recorrido"
        />
        <BarraProgreso
          valor={12}
          maximo={12}
          contador="12 / 12 detalles"
          etiquetaAccesible="Progreso completo"
        />
        <div className="pagina-estilos__fila">
          <Boton
            variante="secundario"
            tamano="sm"
            disabled={detalles === 0}
            onClick={() => setDetalles((n) => n - 1)}
          >
            Anterior
          </Boton>
          <Boton
            variante="secundario"
            tamano="sm"
            disabled={detalles === 12}
            onClick={() => setDetalles((n) => n + 1)}
          >
            Siguiente
          </Boton>
        </div>
      </section>

      {SECCIONES_EXTRA.map(({ ruta, Seccion }) => (
        <Seccion key={ruta} />
      ))}
    </div>
  )
}
