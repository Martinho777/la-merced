# Mapa técnico para agentes de IA

> Resumen de orientación, no una fuente de verdad. Si difiere del código o de `docs/diseno/`, gana la fuente.
> Complementa a `README.md` (instalación, base de datos, despliegue) sin repetirlo. Verificado contra `main` @ `d154575` (2026-10-21).

## Rutas (`src/app/router.tsx`)

| Ruta                   | Componente                            | Datos                                    |
| ---------------------- | ------------------------------------- | ---------------------------------------- |
| `/`                    | `visitante/PantallaBienvenida`        | —                                        |
| `/idioma`              | `visitante/PantallaIdioma`            | `lib/preferencias` (idioma)              |
| `/ruta`                | `visitante/PantallaRuta`              | `lib/preferencias` (ruta)                |
| `/zona`                | `visitante/PantallaZona`              | `datos/zonas.obtenerZonas`               |
| `/camara`              | `visitante/PantallaCamara`            | — (solo explicación, no pide el permiso) |
| `/alineacion`, `/mapa` | `visitante/PantallaEnConstruccion`    | —                                        |
| `/gestor/*`            | `gestor/Gestor` (diferida)            | — (stub)                                 |
| `/estilos`             | `desarrollo/PaginaEstilos` (solo DEV) | —                                        |

## Flujo de datos

`pantalla → src/datos/* → src/lib/supabase → Supabase`. Las URLs de Storage salen de `src/lib/storage.ts`.
`obtenerZona` y `obtenerPuntosDeZona` existen y tienen prueba (esta última), pero **ninguna pantalla las usa todavía**.
La zona elegida en `/zona` no se transporta a `/camara` (estado local de la pantalla).

## Pipelines de archivos generados

```
docs/diseno/tokens.json ──npm run tokens──▶ src/estilos/tokens.css ──▶ main.tsx
santi-originales/*.png ──npm run santi──▶ src/assets/santi/*.webp ──▶ assets/santi/index.ts ──▶ <Santi />
supabase/migrations/*.sql ──(db push)──▶ proyecto Supabase ──npm run db:types──▶ src/lib/tipos-db.ts
```

## Qué vigila cada mecanismo automático

| Mecanismo                                                                      | Cubre                                                                                                                           | No cubre                                                                                |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `src/estilos/tokens.test.ts`                                                   | `tokens.css` al día; tokens y clases de texto declarados; sin hex/px/ms en CSS de `componentes`, `desarrollo`, `app`, `estilos` | CSS de `src/visitante/`; uso de variables inexistentes; pares de contraste              |
| `eslint.config.js`                                                             | Import de `@supabase/supabase-js` fuera de `src/lib` y `src/datos`; hooks de React                                              | Import de `@/lib/supabase` / `@/lib/storage`; cadenas literales en JSX; `scripts/*.mjs` |
| `src/i18n/traducciones.test.ts`                                                | Mismas claves en `en` y `es`; `cak` ⊆ `es`; faltantes listados en `PENDIENTE-cak.md`                                            | Marcadores `{{…}}` consistentes; calidad de traducciones                                |
| `src/assets/santi/santi.test.ts`                                               | Poses ↔ originales ↔ WebP; tamaños de `Santi` = tokens                                                                          | —                                                                                       |
| `datos/puntos.test.ts`, `lib/preferencias.test.ts`, `visitante/zonas.test.tsx` | Lógica pura (cliente Supabase simulado)                                                                                         | Pantallas completas, navegación, base real, E2E                                         |
| CI (`.github/workflows/ci.yml`)                                                | lint, typecheck, test, build                                                                                                    | Migraciones, RLS, `tipos-db.ts` al día                                                  |

## Esquema (resumen; fuente: `supabase/migrations/`)

`zonas` → `puntos` → `fichas` (una por punto e idioma; estados `borrador/revision/aprobado`); `medios` (Storage);
`fuentes` + `punto_fuentes` (nivel de confianza); `perfiles` (rol `editor/revisor/admin`). RLS activo en todas.
