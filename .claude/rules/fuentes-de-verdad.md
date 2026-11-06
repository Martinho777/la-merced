---
paths:
  - 'docs/**'
  - 'scripts/**'
  - 'src/estilos/**'
  - 'src/lib/tipos-db.ts'
  - 'src/assets/santi/**'
  - 'supabase/**'
---

# Fuentes de verdad, archivos generados y discrepancias

## Archivos generados: se cambia la fuente y se regenera

| Generado                            | Fuente                                                            | Comando                                                  | Cómo se vigila                                                  |
| ----------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| `src/estilos/tokens.css`            | `docs/diseno/tokens.json`                                         | `npm run tokens`                                         | `src/estilos/tokens.test.ts` (llama al generador con `--check`) |
| `src/lib/tipos-db.ts`               | `supabase/migrations/`                                            | `npm run db:types` (necesita proyecto Supabase enlazado) | Nada: no hay comprobación automática                            |
| `src/assets/santi/*-{384,768}.webp` | `santi-originales/*.png` y `POSES` en `src/assets/santi/index.ts` | `npm run santi`                                          | `src/assets/santi/santi.test.ts`                                |

`Edit` sobre los tres está denegado en `.claude/settings.json`. Regenerar con sus comandos sí requiere
aprobación (cambia archivos fuera del alcance de una edición normal) y `db:types` toca un proyecto remoto.

## Documentos de `docs/diseno/`

Están aprobados y se versionan "tal como se exportan" (`.prettierignore`). No los edites sin autorización
humana explícita, ni siquiera para corregir una errata. Cuando una tarea aprobada exija cambiarlos, el
cambio de `tokens.json` va con `npm run tokens` y se revisa en el mismo PR.

## Cuando especificación y código no coinciden

1. Identifica cuál es el comportamiento **especificado** (qué documento y sección) y cuál el **implementado** (qué archivo).
2. Si no afecta a tu tarea, menciónalo en una línea del reporte y sigue.
3. Si afecta, haz lo que la tarea pide **sin** alinear lo demás, y sugiere la decisión que haría falta.
4. Si bloquea, detente y pregunta. No edites el documento para que coincida con el código ni el código para que coincida con el documento.
5. Dos documentos normativos que se contradicen: informa ambos pasajes con archivo y sección, y espera decisión.

Discrepancias conocidas (no son tareas): ver `docs/ia/ESTADO.md`.
