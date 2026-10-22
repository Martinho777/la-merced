---
paths:
  - 'src/**/*.css'
  - 'src/componentes/**'
  - 'src/visitante/**'
  - 'src/app/**'
  - 'src/desarrollo/**'
---

# Design System

Este archivo no copia valores: te dice dónde mirar. Lee la fuente antes de decidir nada visual.

| Pregunta                                                                    | Dónde                                                                  |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| ¿Qué token existe y qué valor tiene?                                        | `docs/diseno/tokens.json` (en CSS: `src/estilos/tokens.css`, generado) |
| ¿Puedo poner este texto sobre este fondo?                                   | `docs/diseno/contraste.md` (listas cerradas: permitidos y prohibidos)  |
| ¿Qué regla visual aplica (tipografía, forma, elevación, movimiento, Santi)? | `docs/diseno/sistema-de-diseno.md`                                     |
| ¿Cómo se comporta o se ve este componente?                                  | `docs/diseno/componentes.md`                                           |

## Reglas de implementación

- En CSS solo `var(--token)`. Sin hex, `px`, `ms`, `rgba()` ni `color-mix()`. Antes de usar una variable, comprueba que existe en `tokens.json`.
- La prueba de `src/estilos/tokens.test.ts` revisa hex/px/ms solo en `src/componentes`, `src/desarrollo`, `src/app` y `src/estilos`. **No revisa `src/visitante/`**: allí cumple la regla tú.
- Preferir alias semánticos (`brand`, `accent`, `focus`, `text`…). Usa pasos crudos (`yellow-50`, `sky-700`…) solo si `componentes.md` los especifica para ese componente.
- Un par texto/fondo que no está en `contraste.md` no está permitido: no lo uses y pregunta.
- Tipografía con las clases `.texto-*` generadas; no definas `font-size`, `line-height` ni `letter-spacing` propios.
- Movimiento con `--duration-*` y `--ease-*`. `base.css` ya desactiva animaciones con `prefers-reduced-motion`.
- Santi siempre con `<Santi pose tamano />` (`src/componentes/Santi/`).

## Reutiliza antes de crear

`Boton`, `Tarjeta`, `GrupoOpciones` (elección única), `Insignia`, `BarraSuperior` / `BarraVisitante`,
`BarraProgreso`, `SantiBurbuja`, `Santi`, y las clases de `src/visitante/pantalla.css` para las pantallas.

## Si falta algo

Especificado y no implementado (no existen todavía): hero header, marcador de punto de mapa, barra de audio,
hoja inferior/diálogo, banners. Falta un token (p. ej. alto de chip): usa el más cercano, deja un comentario
y avísalo. Nada de valores nuevos. Crear un componente especificado solo si la tarea lo pide; sigue su sección
de `componentes.md`.
