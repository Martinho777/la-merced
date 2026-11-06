---
paths:
  - 'src/**'
  - 'scripts/**'
---

# Verificación

Comandos (de `package.json`; la CI corre los cuatro primeros, ver `.github/workflows/ci.yml`):
`npm run lint` · `npm run typecheck` · `npm run test` · `npm run build`.

## Qué ejecutar

| Cambio                                                        | Mínimo                                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Lógica o datos (`src/datos`, `src/lib`, `src/visitante/*.ts`) | `typecheck`, `test` (más una prueba nueva si hay comportamiento nuevo) |
| Componente, pantalla o CSS                                    | `lint`, `typecheck`, `test`; `build` si tocas rutas, imports o assets  |
| i18n                                                          | `test` (`traducciones.test.ts`), `typecheck`                           |
| Tokens, Santi, scripts                                        | `test` (vigilan sus archivos generados)                                |
| Cualquier entrega final                                       | los cuatro                                                             |

## Reglas

- Ejecuta; no supongas. Que una prueba exista no significa que haya pasado.
- Si algo falla, investiga la causa raíz. No cambies una prueba para que pase ni la desactives.
- Si falta `node_modules` o un permiso, **no instales dependencias por tu cuenta**: indica qué no pudo verificarse.
- No hagas operaciones remotas (Supabase, Vercel) solo para verificar.
- La cámara, los permisos del navegador, HTTPS, el comportamiento en iOS/Android y la legibilidad al sol no se verifican con estas pruebas. No afirmes que funcionan sin haberlo probado en un dispositivo real; márcalo como pendiente de verificación manual.
- El entorno de pruebas es `node` (sin DOM): la ausencia de pruebas de pantalla no equivale a una pantalla verificada.

## Formato del reporte

Clasifica cada punto en una de estas categorías: **Implementado**, **Verificado automáticamente** (comando y resultado real),
**Pendiente de verificación manual**, **No verificado** (y por qué), **Bloqueado o fallido**.
