import type { ReactNode } from 'react'
import './SantiBurbuja.css'

type Props = {
  children: ReactNode
  /** Hacia dónde apunta la cola: hacia Santi. */
  cola?: 'abajo' | 'arriba' | 'izquierda'
  className?: string
}

/**
 * Burbuja de diálogo de Santi (docs/diseno/componentes.md → Santi bubble). Una o dos frases cortas.
 * Se anuncia a los lectores de pantalla con aria-live="polite" cuando cambia su texto.
 */
export function SantiBurbuja({ children, cola = 'abajo', className }: Props) {
  const clases = ['santi-burbuja', 'texto-bubble', `santi-burbuja--cola-${cola}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <p className={clases} aria-live="polite">
      {children}
    </p>
  )
}
