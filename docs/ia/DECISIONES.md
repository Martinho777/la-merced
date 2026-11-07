# Decisiones

> Registro breve. Solo lo marcado "Aprobada" lo decidió el equipo humano; lo demás sigue abierto
> y **no debe tratarse como regla**. Añade una decisión solo con aprobación humana.

## Aprobadas

| Decisión                                            | Resumen                                                                                                                                                                                                                       | Dónde se aplica                                   |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Modelo de colaboración: autonomía supervisada       | El equipo humano define y aprueba; ChatGPT es copiloto de diseño/producto/arquitectura; Claude Code inspecciona, implementa, prueba y reporta, y deja los cambios sin commit para revisión humana.                            | `CLAUDE.md`                                       |
| A. El Design System es normativo                    | Cada documento gobierna su dominio (valores, contraste, principios, componentes). Sin precedencia universal: una contradicción entre documentos se informa y la resuelve una persona.                                         | `CLAUDE.md`, `.claude/rules/design-system.md`     |
| B. Una discrepancia no autoriza refactorizar        | Se reconoce y se reporta; no se modifica el sistema ni los documentos para igualarlos sin tarea aprobada.                                                                                                                     | `CLAUDE.md`, `.claude/rules/fuentes-de-verdad.md` |
| C. La documentación no sustituye las pruebas        | Se ejecutan las verificaciones y se reportan resultados reales, separando implementado / verificado / pendiente / no verificado / bloqueado.                                                                                  | `CLAUDE.md`, `.claude/rules/verificacion.md`      |
| D. El contexto de producto es normativo             | Antes de implementar, el agente consulta propósito, alcance y criterios en `docs/producto/`. No amplía el alcance ni sustituye decisiones de experiencia por soluciones más complejas sin aprobación. Aprobada el 2026-10-25. | `CLAUDE.md`, `.claude/rules/producto.md`          |
| E. Doble autorización para cambios de base de datos | Preparar una migración y aplicarla son acciones independientes: aprobar un cambio de esquema no autoriza ejecutarlo en ningún entorno. Aprobada el 2026-10-25.                                                                | `CLAUDE.md`, `.claude/rules/seguridad-datos.md`   |

> D y E se registran como aprobadas por el equipo; el PR que las incorpora sigue sujeto a su revisión.

### Gestor de fichas (Sprint 3 · bloque 3), aprobadas por Martin Villatoro el 2026-11-06

| Decisión                                      | Resumen                                                                                                                                                                           | Dónde se aplica                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Textos del gestor solo en español             | La interfaz del gestor usa i18n en su propio namespace (`gestor`), cargado solo en `/gestor`, por ahora solo en español. Kaqchikel e inglés se agregan con un archivo por idioma. | `src/gestor/i18n/`                        |
| Fichas en español e inglés por ahora          | El gestor edita fichas en `es` y `en`; `cak` se activa cuando llegue el material de la URL. La base ya admite los tres idiomas.                                                   | `IDIOMAS_GESTOR` en `src/datos/gestor.ts` |
| Componentes de formulario solo del gestor     | El Design System no especifica formularios: `Campo`, `CampoArea` y `Selector` viven en `src/gestor/componentes/` y usan los tokens existentes, sin valores nuevos.                | `src/gestor/componentes/`                 |
| Fotos reducidas y convertidas en el navegador | Antes de subir, el navegador reduce la foto a 2000 px y la convierte a WebP (JPEG si no puede), sin bibliotecas. Los originales se guardan fuera de la app.                       | `src/gestor/imagen.ts`                    |
| El gestor no crea ni ubica puntos             | Los puntos los carga el equipo cuando la URL envíe la información. Ubicarlos sobre la ilustración es del Sprint 4.                                                                | `src/gestor/`                             |
| Aprobación de PR opcional en `main`           | `main` exige PR, CI en verde y rama al día, pero no la aprobación de otra persona (decidido por el equipo, nov. 2026). Responde a la pregunta abierta 11.                         | Protección de rama en GitHub              |

## Abiertas (requieren decisión humana)

1. ¿Qué mecanismo de navegación y de estado se usa de forma general entre pantallas (parámetros de URL, estado de navegación o contexto global)? **Situación actual, sin decisión aprobada:** el código transporta la zona con `?zona=<slug>` (`src/visitante/camara.ts`) y lee la ruta desde `localStorage`; eso describe lo implementado, no fija el mecanismo general. Sigue abierta.
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
