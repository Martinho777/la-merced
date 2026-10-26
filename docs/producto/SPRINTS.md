# Sprints 2 a 6

> Fuente: guía del Sprint 1, sección 7 "Cronograma" (PDF pp. 14–18). "p. N" = página del PDF.
> Resume entregables y criterios de terminado. **No es una lista de tareas del agente**: el equipo humano decide qué se construye y cuándo (`CLAUDE.md`).
> El estado real del código está en `docs/ia/ESTADO.md`; no se repite aquí.
> La guía del Sprint 1 **no contiene fechas específicas** para los sprints 2 a 6 (solo las del Sprint 1: 8 sep a 9 oct de 2026, p. 18). Existe un cronograma complementario, [`documentos/cronograma-de-sprints.pdf`](../../documentos/cronograma-de-sprints.pdf) (índice en `documentos/README.md`); **no se ha leído al redactar este archivo**, así que aquí no se registra ninguna de sus fechas: consúltalo directamente. El sprint vigente es el **Sprint 2**, según confirmación del equipo (registrado en `docs/ia/ESTADO.md`).

Marco común: 5 sprints, 20 h por integrante, 80 h por sprint, 400 h en total. Cada tarea es una función completa de principio a fin en su sprint. Sin pruebas en la iglesia. p. 14.

## Sprint 2: base técnica y entrada a la app (pp. 14–16)

Entregables:

- App publicada en Vercel que se abre desde un teléfono; base en Supabase conectada.
- Repo con React, TypeScript y Vite; tablas zonas, puntos, fichas por idioma, medios y fuentes; despliegue automático; un punto de prueba que se lee de la base y se muestra.
- Maquetas de todas las pantallas de la fachada central y diseño final de Santi (SVG por capas con poses de reposo, saludo, habla, señalar y celebración); paleta, tipografía e íconos; componentes base: botones, tarjetas, chevron y barra de progreso.
- Pantalla de alineación con cámara: Santi explica antes de pedir permiso; cámara trasera con contorno provisional; Listo y Saltar; permiso negado pasa directo al mapa; transición a la ilustración.
- Pantallas de bienvenida, idioma (es, cak, en, con textos en archivos de traducción), ruta (recomendada, esencial, libre) y zona (secundaria e interior como "próximamente").

Criterios de terminado:

- La app publicada muestra el punto de prueba guardado en la base.
- El equipo aprueba las maquetas y los componentes base están en el código.
- En Chrome y Samsung Internet se puede alinear, saltar o negar el permiso sin errores.
- Se navega de la bienvenida a la cámara y el idioma y la ruta elegidos quedan guardados.

Nota: el mapa, las fichas, el gestor y el 3D **no** son del Sprint 2.

## Sprint 3: mapa de la fachada y gestor de fichas (pp. 15–16)

- Ilustración final de la fachada central (vectorial por capas sobre la foto de referencia, contorno de alineación definitivo, SVG optimizado con SVGO).
- Mapa interactivo con 10–12 puntos, zoom, pellizco, movimiento reducido, progreso guardado en el teléfono, mini Santi de la primera visita.
- Gestor: login con roles editor y revisor, formulario por idioma, subida de fotos con créditos, fuentes con nivel de confianza, estados borrador / revisión / aprobado.
- Modelo 3D provisional (volúmenes en Blender, GLB) abierto desde "Ver cómo era".
- Criterios: coinciden ilustración y contorno con la foto; los puntos se tocan y el progreso persiste al recargar; una persona crea una ficha y otra la aprueba; el modelo provisional se mueve en un Android de gama media.

## Sprint 4: recorrido completo de un punto (pp. 16–17)

- Confirmación y ficha completa por punto; regreso al mapa con punto completado y animación del siguiente punto (ninguno en ruta libre).
- Santi animado con GSAP, pico sincronizado (Web Audio API), reproductor con transcripción visible.
- Gestor: ubicar puntos, orden de ruta y esencial/opcional, subir audios por idioma, botón Publicar (JSON estático y redespliegue).
- Carga de las fichas recibidas en los tres idiomas; revisión de ortografía, créditos y coherencia entre idiomas; lista de faltantes al equipo de investigación.
- Criterio: cualquier punto se completa de principio a fin y el mapa lo refleja.

## Sprint 5: historia en 3D, postal y accesibilidad (p. 17)

- Modelo 3D final (partes separadas con nivel de confianza y fuente, compresión con glTF-Transform) y pantalla "Ver cómo era" desde el mapa y desde las fichas habilitadas; descarga solo al abrir, con indicador.
- Celebración y postal con Santi (cámara con marco, Web Share API o descarga, omisible).
- Accesibilidad: tamaño de texto, alto contraste, movimiento reducido, etiquetas para lector de pantalla, orden de navegación por teclado.
- Criterios: Santi narra una ficha en los tres idiomas; un cambio aprobado en el gestor aparece sin tocar código; el 3D pesa menos de 5 MB y lo aprueba investigación; la postal se comparte desde Android; las cuatro opciones de accesibilidad funcionan en todas las pantallas de la fachada central.

## Sprint 6: cierre, publicación y revisión final (p. 18)

- Optimización: imágenes y audios comprimidos, carga diferida (3D, audios, gestor), aviso "Abrir en Chrome" desde WhatsApp/Instagram, indicadores de carga. Criterio: abre en menos de 3 s con 4G en gama media.
- Créditos ("Acerca de"), manual del gestor, guía técnica. Criterio: otro equipo instala el proyecto y agrega una zona.
- Producción: dominio, variables, respaldo de la base, cuentas del gestor, publicación de todas las fichas aprobadas en los tres idiomas.
- Revisión final del flujo completo en los tres idiomas contra los diagramas; lista de ajustes cerrada y versión aprobada.

## Dependencias del equipo de investigación (p. 18)

- **Antes del Sprint 3:** foto de referencia de la fachada central y lista de puntos marcados sobre ella.
- **Durante el Sprint 3:** fichas de la fachada central (para elegir los elementos del 3D y cargarlas en el Sprint 4).
- **Antes del Sprint 5:** traducciones al kaqchikel y al inglés y narraciones. Si no llegan, la app avanza con textos y audios provisionales que se reemplazan en el Sprint 6.
- La investigación (Etapa 2) corre durante todo el proyecto. Formatos exactos de lo que se necesita: pp. 12–14.

## Fuera de los 5 sprints (p. 14) **[Futuro]**

Fachada secundaria, interior (con modo respeto), modo sin conexión y piloto en sitio. No son trabajo de ningún sprint de esta tabla.
