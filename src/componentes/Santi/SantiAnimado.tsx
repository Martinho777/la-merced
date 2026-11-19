import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { HABLA, HABLA_O, type SantiPose } from '@/assets/santi'
import { Santi } from '@/componentes/Santi/Santi'
import { INTERVALO_HABLA_MS, secuenciaHabla } from '@/componentes/Santi/habla'
import type { TamanoSanti } from '@/componentes/Santi/tamanos'
import { cuadroDeNivel } from '@/componentes/Santi/voz'
import { useMovimientoReducido } from '@/visitante/movimiento'
import './SantiAnimado.css'

export type AnimacionSanti = 'reposo' | 'saludo' | 'habla' | 'senalar' | 'celebracion'

/** Cuadros de habla del cuerpo entero: pico cerrado, tres aperturas y la "o". */
const CUADROS_HABLA: readonly SantiPose[] = [...HABLA, HABLA_O]
const POSE_CELEBRACION: SantiPose = 'celebrate'

type Props = {
  /** Pose de reposo, la que se ve entre animaciones. */
  pose: SantiPose
  animacion: AnimacionSanti
  tamano?: TamanoSanti
  className?: string
  /** Habla al ritmo de un audio: nivel de 0 a 1 en cada cuadro (ver voz.ts). */
  nivelVoz?: () => number
  /** Habla sin audio durante este tiempo (ms), con un patrón de boca; luego cierra el pico. */
  duracionHablaMs?: number
  /** Animaciones que puede llegar a hacer: sus imágenes se cargan desde el inicio, sin parpadeo. */
  preparar?: readonly AnimacionSanti[]
  /** Fin de una animación de una sola vez (saludo, señalar, celebración). */
  alTerminar?: () => void
}

// Movimiento de Santi (docs/diseno/sistema-de-diseno.md → Motion): entradas y celebraciones de 400 a
// 600 ms con back.out(1.6). No hay tokens para esas duraciones; los desplazamientos sí salen de los
// tokens de espacio (--space-*), leídos del CSS para no duplicar valores.
const DURACION_SANTI = 0.5
const CURVA_SANTI = 'back.out(1.6)'
const COLORES_CONFETI = ['rojo', 'amarillo', 'cielo', 'blanco'] as const
const PIEZAS_CONFETI = 26

function token(elemento: Element, nombre: string): number {
  return Number.parseFloat(getComputedStyle(elemento).getPropertyValue(nombre)) || 0
}

function posesDe(pose: SantiPose, animaciones: readonly AnimacionSanti[]): SantiPose[] {
  const poses = new Set<SantiPose>([pose])
  if (animaciones.includes('habla')) CUADROS_HABLA.forEach((p) => poses.add(p))
  if (animaciones.includes('celebracion')) poses.add(POSE_CELEBRACION)
  return [...poses]
}

/**
 * Santi animado con GSAP a partir de sus imágenes: reposo (respira), saludo, habla (por volumen o con
 * un patrón), señalar y celebración (salto y confeti). Los cuadros se apilan y solo se ve uno, así que
 * cambiar de boca o de pose no parpadea. Con movimiento reducido no se mueve: queda en su pose (y al
 * celebrar solo cambia de pose un momento, sin salto ni confeti). Decorativo: lo que dice va en texto.
 */
