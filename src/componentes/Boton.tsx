import type { ButtonHTMLAttributes, MouseEvent } from 'react'
import { LoaderCircle, type LucideIcon } from 'lucide-react'
import './Boton.css'

export type VarianteBoton = 'primario' | 'acento' | 'secundario' | 'fantasma'
export type TamanoBoton = 'md' | 'sm'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBoton
  tamano?: TamanoBoton
  icono?: LucideIcon
  /** Conserva la etiqueta y cambia el icono por un spinner; el botón no responde mientras tanto. */
  cargando?: boolean
  /** Solo para `fantasma`: acción destructiva, en color `error`. */
  destructivo?: boolean
  /** Ancho completo, para la acción principal al pie de la pantalla. */
  anchoCompleto?: boolean
}

export function Boton({
  variante = 'primario',
  tamano = 'md',
  icono: Icono,
  cargando = false,
  destructivo = false,
  anchoCompleto = false,
  type = 'button',
  className,
  onClick,
  children,
  ...resto
}: Props) {
  const clases = [
    'boton',
    'texto-button',
    `boton--${variante}`,
    `boton--${tamano}`,
    destructivo && 'boton--destructivo',
    anchoCompleto && 'boton--ancho-completo',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  // Mientras carga sigue siendo enfocable (no se pierde el foco), pero ignora los clics.
  function alPresionar(evento: MouseEvent<HTMLButtonElement>) {
    if (cargando) {
      evento.preventDefault()
      return
    }
    onClick?.(evento)
  }

  return (
    <button
      type={type}
      className={clases}
      aria-disabled={cargando || undefined}
      aria-busy={cargando || undefined}
      onClick={alPresionar}
      {...resto}
    >
      {cargando ? (
        <LoaderCircle className="boton__icono boton__spinner" aria-hidden="true" />
      ) : (
        Icono && <Icono className="boton__icono" aria-hidden="true" />
      )}
      {children}
    </button>
  )
}
