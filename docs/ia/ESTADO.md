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
- Mapa (`/mapa`, vertical): ilustración con marcadores (`MarcadorPunto`); un dedo mueve, dos dedos pellizcan para el zoom y el doble toque alterna entre la fachada entera y la vista inicial, con botones de acercar, alejar y restablecer como alternativa (lógica en `visitante/gestos.ts`). Tocar un punto lo selecciona y lo acerca antes de abrir su confirmación; con movimiento reducido el cambio es inmediato (`visitante/movimiento.ts`). Progreso "3/12" calculado de los puntos completados, guardados por zona en el teléfono (`visitante/progreso.ts`). Leyenda y Santi con el siguiente punto según la ruta guardada; en la primera visita, Santi da la instrucción inicial.
- Experiencia por punto: confirmación (`/confirmacion`) y ficha (`/punto`) con barra de audio, secciones, archivo, Anterior/Siguiente y la acción explícita de completar. Las fotos, el audio y el archivo se muestran si los datos los traen; si faltan, los espacios quedan vacíos y el contenido se indica como pendiente.
- Datos de demostración (`datos/puntos-demo.ts`): completan hasta 12 puntos mientras la base tenga menos de `MINIMO_PUNTOS_REALES` (`datos/recorrido.ts`). No son contenido patrimonial.
- Selector de zonas leído de Supabase, con estados de carga/error/reintento y zonas "Próximamente".
- Componentes base, sistema de tokens generado y tema de alto contraste **en CSS**; imágenes de Santi (35 poses).
- Esquema, RLS y bucket `medios` en `supabase/migrations/`; tipos generados; CI.

## Verificación: implementado frente a comprobado

Las pruebas de la tabla existen en el repositorio; **no se ejecutaron al escribir este archivo** (falta `node_modules`).
La última columna es lo que ninguna prueba automática puede dar por cumplido.

| Funcionalidad                                    | Pruebas automáticas que existen                                                                         | Comprobación manual o en dispositivo                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Entrada (bienvenida, idioma, ruta, zona)         | `preferencias.test.ts`, `traducciones.test.ts`, `zonas.test.tsx`                                        | No consta ninguna                                                                              |
| Explicación de cámara (`/camara`)                | `camara-pantallas.test.tsx`, `camara.test.ts`                                                           | No consta ninguna                                                                              |
| Alineación (`/alineacion`, `getUserMedia`)       | `camara.test.ts`, `camara-pantallas.test.tsx`                                                           | **No**: sin probar en Chrome Android, Samsung Internet ni iOS                                  |
| Mapa (`/mapa`, gestos, progreso, ayuda)          | `mapa.test.ts`, `gestos.test.ts`, `mapa-pantallas.test.tsx`, `progreso.test.ts`, `preferencias.test.ts` | **No**: los gestos táctiles no se han probado en un teléfono                                   |
| Confirmación y ficha (`/confirmacion`, `/punto`) | `punto-pantallas.test.tsx`, `puntos.test.ts`, `recorrido.test.ts`                                       | Solo en navegador de escritorio con datos simulados; no contra Supabase real ni en un teléfono |
| Santi hablando sobre la cámara                   | `habla.test.ts`                                                                                         | No consta ninguna                                                                              |

Criterios de terminado del Sprint 2 (`docs/producto/SPRINTS.md`). **Este archivo no da ninguno por cumplido;** lo decide el equipo:

| Criterio                                                         | Qué hay                                                                                                                                        |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| La app publicada muestra el punto de prueba guardado en la base  | Código para leerlo (`obtenerPuntosDeZona` en el mapa). Publicación y base no comprobadas desde el repositorio.                                 |
| El equipo aprueba las maquetas; componentes base en el código    | Componentes base: en el código. Aprobación de maquetas: sin evidencia en el repositorio (faltan los wireframes, según `documentos/README.md`). |
| En Chrome y Samsung Internet se puede alinear, saltar o negar    | Implementado y con pruebas de lógica. **No verificado** en esos navegadores.                                                                   |
| Se navega de bienvenida a cámara; idioma y ruta quedan guardados | Implementado y con pruebas de preferencias. Recorrido completo sin comprobar en navegador.                                                     |

