import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import './Insignia.css'

export type TonoInsignia = 'neutral' | 'marca' | 'info' | 'exito' | 'advertencia' | 'error'

type Props = {
  tono?: TonoInsignia
  icono?: LucideIcon
  className?: string
  children: ReactNode
}

/** Insignia o chip: tiempos ("50 min"), conteos ("3 / 12") y "Próximamente". */
export function Insignia({ tono = 'neutral', icono: Icono, className, children }: Props) {
  const clases = ['insignia', 'texto-small-strong', `insignia--${tono}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={clases}>
      {Icono && <Icono className="insignia__icono" aria-hidden="true" />}
      {children}
    </span>
  )
}
