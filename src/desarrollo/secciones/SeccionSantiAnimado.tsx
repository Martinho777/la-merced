// Sección de /estilos (solo desarrollo): las animaciones de Santi y la narración de prueba. No hay
// narraciones reales todavía, así que se genera en el navegador un audio con ritmo de voz (sílabas de
// un tono, sin palabras) para revisar que el pico siga el volumen con la barra de audio real. Los
// textos son de prueba, no van a i18n.

import { useEffect, useState } from 'react'
import { SantiAnimado, type AnimacionSanti } from '@/componentes/Santi/SantiAnimado'
import { Boton } from '@/componentes/Boton'
import type { VozNarracion } from '@/visitante/analizadorVoz'
import { BarraAudio } from '@/visitante/BarraAudio'

const ANIMACIONES: {
  animacion: AnimacionSanti
  pose: 'wave' | 'idle' | 'point'
  nombre: string
}[] = [
  { animacion: 'reposo', pose: 'wave', nombre: 'Reposo' },
  { animacion: 'saludo', pose: 'wave', nombre: 'Saludo' },
  { animacion: 'habla', pose: 'idle', nombre: 'Habla (sin audio, 3 s)' },
  { animacion: 'senalar', pose: 'point', nombre: 'Señalar' },
  { animacion: 'celebracion', pose: 'wave', nombre: 'Celebración' },
]

/** WAV mono de 16 bits con sílabas de un tono grave: ráfagas de 80 a 250 ms separadas por pausas. */
function audioDePrueba(segundos = 6, muestreo = 22050): { url: string; duracionS: number } {
  const total = segundos * muestreo
  const datos = new DataView(new ArrayBuffer(44 + total * 2))
  const texto = (posicion: number, valor: string) =>
    [...valor].forEach((letra, i) => datos.setUint8(posicion + i, letra.charCodeAt(0)))
  texto(0, 'RIFF')
  datos.setUint32(4, 36 + total * 2, true)
  texto(8, 'WAVEfmt ')
  datos.setUint32(16, 16, true)
  datos.setUint16(20, 1, true)
  datos.setUint16(22, 1, true)
  datos.setUint32(24, muestreo, true)
  datos.setUint32(28, muestreo * 2, true)
  datos.setUint16(32, 2, true)
  datos.setUint16(34, 16, true)
  texto(36, 'data')
  datos.setUint32(40, total * 2, true)

  let i = 0
  while (i < total) {
    const silaba = Math.floor(muestreo * (0.08 + Math.random() * 0.17))
    const pausa = Math.floor(muestreo * (0.04 + Math.random() * (Math.random() < 0.15 ? 0.5 : 0.1)))
    const volumen = 0.3 + Math.random() * 0.6
    const tono = 140 + Math.random() * 80
    for (let j = 0; j < silaba && i < total; j++, i++) {
      const envolvente = Math.sin((Math.PI * j) / silaba)
      const t = i / muestreo
      const muestra =
        volumen *
        envolvente *
        (0.6 * Math.sin(2 * Math.PI * tono * t) + 0.3 * Math.sin(4 * Math.PI * tono * t))
      datos.setInt16(44 + i * 2, Math.max(-1, Math.min(1, muestra)) * 32767, true)
    }
    i += pausa
  }
  return {
    url: URL.createObjectURL(new Blob([datos], { type: 'audio/wav' })),
    duracionS: segundos,
  }
}

export function Seccion() {
  const [activa, setActiva] = useState<AnimacionSanti>('reposo')
  const [pose, setPose] = useState<'wave' | 'idle' | 'point'>('wave')
  const [vez, setVez] = useState(0)
  const [voz, setVoz] = useState<VozNarracion | null | false>(false)
  const [audio] = useState(audioDePrueba)

  useEffect(() => () => URL.revokeObjectURL(audio.url), [audio])

  return (
    <section className="pagina-estilos__seccion">
      <h2 className="texto-title-2">Santi animado</h2>
      <div className="pagina-estilos__fila">
        {ANIMACIONES.map((a) => (
          <Boton
            key={a.animacion}
            variante="secundario"
            tamano="sm"
            onClick={() => {
              setActiva(a.animacion)
              setPose(a.pose)
              setVez((n) => n + 1)
            }}
          >
            {a.nombre}
          </Boton>
        ))}
      </div>
      <SantiAnimado
        key={vez}
        pose={pose}
        tamano="md"
        animacion={activa}
        duracionHablaMs={3000}
        preparar={['habla', 'celebracion']}
        alTerminar={() => setActiva('reposo')}
      />

      <h3 className="texto-heading">Narración de prueba (pico según el volumen)</h3>
      <SantiAnimado
        pose="idle"
        tamano="md"
        animacion={voz !== false ? 'habla' : 'reposo'}
        nivelVoz={voz ? voz.nivel : undefined}
        preparar={['habla']}
      />
      <BarraAudio
        audio={audio}
        transcripcion="Audio de prueba generado en el navegador: sílabas de un tono, sin palabras."
        alCambiarVoz={setVoz}
      />
    </section>
  )
}
