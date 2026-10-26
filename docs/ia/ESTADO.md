# Estado del proyecto

> Instantánea para orientar al agente, **no una lista de tareas**. Los elementos "pendiente" y las discrepancias
> no se vuelven trabajo automático (Decisión B de `CLAUDE.md`). Código leído contra `main` @ `de85033` (2026-10-25).
> **Implementado ≠ verificado:** al redactar este archivo no se ejecutaron lint, typecheck, pruebas ni build, y
> nada se probó en un dispositivo. "Implementado" significa que el código existe; el estado de verificación va aparte.
> Se actualiza cuando una tarea aprobada cambia el estado de algo de esta lista.

> **Alcance de producto** (qué se construye en cada sprint, qué es futuro): `docs/producto/`. Este archivo
> describe solo lo que existe hoy; que algo falte aquí no significa que esté en alcance ni que sea una tarea.
>
> **Sprint vigente: Sprint 2** (confirmado por el equipo). La guía del Sprint 1 no da fechas para los sprints 2 a 6;
> el plan con fechas es `documentos/cronograma-de-sprints.pdf` (22 oct 2026, según `documentos/README.md`; no se
> leyó aquí). Este archivo no copia fechas. Entregables: `docs/producto/SPRINTS.md`.

## Implementado (visto en código)

- Entrada del visitante: bienvenida, idioma (es/cak/en), ruta (recomendada/esencial/libre), zona y explicación de cámara.
- Cámara (bloque 3): la explicación no pide permiso; `/alineacion` pide la cámara trasera solo tras "Activar cámara" y muestra a Santi encima de la imagen con un mensaje y "Ver el mapa" (sin contorno de alineación: el equipo decidió quitarlo). Mientras abre, "Saltar"; si se niega el permiso, va al mapa. Las zonas con `usa_camara` falso van directo al mapa. La zona viaja como `?zona=<slug>`.
- Mapa (`/mapa`, vertical): ilustración con marcadores (`MarcadorPunto`); un dedo mueve, dos dedos pellizcan para el zoom y el doble toque alterna entre la fachada entera y la vista inicial (lógica en `visitante/gestos.ts`). Progreso, leyenda y Santi con el siguiente punto según la ruta guardada.
- Selector de zonas leído de Supabase, con estados de carga/error/reintento y zonas "Próximamente".
- Componentes base, sistema de tokens generado y tema de alto contraste **en CSS**; imágenes de Santi (35 poses).
- Esquema, RLS y bucket `medios` en `supabase/migrations/`; tipos generados; CI.

## Verificación: implementado frente a comprobado

Las pruebas de la tabla existen en el repositorio; **no se ejecutaron al escribir este archivo** (falta `node_modules`).
La última columna es lo que ninguna prueba automática puede dar por cumplido.

| Funcionalidad                              | Pruebas automáticas que existen                                  | Comprobación manual o en dispositivo                          |
| ------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| Entrada (bienvenida, idioma, ruta, zona)   | `preferencias.test.ts`, `traducciones.test.ts`, `zonas.test.tsx` | No consta ninguna                                             |
| Explicación de cámara (`/camara`)          | `camara-pantallas.test.tsx`, `camara.test.ts`                    | No consta ninguna                                             |
| Alineación (`/alineacion`, `getUserMedia`) | `camara.test.ts`, `camara-pantallas.test.tsx`                    | **No**: sin probar en Chrome Android, Samsung Internet ni iOS |
| Mapa inicial (`/mapa`, gestos)             | `mapa.test.ts`, `gestos.test.ts`, `mapa-pantallas.test.tsx`      | **No**: los gestos táctiles no se han probado en un teléfono  |
| Santi hablando sobre la cámara             | `habla.test.ts`                                                  | No consta ninguna                                             |

Criterios de terminado del Sprint 2 (`docs/producto/SPRINTS.md`). **Este archivo no da ninguno por cumplido;** lo decide el equipo:

