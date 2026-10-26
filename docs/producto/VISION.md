# Visión de producto

> Fuente: "Guía digital patrimonial de La Merced · Sprint 1" (PDF, 21 págs.; ver `REFERENCIAS.md`). Cita "p. N" = página del PDF.
> Este documento resume el **por qué** y la **visión completa**. Lo que se construye en cada sprint está en `ALCANCE.md` y `SPRINTS.md`.
> Etiquetas: **[Aprobado]** viene de la guía · **[Futuro]** descrito en la guía pero fuera de los sprints 2 a 6 · **[Pendiente]** sin definir.

## Qué es

- Aplicación web móvil con una mascota guía (Santi, un quetzal 2D) para visitar la Iglesia de La Merced, Antigua Guatemala. **[Aprobado]** pp. 1–3.
- Proyecto UVG × FUNPANCHOY. Se abre en el navegador, sin instalar nada. **[Aprobado]** p. 1.
- Tres zonas: fachada principal (10–12 puntos), fachada secundaria (3–5) e interior (15 o menos), unas 30 explicaciones; el número final depende de la investigación verificada. Visita completa de unos 50–70 min. **[Aprobado]** p. 2.

## Para quién

- Visitantes de las iglesias de Antigua que ven las fachadas pero desconocen su significado. Necesitan orientarse y entender **sin quitar la mirada del edificio**, sin instalar nada y sin depender de señalización ni de GPS. **[Aprobado]** p. 1.
- Usan su propio teléfono, sobre todo Android de gama media y baja, con datos móviles débiles. **[Aprobado]** pp. 1, 10.
- Beneficiarios institucionales: FUNPANCHOY (la postal con Santi la difunde, p. 9) y el equipo de investigación, que carga y aprueba fichas sin tocar código (p. 10).

## Por qué se diseñó así (hallazgo → decisión)

- **Reconocer antes de explicar.** Cada punto abre con una pantalla de confirmación (foto real del detalle + Santi) y después la ficha. p. 1.
- **Cero fricción de instalación.** Aplicación web, interfaz liviana. p. 1.
- **Ritmo elegido por el visitante.** Tres rutas (recomendada, esencial, libre); puntos esenciales y opcionales diferenciados. p. 1.
- **Idioma y accesibilidad desde el inicio.** Español, kaqchikel e inglés en v1, arquitectura lista para más idiomas; WCAG 2.2. p. 1.
- **El brazo se cansa.** La cámara se usa una sola vez por fachada, solo para alinear, y se puede saltar. Ningún contenido exige sostener el teléfono en alto. pp. 1–2.
- **Alineación con la vista real.** Una ilustración dibujada desde el mismo punto de vista del visitante sirve de mapa. p. 2.
- **Coherencia, sin detalles seductores.** Santi acompaña y señala, no compite con el detalle; sus instrucciones salen solo la primera vez. Se descartó una mascota 3D en RA. p. 2.
- **Mirar despacio (slow looking).** Santi invita a buscar el detalle en el edificio antes de abrir la información. p. 2.
- **Gamificación con sentido.** Rutas y zonas a elección; cada punto completado cambia de estado; al cerrar una zona, postal opcional. Sin rankings, contadores de tiempo ni penalizaciones: refuerza la observación, no la prisa. pp. 2, 9.
- **Honestidad sobre lo que se sabe.** La reconstrucción 3D y las fichas muestran fuente y nivel de confianza (documentado, probable, especulativo). pp. 2, 11–12.

## Principios de experiencia (resumen)

- Cámara **opcional y sin GPS**: negar el permiso o saltar lleva a la ilustración **sin errores**. p. 4 (Diagrama 1).
- La ilustración orienta y la foto real confirma; el detalle fino lo muestra la foto de la pantalla de confirmación. p. 9.
- Tras cada ficha se vuelve siempre al mapa. p. 6 (Diagrama 2).
- Interior = lugar de oración: **modo respeto** (sin cámara, sin sonido, sin celebraciones). p. 8 (Diagrama 3).
- Aspecto, tono y componentes: ver `docs/diseno/` (normativo). Este documento no repite valores del Design System.

## Visión completa fuera de los sprints 2 a 6 **[Futuro]**

La guía describe estos elementos pero declara que quedan fuera de los 5 sprints (p. 14): fachada secundaria, interior (incluido el modo respeto), modo sin conexión y piloto en sitio. Las otras seis iglesias (Etapa 6) quedan fuera del alcance (p. 18). Detalle en `ALCANCE.md`.

## Cuestiones pendientes de producto **[Pendiente]**

- Qué puntos son "esenciales": se eligen cuando llegue la información del bloque A del equipo de investigación (p. 3).
- Cuáles son los 3 a 5 elementos con 3D: se definen con el equipo de investigación a partir de las fichas (p. 11).
- Autorización de la parroquia para QR y soportes en el sitio (p. 9).
- Planes de alojamiento para la versión pública, a definir con FUNPANCHOY (p. 11).
