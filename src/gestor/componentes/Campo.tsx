import {
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import './Campo.css'

// Campos de formulario del gestor. El Design System no especifica formularios; estos siguen su regla
// para inputs (fondo surface-sunken, radio radius-sm, borde de control y el anillo de foco global) y
// viven solo en el gestor (decisión del equipo, nov. 2026).

type Comunes = {
  etiqueta: string
  /** Texto de ayuda bajo la etiqueta. */
  ayuda?: string
  /** Mensaje de error del campo; lo marca como inválido. */
  error?: string
}

type Control = {
  id: string
  className: string
  'aria-invalid': true | undefined
  'aria-describedby': string | undefined
}

function Contenedor({
  etiqueta,
  ayuda,
  error,
  multilinea,
  control,
}: Comunes & { multilinea: boolean; control: (props: Control) => ReactNode }) {
  const id = useId()
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`
  const describe = [ayuda && idAyuda, error && idError].filter(Boolean).join(' ') || undefined

  return (
    <div className="campo">
      <label className="campo__etiqueta texto-body-strong" htmlFor={id}>
        {etiqueta}
      </label>
      {ayuda && (
        <p id={idAyuda} className="campo__ayuda texto-small">
          {ayuda}
        </p>
      )}
      {control({
        id,
        className: multilinea
          ? 'campo__control campo__control--area texto-body'
          : 'campo__control texto-body',
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describe,
      })}
      {error && (
        <p id={idError} className="campo__error texto-small">
          {error}
        </p>
      )}
    </div>
  )
}

/** Campo de una línea. */
export function Campo({
  etiqueta,
  ayuda,
  error,
  ...input
}: Comunes & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'>) {
  return (
    <Contenedor
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      multilinea={false}
      control={(props) => <input {...input} {...props} />}
    />
  )
}

/** Campo de varias líneas (historia, qué ves). */
export function CampoArea({
  etiqueta,
  ayuda,
  error,
  ...area
}: Comunes & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'>) {
  return (
    <Contenedor
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      multilinea
      control={(props) => <textarea {...area} {...props} />}
    />
  )
}

/** Lista desplegable de opciones (nivel de confianza, tipo de fuente). */
export function Selector({
  etiqueta,
  ayuda,
  error,
  opciones,
  ...select
}: Comunes &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className'> & {
    opciones: readonly { valor: string; texto: string }[]
  }) {
  return (
    <Contenedor
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      multilinea={false}
      control={(props) => (
        <select {...select} {...props}>
          {opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.texto}
            </option>
          ))}
        </select>
      )}
    />
  )
}
