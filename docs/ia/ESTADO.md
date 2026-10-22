# Estado del proyecto

> Instantánea para orientar al agente, **no una lista de tareas**. Los elementos "pendiente" y las discrepancias
> no se vuelven trabajo automático (Decisión B de `CLAUDE.md`). Verificado contra `main` @ `d154575` (2026-10-21).
> Se actualiza cuando una tarea aprobada cambia el estado de algo de esta lista.

## Implementado (visto en código)

- Entrada del visitante: bienvenida, idioma (es/cak/en), ruta (recomendada/esencial/libre), zona y explicación de cámara.
- Cámara (bloque 3): la explicación no pide permiso; `/alineacion` pide la cámara trasera solo tras "Activar cámara", superpone el contorno de la zona y sigue al mapa con Listo/Saltar o si se niega el permiso. Las zonas con `usa_camara` falso van directo al mapa. La zona viaja como `?zona=<slug>`.
- Selector de zonas leído de Supabase, con estados de carga/error/reintento y zonas "Próximamente".
- Componentes base, sistema de tokens generado y tema de alto contraste **en CSS**; imágenes de Santi (35 poses).
- Esquema, RLS y bucket `medios` en `supabase/migrations/`; tipos generados; CI.

## Parcial

- **Cámara**: sin probar en dispositivos físicos (Chrome Android, Samsung Internet, iOS). "Solo es una vez" no se recuerda entre visitas (no hay requisito de persistencia).
- **Preferencias**: la ruta se guarda pero ninguna pantalla posterior la usa; la duración de rutas es un marcador ("[X] min").
- **Kaqchikel**: 3 de 44 claves traducidas; el resto cae a español (`src/i18n/PENDIENTE-cak.md`).
- **Datos de contenido**: el seed tiene un único punto de prueba con ficha solo en español.
- **Funciones de datos** `obtenerZona` y `obtenerPuntosDeZona`: existen, sin pantalla que las use.

## Solo estructura o marcador

- `/mapa` (pantalla "En construcción", recibe `?zona=`); `/gestor` (stub, "Sprint 3").
- Componentes especificados y no implementados: hero header, marcador de punto, barra de audio, hoja inferior/diálogo, banners.

## No existe (según búsqueda en `src/` y `package.json`)

Ficha de punto, audio, modelos 3D, login/CRUD del gestor, PWA / uso sin conexión, GSAP, interruptor de tema `contrast`
en producción (solo en `/estilos`), ajuste de texto grande, modo respeto.

## Discrepancias especificación ↔ código (informativas)

| Especificado                                                                                                  | Implementado                                                      |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `sistema-de-diseno.md` (Motion): GSAP                                                                         | Animaciones CSS; GSAP no instalado                                |
| `sistema-de-diseno.md` (Themes): `data-theme="contrast"` desde ajustes de accesibilidad                       | Solo `desarrollo/PaginaEstilos.tsx` lo activa                     |
| `componentes.md` (Top bar): borde inferior cuando el contenido pasa por debajo                                | `BarraSuperior` tiene la prop `conBorde`; ninguna pantalla la usa |
| `README.md` (Convenciones): ESLint impide llamar a Supabase fuera de `datos/` y `lib/`                        | La regla solo bloquea el paquete, no `@/lib/supabase`             |
| `README.md` (Estructura): `assets/santi` "SVG por capas"; `visitante/` con mapa y ficha; `app/` con providers | WebP; esas pantallas y providers no existen                       |

## Rama sin fusionar

`origin/docs/prueba-rls`: contiene `supabase/probar-rls.mjs` y el script `db:probar-rls`; está desfasada respecto a `main`.
