# Decisiones

> Registro breve. Solo lo marcado "Aprobada" lo decidió el equipo humano; lo demás sigue abierto
> y **no debe tratarse como regla**. Añade una decisión solo con aprobación humana.

## Aprobadas

| Decisión                                      | Resumen                                                                                                                                                                                            | Dónde se aplica                                   |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Modelo de colaboración: autonomía supervisada | El equipo humano define y aprueba; ChatGPT es copiloto de diseño/producto/arquitectura; Claude Code inspecciona, implementa, prueba y reporta, y deja los cambios sin commit para revisión humana. | `CLAUDE.md`                                       |
| A. El Design System es normativo              | Cada documento gobierna su dominio (valores, contraste, principios, componentes). Sin precedencia universal: una contradicción entre documentos se informa y la resuelve una persona.              | `CLAUDE.md`, `.claude/rules/design-system.md`     |
| B. Una discrepancia no autoriza refactorizar  | Se reconoce y se reporta; no se modifica el sistema ni los documentos para igualarlos sin tarea aprobada.                                                                                          | `CLAUDE.md`, `.claude/rules/fuentes-de-verdad.md` |
| C. La documentación no sustituye las pruebas  | Se ejecutan las verificaciones y se reportan resultados reales, separando implementado / verificado / pendiente / no verificado / bloqueado.                                                       | `CLAUDE.md`, `.claude/rules/verificacion.md`      |

## Abiertas (requieren decisión humana)

1. ¿Cómo viajan la zona y la ruta elegidas a las pantallas siguientes: parámetro de URL, estado de navegación o contexto global?
2. ¿Debe poder usarse la app sin Supabase (datos estáticos exportados)? El `README` lo insinúa.
3. ¿Se instala GSAP (lo dice el Design System) o el movimiento seguirá en CSS?
4. ¿Cuándo y dónde se implementan el tema `contrast`, el texto grande y el modo respeto?
5. ¿Se actualiza y fusiona `origin/docs/prueba-rls`, y se automatiza la prueba de RLS en CI?
6. ¿Se endurece ESLint (bloquear `@/lib/supabase` fuera de `datos/`/`lib/`) y se extiende la prueba de tokens a `src/visitante/`?
7. ¿Hay uso sin conexión / PWA? ¿Se alojan las fuentes en local en lugar de Google Fonts?
8. ¿Quién traduce el kaqchikel y con qué plazo?
9. ¿Qué herramienta de tickets usa el prefijo `LM-n` y debe citarse en los commits?
10. ¿Cuántas instancias de Supabase existen (dev / producción) y quién aplica las migraciones en cada una?
11. ¿Está protegida la rama `main` en GitHub como dice el `README`? (No verificable desde el repo.)
12. ¿Se corrigen los puntos desactualizados del `README` (ver `docs/ia/ESTADO.md`)?
