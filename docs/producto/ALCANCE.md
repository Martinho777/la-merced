# Alcance aprobado

> Fuente: guía del Sprint 1 (PDF). "p. N" = página del PDF. Ver `REFERENCIAS.md`.
> **Alcance ≠ estado del código.** Que algo esté en alcance no significa que exista, ni que exista implica que esté en alcance. El estado real está en `docs/ia/ESTADO.md`.
> **Alcance ≠ tarea.** Este documento no asigna trabajo: lo asigna el equipo humano (`CLAUDE.md`).

## Etapa cubierta (sprints 2 a 6)

- Se entrega la **fachada central completa y funcional**, en español, kaqchikel e inglés. 5 sprints (2 al 6), 20 h por integrante por sprint: 80 h por sprint y 400 en total, incluidas ilustración, animación de Santi y modelado 3D. No incluye pruebas en la iglesia. **[Aprobado]** p. 14.
- "Fachada central" (cronograma, pp. 14–18) y "fachada principal" (resto de la guía, p. 2 y Diagrama 1) parecen designar la misma zona; el código usa `fachada-principal`. Ver "Discrepancias internas de la guía".

## Dentro del alcance (sprints 2 a 6) **[Aprobado]**

- Entrada: bienvenida con Santi, idioma, elección de ruta (recomendada / esencial / libre) y de zona; fachada secundaria e interior se muestran como "próximamente". p. 16.
- Alineación con cámara **opcional**, una vez por fachada: Santi explica antes de pedir permiso; botones Listo y Saltar; permiso negado pasa directo al mapa sin errores; transición a la ilustración (corte simple con movimiento reducido). pp. 4, 15–16.
- Mapa ilustrado de la fachada central con 10–12 puntos (esenciales sólidos, opcionales punteados), zoom al tocar y pellizco, progreso ("3/12") guardado en el teléfono. p. 16.
- Experiencia por punto: confirmación (foto real + Santi) y ficha (qué ves, historia, dato de Santi, fotos históricas, fuentes, nivel de confianza). pp. 10, 16.
- Santi animado (GSAP), pico sincronizado con el volumen del audio (Web Audio API), narración con transcripción visible. pp. 3, 10, 17.
- Gestor de contenido (`/gestor`): roles editor y revisor, ficha por idioma, medios con créditos, fuentes con nivel de confianza, estados borrador / revisión / aprobado, ubicación de puntos, audios por idioma, botón Publicar (exporta lo aprobado a JSON estático y redespliega). pp. 11, 16–17.
- Historia en 3D: único acceso "Ver cómo era" (en la ilustración y en 3 a 5 elementos definidos con investigación); modelo interactivo sin cámara, partes etiquetadas documentada / probable / especulativa con fuente; se descarga solo al abrirlo; el archivo final pesa menos de 5 MB. pp. 11–12, 17.
- Celebración y postal con Santi al completar la fachada (omisible; compartir por Web Share API o descargar). p. 17.
- Accesibilidad WCAG 2.2: tamaño de texto, alto contraste, movimiento reducido, etiquetas para lector de pantalla y orden de navegación por teclado, en todas las pantallas de la fachada central. pp. 1, 10, 17–18.
- Rendimiento: optimizada para Android de gama media y baja; abre en menos de 3 s con 4G en gama media; carga diferida de 3D, audios y gestor; aviso "Abrir en Chrome" desde WhatsApp/Instagram. p. 18.
- Cierre: créditos ("Acerca de"), manual del gestor, guía técnica, despliegue a producción con respaldo, cuentas del gestor, revisión final en los tres idiomas. p. 18.

## Fuera de los sprints 2 a 6 **[Futuro]**

- **Fachada secundaria** (3–5 puntos) y **interior** (15 o menos), con su plano ilustrado axonométrico o cenital. p. 14.
- **Modo respeto del interior**: Santi con audífonos, texto primero, audio nunca automático, sin cámara ni celebraciones, aviso de servicio en curso y puntos no disponibles según horario cargado en el gestor. Es parte de la propuesta (pp. 8–9), pero el interior queda fuera de los 5 sprints (p. 14).
- **Modo sin conexión**: descarga por zona, favoritos y progreso en el dispositivo, indicador de almacenamiento. p. 10 (módulo 5), p. 14.
- **Piloto en sitio** y pruebas en la iglesia. p. 14.
- **Otras seis iglesias** (Etapa 6). p. 18.
- Más idiomas: la arquitectura queda lista, no se entregan. p. 1.

## Descartado explícitamente **[Aprobado]**

- Mascota 3D en realidad aumentada en cada punto (p. 2).
- Superposición del modelo 3D en vivo sobre la fachada y RA en general (p. 12).
- Rankings, contadores de tiempo y penalizaciones (p. 9).
- Códigos fijos en el edificio (p. 9).
- Rive para animar a Santi (plan gratuito no permite exportar) y servidor propio con Express/Prisma (p. 10–11).

## Restricciones de producto que conviene recordar

- Idiomas de la interfaz: es, cak (kaqchikel) y en. Cada ficha guarda sus campos por idioma. p. 11.
- Las traducciones al kaqchikel y al inglés y las narraciones las aporta el equipo de investigación; si no llegan antes del Sprint 5, la app avanza con textos y audios provisionales que se reemplazan en el Sprint 6. p. 18. **No se inventan** (`.claude/rules/i18n.md`).
- El contenido patrimonial y los niveles de confianza los define la investigación; reglas de datos en `.claude/rules/seguridad-datos.md`.
- Valores visuales, contraste y componentes: `docs/diseno/` (normativo).

## Discrepancias internas de la guía **[Pendiente]**

No se resuelven aquí; requieren decisión del equipo.

- Idiomas en la bienvenida: el Diagrama 1 (p. 4) dice "Idioma (ES / EN)"; el resto de la guía (pp. 1, 11, 16) exige español, kaqchikel e inglés.
- Campos de la ficha: el Diagrama 2 (p. 6) lista "qué ver, por qué importa, significado hoy"; la sección 6 (p. 13) pide "qué está viendo, historia, dato curioso"; el Sprint 4 (p. 16) dice "qué ves, historia, dato de Santi".
- Orden de construcción: p. 10 dice que primero va el gestor "porque la investigación llega por partes"; el cronograma pone el gestor de fichas en el Sprint 3 y la ubicación de puntos y publicación en el Sprint 4.
- Fachada "central" frente a "principal" (ver arriba).
- Postal: p. 9 la ofrece al terminar una fachada; el Diagrama 3 (p. 8) la ofrece al salir del interior sin celebración.

## Cuestiones pendientes **[Pendiente]**

- Lista de puntos esenciales y de los 3 a 5 elementos 3D (dependen de investigación). pp. 3, 11.
- Si la URL puede entregar la narración grabada por ficha e idioma, o la produce el equipo. p. 14.
- Horario de servicios y puntos del interior no visitables durante misa (solo relevante cuando se construya el interior). p. 14.
- Planes de Vercel y Supabase para producción (Vercel gratuito es solo de uso personal no comercial; Supabase gratuito pausa y no incluye respaldos). p. 11.
