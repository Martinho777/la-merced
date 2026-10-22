import { useEffect, useState } from 'react'
import { HABLA, HABLA_O, type SantiPose } from '@/assets/santi'
import { Santi } from '@/componentes/Santi/Santi'
import { INTERVALO_HABLA_MS, secuenciaHabla } from '@/componentes/Santi/habla'
import type { TamanoSanti } from '@/componentes/Santi/tamanos'
import './SantiHablando.css'

/** Cuadros del cuerpo completo: boca cerrada (reposo), tres aperturas y la "o". */
const CUADROS: readonly SantiPose[] = [...HABLA, HABLA_O]

type Props = {
  /** Cuánto mueve la boca al aparecer (ms); después queda en reposo, respirando. */
  duracionMs: number
  tamano?: TamanoSanti
  className?: string
}

const prefiereMenosMovimiento = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

/**
 * Santi de cuerpo entero que habla al aparecer y luego respira. Todos los cuadros se cargan desde
 * el inicio, apilados, y solo se ve uno: así el cambio de boca no parpadea. Decorativo: lo que dice
 * va en su burbuja. Con movimiento reducido no mueve la boca ni respira.
 */
export function SantiHablando({ duracionMs, tamano = 'lg', className }: Props) {
  const [cuadro, setCuadro] = useState(0)

  useEffect(() => {
    if (prefiereMenosMovimiento()) return
    const secuencia = secuenciaHabla(duracionMs)
    let paso = 0
    const intervalo = window.setInterval(() => {
      setCuadro(secuencia[paso] ?? 0)
      paso += 1
      if (paso >= secuencia.length) window.clearInterval(intervalo)
    }, INTERVALO_HABLA_MS)
    return () => window.clearInterval(intervalo)
  }, [duracionMs])

  return (
    <span className={['santi-hablando', className].filter(Boolean).join(' ')}>
      {CUADROS.map((pose, i) => (
        <Santi
          key={pose}
          pose={pose}
          tamano={tamano}
          className={i === cuadro ? 'santi-hablando__cuadro--activo' : 'santi-hablando__cuadro'}
        />
      ))}
    </span>
  )
}
