# Referencias

## Fuente primaria

- **"Guía digital patrimonial de La Merced · Sprint 1"**, 21 páginas, documento aprobado por el equipo. Está versionado en [`documentos/sprint-1-guia-digital-la-merced-v2.pdf`](../../documentos/sprint-1-guia-digital-la-merced-v2.pdf) (índice de la carpeta: [`documentos/README.md`](../../documentos/README.md)). Las citas "p. N" de `docs/producto/` son páginas de ese PDF.
- Otros documentos formales del equipo, versionados en `documentos/` (según su `README.md`; no se resumen aquí): [`cronograma-de-sprints.pdf`](../../documentos/cronograma-de-sprints.pdf) (plan de los sprints 2 a 6 con fechas, 22 oct 2026) y [`material-que-necesitamos-de-la-url.pdf`](../../documentos/material-que-necesitamos-de-la-url.pdf) (insumos que debe entregar el equipo de investigación). Para fechas de sprints, consulta el cronograma, no esta carpeta.
- Los diagramas 1 a 4 (pp. 4, 6, 8, 12) son imágenes; se revisaron en su versión renderizada. Las maquetas de pantallas (pp. 5 y 7) son ilustrativas y no se resumen aquí.

## Mapa de secciones del PDF

- **1. Investigación y hallazgos:** pp. 1–2 → `VISION.md`.
- **2. Fundamentos de diseño:** p. 2 → `VISION.md`.
- **3. Nuestra propuesta** (zonas, rutas, Santi, flujos, ilustración, gamificación, acceso, módulos): pp. 2–10 → `VISION.md`, `ALCANCE.md`, `FLUJOS.md`.
- **4. Stack tecnológico:** pp. 10–11 → no se copia: la fuente normativa de lo implementado es `package.json` y `docs/ia/ARQUITECTURA.md`.
- **5. Historia en 3D:** pp. 11–12 → `ALCANCE.md`, `FLUJOS.md`.
- **6. Qué necesitamos** (insumos del equipo de investigación): pp. 12–14 → `SPRINTS.md` (resumen de dependencias).
- **7. Cronograma:** pp. 14–18 → `SPRINTS.md`.
- **8. Backlog del Sprint 1** (registro de horas): pp. 18–20 → no se usa.
- **Referencias bibliográficas:** p. 21.

## Qué documento gobierna cada tema (para no duplicar)

- Valores visuales, contraste, componentes, tipografía, movimiento: `docs/diseno/` (normativo).
- Stack real, rutas, flujo de datos, esquema: `docs/ia/ARQUITECTURA.md`, `README.md`, `supabase/migrations/`.
- Qué existe hoy en el código: `docs/ia/ESTADO.md`.
- Decisiones aprobadas y abiertas: `docs/ia/DECISIONES.md`.
- Reglas de trabajo del agente: `CLAUDE.md` y `.claude/rules/`.

## Cómo usar `docs/producto/`

- Leer solo el archivo pertinente: propósito → `VISION.md`; qué entra o no → `ALCANCE.md`; comportamiento de pantalla → `FLUJOS.md`; entregables y criterios → `SPRINTS.md`.
- Si la guía y el código o el Design System difieren, no se corrige ninguno por iniciativa propia: se informa y se pide decisión (`.claude/rules/fuentes-de-verdad.md`).
- Estos resúmenes pueden quedar desfasados; ante una duda, manda el PDF original. No se reconstruye el producto desde el README o desde auditorías.
- Referencias bibliográficas de la guía (Levine 1982, Mayer 2021, Tishman 2018, W3C WCAG 2.2, entre otras): ver p. 21 del PDF.
