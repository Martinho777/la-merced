import { imagenSanti, type SantiPose } from '@/assets/santi'
import { TAMANOS_SANTI, type TamanoSanti } from '@/componentes/Santi/tamanos'
import './Santi.css'

type Props = {
  pose: SantiPose
  tamano?: TamanoSanti
  /** Texto alternativo. Por defecto es decorativo (alt=""). */
  alt?: string
  className?: string
}

export function Santi({ pose, tamano = 'md', alt = '', className }: Props) {
  const { src, srcSet } = imagenSanti(pose)
  const lado = TAMANOS_SANTI[tamano]
  const clases = ['santi', `santi--${tamano}`, className].filter(Boolean).join(' ')

  // Las imágenes son cuadradas: width y height iguales reservan el espacio y evitan saltos.
  return (
    <img
      className={clases}
      src={src}
      srcSet={srcSet}
      sizes={`${lado}px`}
      width={lado}
      height={lado}
      alt={alt}
      decoding="async"
    />
  )
}
