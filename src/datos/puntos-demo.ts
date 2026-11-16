// ⚠️ DATOS DE DEMOSTRACIÓN. No son contenido patrimonial.
//
// Sirven para usar y probar el mapa, la confirmación y la ficha mientras la investigación entrega los
// puntos reales: las posiciones son aproximadas y no señalan ningún elemento en particular, y no hay
// nombres, fechas ni textos históricos. Los puntos sin ficha muestran el estado "contenido pendiente".
// Cuando la base tenga suficientes puntos (`MINIMO_PUNTOS_REALES` en `recorrido.ts`) estos dejan de
// usarse; entonces se puede borrar este archivo.

import type { PuntoConFicha } from '@/datos/puntos'

/** Identificador estable, orden y posición normalizada (0 a 1) sobre la ilustración. */
function puntoDemo(
  orden: number,
  x: number,
  y: number,
  extra: Partial<PuntoConFicha> = {},
): PuntoConFicha {
  const slug = `demo-${String(orden).padStart(2, '0')}`
  return {
    id: slug,
    slug,
    orden,
    es_esencial: orden % 2 === 1,
    pos_x: x,
    pos_y: y,
    tiene_3d: false,
    ficha: null,
    foto: null,
    audio: null,
    archivo: [],
    fuentes: [],
    ...extra,
  }
}

/** Registro de archivo sin imagen, fecha ni crédito: muestra la tarjeta con el espacio vacío. */
const registroDemo = (id: string) => ({
  id,
  url: null,
  textoAlternativo: '',
  fecha: null,
  credito: null,
})

export const PUNTOS_DEMO: Readonly<Record<string, readonly PuntoConFicha[]>> = {
  'fachada-principal': [
    puntoDemo(1, 0.5, 0.76),
    puntoDemo(2, 0.37, 0.82),
    // Transcripción sin audio (se puede leer aunque la narración no esté) y dato de Santi.
    puntoDemo(3, 0.63, 0.82, {
      ficha: {
        idioma: 'es',
        titulo: 'Punto de demostración 3',
        que_ves: null,
        historia: null,
        dato_santi: 'Texto de demostración: aquí irá el dato de Santi.',
        transcripcion: 'Texto de demostración: aquí irá la transcripción de la narración.',
        audio_id: null,
      },
      // Una fuente de cada nivel de confianza; solo la primera tiene enlace y nota.
      fuentes: [
        {
          cita: 'Fuente de demostración 1',
          url: 'https://example.com',
          nivel: 'documentado',
          nota: 'Nota de demostración.',
        },
        { cita: 'Fuente de demostración 2', url: null, nivel: 'probable', nota: null },
        { cita: 'Fuente de demostración 3', url: null, nivel: 'especulativo', nota: null },
      ],
    }),
    puntoDemo(4, 0.5, 0.6),
    // Varios registros de archivo, todavía sin imagen.
    puntoDemo(5, 0.4, 0.62, {
      archivo: [registroDemo('demo-05-a'), registroDemo('demo-05-b'), registroDemo('demo-05-c')],
    }),
    puntoDemo(6, 0.6, 0.62),
    puntoDemo(7, 0.5, 0.4),
    puntoDemo(8, 0.38, 0.47),
    puntoDemo(9, 0.62, 0.47),
    puntoDemo(10, 0.5, 0.2),
    puntoDemo(11, 0.3, 0.27),
    puntoDemo(12, 0.7, 0.27),
  ],
}
