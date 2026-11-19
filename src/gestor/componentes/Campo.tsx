import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { useTranslation } from 'react-i18next'
import { CircleCheck, CircleDashed, Eye, EyeOff } from 'lucide-react'
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
  /**
   * Si se indica, el campo dice si es obligatorio u opcional y si ya está lleno ("Listo") o vacío;
   * vacío, su borde es punteado. Así se ve de un vistazo qué falta.
   */
  requisito?: 'obligatorio' | 'opcional'
}

/** Si un valor de formulario tiene contenido (sin contar espacios). */
const estaLleno = (valor: unknown) =>
  typeof valor === 'string' ? valor.trim() !== '' : typeof valor === 'number'

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
  requisito,
  lleno = false,
  multilinea,
  control,
}: Comunes & { lleno?: boolean; multilinea: boolean; control: (props: Control) => ReactNode }) {
  const { t } = useTranslation('gestor')
  const id = useId()
  const idAyuda = `${id}-ayuda`
  const idError = `${id}-error`
  const describe = [ayuda && idAyuda, error && idError].filter(Boolean).join(' ') || undefined

  return (
    <div className={requisito ? `campo ${lleno ? 'campo--lleno' : 'campo--vacio'}` : 'campo'}>
      <div className="campo__cabecera">
        <label className="campo__etiqueta texto-heading" htmlFor={id}>
          {etiqueta}
        </label>
        {requisito && (
          <>
            <span className={`campo__requisito campo__requisito--${requisito} texto-label`}>
              {t(`campo.${requisito}`)}
            </span>
            <span className="campo__estado texto-small-strong">
              {lleno ? (
                <CircleCheck className="campo__estado-icono" aria-hidden="true" />
              ) : (
                <CircleDashed className="campo__estado-icono" aria-hidden="true" />
              )}
              {t(lleno ? 'campo.lleno' : 'campo.vacio')}
            </span>
          </>
        )}
      </div>
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
  requisito,
  ...input
}: Comunes & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className'>) {
  return (
    <Contenedor
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      requisito={requisito}
      lleno={estaLleno(input.value)}
      multilinea={false}
      control={(props) => <input {...input} {...props} />}
    />
  )
}

/**
 * Campo de contraseña con un botón para mostrarla u ocultarla. El botón queda dentro del campo, a la
 * derecha, con área táctil de 48px; su nombre accesible dice qué hará al pulsarlo.
 */
export function CampoContrasena({
  etiqueta,
  ayuda,
  error,
  etiquetaMostrar,
  etiquetaOcultar,
  ...input
}: Comunes &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className' | 'type'> & {
    etiquetaMostrar: string
    etiquetaOcultar: string
  }) {
  const [visible, setVisible] = useState(false)
  const Icono = visible ? EyeOff : Eye

  return (
    <Contenedor
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      multilinea={false}
      control={(props) => (
        <span className="campo__con-boton">
          <input
            {...input}
            {...props}
            className={`${props.className} campo__control--con-boton`}
            type={visible ? 'text' : 'password'}
            // Sin corrector ni mayúscula automática al mostrarla en el teléfono.
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <button
            type="button"
            className="campo__boton"
            aria-label={visible ? etiquetaOcultar : etiquetaMostrar}
            aria-controls={props.id}
            onClick={() => setVisible((v) => !v)}
          >
            <Icono className="campo__boton-icono" aria-hidden="true" />
          </button>
        </span>
      )}
    />
  )
}

/** Campo de varias líneas (historia, qué ves). */
export function CampoArea({
  etiqueta,
  ayuda,
  error,
  requisito,
  ...area
}: Comunes & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'>) {
  return (
    <Contenedor
      etiqueta={etiqueta}
      ayuda={ayuda}
      error={error}
      requisito={requisito}
      lleno={estaLleno(area.value)}
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