export function SantiAnimado({
  pose,
  animacion,
  tamano = 'md',
  className,
  nivelVoz,
  duracionHablaMs,
  preparar = [],
  alTerminar,
}: Props) {
  const reducido = useMovimientoReducido()
  const raiz = useRef<HTMLSpanElement>(null)
  const cuerpo = useRef<HTMLSpanElement>(null)
  const confeti = useRef<HTMLSpanElement>(null)
  // Las funciones de props cambian en cada render; las animaciones leen la última sin reiniciarse.
  const voz = useRef(nivelVoz)
  const terminar = useRef(alTerminar)
  useLayoutEffect(() => {
    voz.current = nivelVoz
    terminar.current = alTerminar
  })

  const poses = posesDe(pose, [...preparar, animacion])

  function mostrar(visible: SantiPose) {
    for (const cuadro of raiz.current?.querySelectorAll<HTMLElement>('[data-pose]') ?? []) {
      cuadro.toggleAttribute('data-activo', cuadro.dataset.pose === visible)
    }
  }

  // Antes de pintar: el cuadro de reposo visible (sin esto, ningún cuadro se vería al montar).
  useLayoutEffect(() => mostrar(pose))

  useEffect(() => {
    const elemento = cuerpo.current
    if (!elemento) return
    const fin = () => terminar.current?.()

    if (reducido) {
      gsap.set(elemento, { clearProps: 'transform' })
      if (animacion !== 'celebracion') {
        mostrar(pose)
        if (animacion === 'saludo' || animacion === 'senalar') fin()
        return
      }
      // Celebración sin movimiento: cambia de pose un momento y vuelve.
      mostrar(POSE_CELEBRACION)
      const espera = window.setTimeout(() => {
        mostrar(pose)
        fin()
      }, 1200)
      return () => window.clearTimeout(espera)
    }

    const paso = token(elemento, '--space-1')
    const contexto = gsap.context(() => {
      // Reposo: respira, un vaivén suave que sigue debajo de las demás animaciones.
      const respirar = () =>
        gsap.to(elemento, {
          y: -paso * 0.75,
          duration: 1.6,
          ease: 'sine.inOut',
          yoyo: true,
          repeat: -1,
        })

      if (animacion === 'reposo') {
        mostrar(pose)
        respirar()
      } else if (animacion === 'saludo') {
        mostrar(pose)
        gsap
          .timeline({ delay: 0.3 })
          .set(elemento, { transformOrigin: '50% 85%' })
          .to(elemento, { rotation: -6, duration: 0.18, ease: 'sine.out' })
          .to(elemento, { rotation: 6, duration: 0.24, ease: 'sine.inOut', repeat: 2, yoyo: true })
          .to(elemento, { rotation: 0, duration: 0.2, ease: 'sine.in' })
          .call(fin)
          .add(respirar())
      } else if (animacion === 'senalar') {
        mostrar(pose)
        gsap
          .timeline({ delay: 0.2 })
          .to(elemento, {
            x: paso * 1.5,
            duration: 0.22,
            ease: 'power2.out',
            repeat: 3,
            yoyo: true,
          })
          .call(fin)
          .add(respirar())
      } else if (animacion === 'habla') {
        respirar()
        const porNivel = voz.current
        if (porNivel) {
          // Boca al ritmo del audio: se lee el nivel en cada cuadro de GSAP.
          let anterior = -1
          const actualizar = () => {
            const indice = cuadroDeNivel(voz.current?.() ?? 0)
            if (indice !== anterior) mostrar(CUADROS_HABLA[indice] ?? pose)
            anterior = indice
          }
          gsap.ticker.add(actualizar)
          return () => gsap.ticker.remove(actualizar)
        }
        // Sin audio: patrón de boca durante el tiempo indicado (o sin fin) y luego pico cerrado.
        const secuencia = secuenciaHabla(duracionHablaMs ?? Number.POSITIVE_INFINITY)
        const sinFin = duracionHablaMs === undefined
        let indice = 0
        const intervalo = window.setInterval(() => {
          const cuadro = sinFin ? secuencia[indice % (secuencia.length - 1)] : secuencia[indice]
          mostrar(CUADROS_HABLA[cuadro ?? 0] ?? pose)
          indice += 1
          if (!sinFin && indice >= secuencia.length) window.clearInterval(intervalo)
        }, INTERVALO_HABLA_MS)
        return () => window.clearInterval(intervalo)
      } else {
        // Celebración: cambia de pose, salta, vuelve a su pose y luego el confeti.
        mostrar(POSE_CELEBRACION)
        gsap
          .timeline()
          .to(elemento, { y: -paso * 5, duration: DURACION_SANTI * 0.5, ease: CURVA_SANTI })
          .to(elemento, { y: 0, duration: DURACION_SANTI, ease: 'bounce.out' })
          .call(() => mostrar(pose), [], '+=0.35')
          .call(() => lanzarConfeti(confeti.current, paso))
          .to({}, { duration: 1.4 })
          .call(fin)
          .add(respirar())
      }
    }, raiz)

    return () => contexto.revert()
    // `pose` y `poses` se leen al cambiar de animación; no reinician la que está en curso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animacion, reducido, duracionHablaMs])

  return (
    <span
      className={['santi-animado', `santi-animado--${tamano}`, className].filter(Boolean).join(' ')}
      ref={raiz}
    >
      <span className="santi-animado__cuerpo" ref={cuerpo}>
        {poses.map((p) => (
          <span key={p} className="santi-animado__cuadro" data-pose={p}>
            <Santi pose={p} tamano={tamano} />
          </span>
        ))}
      </span>
      <span className="santi-animado__confeti" ref={confeti} aria-hidden="true" />
    </span>
  )
}

/** Confeti con los colores de celebración (tokens.json): sale de Santi hacia arriba y cae. */
function lanzarConfeti(contenedor: HTMLElement | null, paso: number) {
  if (!contenedor) return
  for (let i = 0; i < PIEZAS_CONFETI; i++) {
    const pieza = document.createElement('span')
    pieza.className = `santi-animado__pieza santi-animado__pieza--${COLORES_CONFETI[i % COLORES_CONFETI.length]}`
    contenedor.appendChild(pieza)
    const angulo = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9
    const distancia = paso * (10 + Math.random() * 18)
    const x = Math.cos(angulo) * distancia
    const altura = Math.sin(angulo) * distancia
    gsap
      .timeline({ onComplete: () => pieza.remove() })
      .set(pieza, { rotation: Math.random() * 360 })
      .to(pieza, { x, duration: 1.2, ease: 'power1.out' }, 0)
      .to(pieza, { y: altura, duration: 0.45, ease: 'power2.out' }, 0)
      .to(pieza, { y: altura + paso * 22, duration: 0.75, ease: 'power2.in' }, 0.45)
      .to(pieza, { rotation: `+=${360 + Math.random() * 360}`, duration: 1.2, ease: 'none' }, 0)
      .to(pieza, { opacity: 0, duration: 0.3 }, 0.9)
  }
}
