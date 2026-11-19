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

// Posiciones y números que pidió la fundación (nov. 2026), medidos sobre la ilustración: 1 la puerta,
// 2 la Virgen del nicho central, 3 la figura de arriba, 4 y 5 las figuras a los lados de la Virgen,
// 6 y 7 las de abajo, 8 sobre la puerta, 9 la columna junto a la puerta, 10 la columna fina de
// encima, 11 la ventana honda de abajo a la derecha y 12 la ventana de la torre derecha.
export const PUNTOS_DEMO: Readonly<Record<string, readonly PuntoConFicha[]>> = {
  'fachada-principal': [
    puntoDemo(1, 0.499, 0.905),
    puntoDemo(2, 0.4975, 0.495),
    // Transcripción sin audio (se puede leer aunque la narración no esté) y dato de Santi.
    puntoDemo(3, 0.499, 0.19, {
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
    puntoDemo(4, 0.3835, 0.48),
    // Varios registros de archivo, todavía sin imagen.
    puntoDemo(5, 0.614, 0.48, {
      archivo: [registroDemo('demo-05-a'), registroDemo('demo-05-b'), registroDemo('demo-05-c')],
    }),
    puntoDemo(6, 0.364, 0.86),
    puntoDemo(7, 0.631, 0.86),
    puntoDemo(8, 0.4975, 0.76),
    puntoDemo(9, 0.585, 0.83),
    puntoDemo(10, 0.578, 0.43),
    puntoDemo(11, 0.786, 0.83),
    puntoDemo(12, 0.71, 0.279),
  ],
}
