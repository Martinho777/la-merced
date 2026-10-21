import { Check } from 'lucide-react'
import { Insignia } from '@/componentes/Insignia'
import { esSeleccionable, type Opcion } from '@/componentes/opciones'
import './Tarjeta.css'
import './GrupoOpciones.css'

type Props<T extends string> = {
  /** Pregunta del grupo, para lectores de pantalla (la pantalla ya la muestra como título). */
  leyenda: string
  /** Atributo `name` de los radios; único por pantalla. */
  nombre: string
  opciones: readonly Opcion<T>[]
  valor: T | null
  onCambiar: (valor: T) => void
  /** `lista`: una columna. `cuadricula`: dos columnas; las opciones destacadas ocupan las dos. */
  disposicion?: 'lista' | 'cuadricula'
}

/**
 * Grupo de radios con forma de Tarjeta (docs/diseno/componentes.md → Card): fieldset con leyenda
 * oculta y un input type="radio" real por opción, así que teclado (flechas, Tab) y lectores de
 * pantalla funcionan como en cualquier formulario.
 */
export function GrupoOpciones<T extends string>({
  leyenda,
  nombre,
  opciones,
  valor,
  onCambiar,
  disposicion = 'lista',
}: Props<T>) {
  return (
    <fieldset className={`grupo-opciones grupo-opciones--${disposicion}`}>
      <legend className="visualmente-oculto">{leyenda}</legend>
      {opciones.map((opcion) => {
        const seleccionable = esSeleccionable(opcion)
        const seleccionada = seleccionable && opcion.valor === valor
        const clases = [
          'tarjeta',
          'grupo-opciones__opcion',
          seleccionable && 'tarjeta--presionable',
          seleccionada && 'tarjeta--seleccionada',
          !seleccionable && 'tarjeta--no-disponible',
          opcion.destacada && 'grupo-opciones__opcion--destacada',
        ]
          .filter(Boolean)
          .join(' ')

        return (
          <label key={opcion.valor} className={clases}>
            <input
              type="radio"
              className="visualmente-oculto"
              name={nombre}
              value={opcion.valor}
              checked={seleccionada}
              disabled={!seleccionable}
              onChange={() => seleccionable && onCambiar(opcion.valor)}
            />
            <span className="tarjeta__contenido grupo-opciones__contenido">
              <span className="grupo-opciones__cabecera">
                <span className="tarjeta__textos">
                  <span className="tarjeta__titulo texto-heading">{opcion.titulo}</span>
                  {opcion.subtitulo && (
                    <span className="tarjeta__subtitulo texto-small">{opcion.subtitulo}</span>
                  )}
                </span>
                {seleccionada && <Check className="tarjeta__check" aria-hidden="true" />}
              </span>
              {opcion.contenido}
            </span>
            {!seleccionable && (
              <Insignia className="grupo-opciones__insignia">
                {opcion.etiquetaNoDisponible}
              </Insignia>
            )}
          </label>
        )
      })}
    </fieldset>
  )
}