| Criterio                                                         | Qué hay                                                                                                                                        |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| La app publicada muestra el punto de prueba guardado en la base  | Código para leerlo (`obtenerPuntosDeZona` en el mapa). Publicación y base no comprobadas desde el repositorio.                                 |
| El equipo aprueba las maquetas; componentes base en el código    | Componentes base: en el código. Aprobación de maquetas: sin evidencia en el repositorio (faltan los wireframes, según `documentos/README.md`). |
| En Chrome y Samsung Internet se puede alinear, saltar o negar    | Implementado y con pruebas de lógica. **No verificado** en esos navegadores.                                                                   |
| Se navega de bienvenida a cámara; idioma y ruta quedan guardados | Implementado y con pruebas de preferencias. Recorrido completo sin comprobar en navegador.                                                     |

## Parcial

- **Cámara**: sin probar en dispositivos físicos (Chrome Android, Samsung Internet, iOS). "Solo es una vez" no se recuerda entre visitas (no hay requisito de persistencia).
- **Mapa (inicial)**: la ruta guardada ya la lee `PantallaMapa` (siguiente punto y progreso), pero **no se guarda qué puntos se visitaron** (`NINGUNO_VISITADO` en `PantallaMapa.tsx`), no hay botones alternativos de zoom (brecha de accesibilidad pendiente, no una excepción aprobada al Design System; ver Discrepancias) y los puntos reales dependen de investigación. No se da por cumplido el mapa del Sprint 3 (`docs/producto/SPRINTS.md`).
- **Preferencias**: la duración de las rutas sigue siendo un marcador ("[X] min").
- **Kaqchikel**: 3 de 74 claves traducidas; el resto cae a español (`src/i18n/PENDIENTE-cak.md`).
- **Datos de contenido**: el seed tiene un único punto de prueba (con ficha solo en español); la ficha no se muestra porque `/punto` aún es un marcador.

## Solo estructura o marcador

- `/punto` (pantalla "En construcción", recibe `?zona=&punto=`); `/gestor` (stub, "Sprint 3").
- Visitas a puntos: no se registran todavía (no hay ficha); el mapa muestra todo sin visitar.
- Componentes especificados y no implementados: hero header, barra de audio, hoja inferior/diálogo, banners.

## No existe (según búsqueda en `src/` y `package.json`)

Ficha de punto, audio, modelos 3D, login/CRUD del gestor, PWA / uso sin conexión, GSAP, interruptor de tema `contrast`
en producción (solo en `/estilos`), ajuste de texto grande, modo respeto.

## Discrepancias especificación ↔ código (informativas)

| Especificado                                                                                           | Implementado                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sistema-de-diseno.md` (Motion): GSAP                                                                  | Animaciones CSS; GSAP no instalado                                                                                                                 |
| `sistema-de-diseno.md` (Themes): `data-theme="contrast"` desde ajustes de accesibilidad                | Solo `desarrollo/PaginaEstilos.tsx` lo activa                                                                                                      |
| `componentes.md` (Top bar): borde inferior cuando el contenido pasa por debajo                         | `BarraSuperior` tiene la prop `conBorde`; ninguna pantalla la usa                                                                                  |
| `README.md` (Convenciones): ESLint impide llamar a Supabase fuera de `datos/` y `lib/`                 | La regla solo bloquea el paquete, no `@/lib/supabase`                                                                                              |
| `README.md` (Estructura): `assets/santi` "SVG por capas"; `visitante/` con ficha; `app/` con providers | WebP; la ficha y los providers no existen (el mapa ya existe)                                                                                      |
| `sistema-de-diseno.md` (Touch and sizes): los gestos siempre tienen alternativa de botón (zoom +/−)    | Brecha de accesibilidad pendiente, **no una excepción aprobada**: el mapa se acerca solo con gestos y una prueba exige que no haya botones de zoom |
| `docs/producto/SPRINTS.md` (Sprint 2): alineación con contorno provisional, botones "Listo" y "Saltar" | Sin contorno (decisión del equipo según el estado previo); botones "Ver el mapa", "Saltar" y "Continuar sin cámara"                                |
| `docs/producto/SPRINTS.md` (Sprint 2): "el mapa no es del Sprint 2"                                    | Existe un mapa inicial (PR #8)                                                                                                                     |

## Rama sin fusionar

`origin/docs/prueba-rls`: contiene `supabase/probar-rls.mjs` y el script `db:probar-rls`; está desfasada respecto a `main`.