## Parcial

- **Cámara**: sin probar en dispositivos físicos (Chrome Android, Samsung Internet, iOS). "Solo es una vez" no se recuerda entre visitas (no hay requisito de persistencia).
- **Mapa**: los puntos reales, sus posiciones y sus fichas dependen de investigación; mientras tanto se completan con datos de demostración. No se da por cumplido el mapa del Sprint 3 (`docs/producto/SPRINTS.md`).
- **Preferencias**: la duración de las rutas sigue siendo un marcador ("[X] min").
- **Kaqchikel**: 3 de 74 claves traducidas; el resto cae a español (`src/i18n/PENDIENTE-cak.md`).
- **Datos de contenido**: el seed tiene un único punto de prueba (con ficha solo en español), que se muestra junto a los de demostración.
- **Ficha**: no incluye dato de Santi, fuentes, nivel de confianza ni "Ver en 3D".

## Solo estructura o marcador

- `/gestor` (stub, "Sprint 3").
- Componentes especificados y no implementados: hoja inferior/diálogo, banners.

## No existe (según búsqueda en `src/` y `package.json`)

Modelos 3D, login/CRUD del gestor, PWA / uso sin conexión, GSAP, interruptor de tema `contrast`
en producción (solo en `/estilos`), ajuste de texto grande, modo respeto, estampa animada al completar un punto.

## Discrepancias especificación ↔ código (informativas)

| Especificado                                                                                           | Implementado                                                                                                        |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `sistema-de-diseno.md` (Motion): GSAP                                                                  | Animaciones CSS; GSAP no instalado                                                                                  |
| `sistema-de-diseno.md` (Themes): `data-theme="contrast"` desde ajustes de accesibilidad                | Solo `desarrollo/PaginaEstilos.tsx` lo activa                                                                       |
| `componentes.md` (Top bar): borde inferior cuando el contenido pasa por debajo                         | `BarraSuperior` tiene la prop `conBorde`; ninguna pantalla la usa                                                   |
| `README.md` (Convenciones): ESLint impide llamar a Supabase fuera de `datos/` y `lib/`                 | La regla solo bloquea el paquete, no `@/lib/supabase`                                                               |
| `README.md` (Estructura): `assets/santi` "SVG por capas"; `visitante/` con ficha; `app/` con providers | WebP; la ficha y los providers no existen (el mapa ya existe)                                                       |
| `sistema-de-diseno.md` (Motion): zoom a un punto de 450ms                                              | 280ms (`--duration-slow`): no existe un token de 450ms                                                              |
| `componentes.md` (Hero header): relleno `ink` o `yellow-400`                                           | La ficha usa `green-700` con texto `surface`, pedido en la tarea                                                    |
| `componentes.md` (Badge): conteos con formato "3 / 12"                                                 | El mapa muestra "3/12", pedido en la tarea; a los lectores de pantalla se les anuncia "3 de 12 puntos"              |
| `FLUJOS.md` (Diagrama 2): al cerrar la ficha el punto queda visitado, con estampa animada              | El punto se completa con una acción explícita en la ficha, pedida en la tarea; sin estampa                          |
| `docs/producto/SPRINTS.md` (Sprint 2): alineación con contorno provisional, botones "Listo" y "Saltar" | Sin contorno (decisión del equipo según el estado previo); botones "Ver el mapa", "Saltar" y "Continuar sin cámara" |
| `docs/producto/SPRINTS.md` (Sprint 2): "el mapa no es del Sprint 2"                                    | Existe un mapa inicial (PR #8)                                                                                      |

## Rama sin fusionar

`origin/docs/prueba-rls`: contiene `supabase/probar-rls.mjs` y el script `db:probar-rls`; está desfasada respecto a `main`.
