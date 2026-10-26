# Flujos de uso

> Fuente: Diagramas 1 a 4 de la guía del Sprint 1 (PDF pp. 4–9, 12). Aquí solo el comportamiento; las rutas del router están en `docs/ia/ARQUITECTURA.md` y el aspecto en `docs/diseno/`.
> Leyenda de la guía (p. 3): rectángulo redondeado = pantalla; fondo gris = acción del sistema; fondo naranja = recompensa; rombo = decisión; borde punteado = paso opcional o enlace a otro diagrama.
> Etiquetas: **[Sprint 2]**, **[Sprint 3 a 5]** según `SPRINTS.md`; **[Futuro]** fuera de los sprints 2 a 6.

## Diagrama 1: entrada y cámara (pp. 4–5)

1. Abre el enlace (QR en brochure, mostrador o soporte). **[Sprint 2]**
2. Bienvenida: Santi saluda; idioma y accesibilidad. **[Sprint 2]**
3. Elegir ruta: recomendada, esencial o libre. **[Sprint 2]**
4. Elegir zona: fachada principal, fachada secundaria o interior. **[Sprint 2]**
5. Si es **interior**: va al flujo del Diagrama 3. **[Futuro]**
6. Si es fachada: alineación con cámara, **opcional y una vez por fachada**.
   - Santi explica en una línea para qué se usa. Botones: Usar cámara · Saltar.
   - Saltar → ilustración (Diagrama 2).
   - Usar cámara → permiso del navegador. Si se **niega**, pasa a la ilustración **sin error**.
   - Concedido → se coloca a unos 10 m, encaja el contorno sobre la cámara. Botones Listo · Saltar.
   - Listo → transición cámara → ilustración (corte simple con movimiento reducido). **[Sprint 2]**

## Diagrama 2: exploración de una fachada (pp. 6–7)

- **Mapa** (ilustración): puntos esenciales sólidos, opcionales punteados, visitados marcados, progreso "3/12", pellizco para acercar. Otros botones: "Ver cómo era" (Diagrama 4) y cambiar de zona. **[Sprint 3]**
- Primera visita: mini Santi "¡Toca un detalle para explorarlo!". **[Sprint 3]**
- Por cada punto: zoom automático (corte simple con movimiento reducido) → **confirmación** (Santi + foto real del detalle, botón de confirmar, chevron para volver al mapa) → **ficha**. **[Sprint 4]**
- Ficha: qué ver, por qué importa, significado hoy, narración con transcripción, fotos históricas, fuentes y nivel de confianza, "Ver en 3D" si el punto está habilitado (así lo muestra el Diagrama 2; los campos exactos de la ficha difieren entre secciones de la guía, ver `ALCANCE.md`, "Discrepancias internas"). **[Sprint 4 y 5]**
- Al cerrar la ficha: se **vuelve siempre al mapa**; estampa animada sobre el punto, punto visitado, progreso actualizado. **[Sprint 4]**
  - Ruta recomendada o esencial: el siguiente punto de la ruta salta o se anima.
  - Ruta libre: ningún punto se anima; el visitante elige libremente.
- Zona completa: celebración de Santi (estampa de la fachada completa) → postal con Santi (cámara + Santi 2D; compartir u omitir) → siguiente zona (Santi la sugiere) o fin de la visita. **[Sprint 5]**

## Diagrama 3: interior en modo respeto (pp. 8–9) **[Futuro]**

- Aviso de respeto desde "Elegir zona → Interior": Santi con audífonos, pose tranquila ("lugar de oración: audífonos, sin flash, en silencio").
- Si hay servicio en curso, se consulta el horario del gestor y se marcan los puntos no disponibles ("disponible después del servicio": se sugiere otro punto).
- Plano ilustrado de la nave, sin cámara; mismo patrón de punto: confirmación **sin sonido**, ficha con **texto primero y audio solo al tocar**, estampa silenciosa sin sonido ni confeti.
- Interior completo: cierre tranquilo (sin celebración); la postal se ofrece al salir.
- Reglas del modo: sin cámara, sin sonido, sin celebraciones, recordar no usar flash (p. 8).

## Diagrama 4: historia en 3D (p. 12) **[Sprint 3 provisional, Sprint 5 final]**

- Entrada: "Ver cómo era" (mapa o plano) o "Ver en 3D" (ficha de un punto habilitado).
- Modelo 3D interactivo en la pantalla, **sin cámara**: girar y acercar con los dedos.
- Tocar una parte → información: documentado / probable / especulativo y fuente. Cerrar vuelve al modelo.
- Cerrar el modelo → regresa a donde estaba (mapa, plano o ficha).

## Flujo del gestor (pp. 10–11, 16–17)

- Inicio de sesión con roles editor y revisor → formulario de ficha por idioma → subida de foto y fotos históricas con créditos → fuentes con nivel de confianza → estados borrador, revisión, aprobado. **[Sprint 3]**
- Ubicar cada punto sobre la ilustración, orden de ruta, esencial/opcional, audios por idioma con transcripción, Publicar (exporta lo aprobado a JSON estático y redespliega). **[Sprint 4]**
- Criterio de aceptación: una persona crea una ficha y otra la aprueba; un cambio aprobado aparece en la app sin tocar código (pp. 16–17).
