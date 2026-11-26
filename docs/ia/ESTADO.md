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
- **Santi animado (GSAP)**: `componentes/Santi/SantiAnimado` con reposo, saludo, habla, señalar y celebración, hechos con las imágenes de `assets/santi`. Saluda en la bienvenida, señala en la confirmación, habla en la explicación de la cámara y en la ficha mientras suena la narración (el pico sigue el volumen con Web Audio, `visitante/analizadorVoz.ts`) y celebra con confeti al completar un punto. En el mapa queda la cabeza fija (decisión del equipo, nov. 2026: sin "señalar" allí). Con movimiento reducido no se mueve. Sin narraciones reales: la ficha muestra "Audio próximamente"; `/estilos` genera un audio de prueba en el navegador para revisarlo.
- **Gestor**: el editor de un punto va en cinco pasos (textos, narración, fotos, fuentes y revisión) con su estado (listo, falta algo, falta lo opcional) y una lista de lo que falta en la revisión (`gestor/pasos.ts`; avisa, no bloquea). Cada campo dice si es obligatorio u opcional y si está lleno; vacío lleva borde punteado. Las fotos son una galería de mosaicos con un solo panel de edición. Cada ficha (es, en) sube, escucha, reemplaza y quita su narración (MP3 o M4A); cambiarla en una ficha publicada la devuelve a revisión. En computadora el gestor llega a `gestor-max`. La contraseña se puede mostrar al entrar.
- Experiencia por punto: confirmación (`/confirmacion`) y ficha (`/punto`) con barra de audio, secciones (qué ves, historia, dato de Santi), archivo, fuentes con insignia de nivel de confianza, Anterior/Siguiente y la acción explícita de completar. El dato de Santi y las fuentes solo aparecen si el punto los tiene. Las fotos, el audio y el archivo se muestran si los datos los traen; si faltan, los espacios quedan vacíos y el contenido se indica como pendiente.
- Datos de demostración (`datos/puntos-demo.ts`): completan hasta 12 puntos mientras la base tenga menos de `MINIMO_PUNTOS_REALES` (`datos/recorrido.ts`). No son contenido patrimonial.
- Selector de zonas leído de Supabase, con estados de carga/error/reintento y zonas "Próximamente".
- Componentes base, sistema de tokens generado y tema de alto contraste **en CSS**; imágenes de Santi (35 poses).
- Esquema, RLS y bucket `medios` en `supabase/migrations/`; tipos generados; CI.
- Textos de la interfaz desde la base (Sprint 4 · bloque 1, rama `feat/ficha-textos`): migración de `textos_interfaz`
  (lectura pública, escritura solo admin), semilla generada desde los JSON y carga al abrir la app con respaldo
  en los JSON (`i18n/textosBase.ts`). Migraciones y semilla aplicadas en `la-merced-dev` (16 nov 2026).
- **Editor de textos de las pantallas** (`/gestor/textos`, solo admin, rama `feat/textos-pantallas`): bienvenida (título,
  subtítulo, botón), título de idioma, título y pregunta de ruta, título de zona y pregunta de la confirmación, en es, en
  y cak. La pantalla real se ve en un iframe con `?vista-previa` (`i18n/vistaPrevia.ts`) que recibe los borradores por
  `postMessage` y marca el texto del campo enfocado; en ese modo la app no guarda idioma ni copia en el dispositivo.
  Guardar escribe en `textos_interfaz`; "Volver al original" borra la fila. En kaqchikel sin traducción el campo
  empieza vacío y la vista previa muestra el español. Entrada desde la pestaña «Textos» de la navegación del gestor
  (`gestor/secciones.ts`), que solo ve el admin.
- **Ubicación, clasificación y orden de puntos** (`/gestor/ubicaciones`, Sprint 4 · bloque 3, rama
  `feat/gestor-puntos-lectura`; editor, revisor y admin): arrastrar o mover con el teclado cada punto sobre la
  ilustración de su zona, marcarlo esencial u opcional y reordenarlo con «Subir» y «Bajar», todo en un borrador local
  hasta «Guardar cambios» (`gestor/ubicacion.ts`, `orden.ts`, `guardado.ts`). Posiciones y clasificación se guardan
  por punto (`datos/ubicaciones.ts`, sin atomicidad); el orden, por zona con la función `reordenar_puntos`
  (`datos/reordenar.ts`, atómica por zona, conserva los valores de `orden`). El gestor no crea ni borra puntos.
  La migración `20261123000001_reordenar_puntos.sql` está aplicada en `la-merced-dev` (no en otros proyectos); su guía
  de aplicación y reversión es `docs/ia/MIGRACION-S4B3-4-REORDENAR-PUNTOS.md`. `tipos-db.ts` aún no conoce la
  función (`db:types` pendiente de aprobación).
- **Gestor: audios, publicación y carga de las fichas** (Sprint 4, rama `feat/gestor-audios-publicacion`):
  fichas en es, en y **cak** con estado por idioma y transcripción por idioma; narración por idioma con
  progreso, errores del servidor y sin borrar audios compartidos; filtro «Con fichas en revisión»;
  `/gestor/faltantes` (CSV y Markdown); `/gestor/publicar` (solo admin) con la función `api/publicar.ts`,
  el paso de build `scripts/incluir-instantanea.mjs` y el respaldo `src/datos/respaldo.ts` en la app;
  importación `npm run importar` (`docs/ia/IMPORTACION-FICHAS.md`). La migración
  `20261125000001_audios_procedencia_publicaciones.sql` **no está aplicada** y falta `VERCEL_DEPLOY_HOOK_URL`
  en Vercel: hasta entonces «Publicar» y la importación no funcionan contra la base (ver
  `docs/ia/MIGRACION-S4-AUDIOS-PUBLICACION.md`). No se recibió material de la URL: 0 fichas importadas.
- Gestor de fichas (`/gestor`, Sprint 3 · bloque 3): inicio de sesión con roles, lista
  de puntos por zona, ficha por idioma (es y en), estados borrador / revisión / aprobado según el rol, foto del
  detalle y fotos históricas con créditos, fuentes con nivel de confianza. Acceso desde la bienvenida.

## Verificación: implementado frente a comprobado

Las pruebas de la tabla existen en el repositorio; **no se ejecutaron al escribir este archivo** (falta `node_modules`).
La última columna es lo que ninguna prueba automática puede dar por cumplido.

| Funcionalidad                                    | Pruebas automáticas que existen                                                                         | Comprobación manual o en dispositivo                                                                                                                                                                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Entrada (bienvenida, idioma, ruta, zona)         | `preferencias.test.ts`, `traducciones.test.ts`, `zonas.test.tsx`                                        | No consta ninguna                                                                                                                                                                                                                                                                                     |
| Explicación de cámara (`/camara`)                | `camara-pantallas.test.tsx`, `camara.test.ts`                                                           | No consta ninguna                                                                                                                                                                                                                                                                                     |
| Alineación (`/alineacion`, `getUserMedia`)       | `camara.test.ts`, `camara-pantallas.test.tsx`                                                           | **No**: sin probar en Chrome Android, Samsung Internet ni iOS                                                                                                                                                                                                                                         |
| Mapa (`/mapa`, gestos, progreso, ayuda)          | `mapa.test.ts`, `gestos.test.ts`, `mapa-pantallas.test.tsx`, `progreso.test.ts`, `preferencias.test.ts` | **No**: los gestos táctiles no se han probado en un teléfono                                                                                                                                                                                                                                          |
| Confirmación y ficha (`/confirmacion`, `/punto`) | `punto-pantallas.test.tsx`, `puntos.test.ts`, `recorrido.test.ts`                                       | Solo en navegador de escritorio con datos simulados; no contra Supabase real ni en un teléfono                                                                                                                                                                                                        |
| Santi hablando sobre la cámara                   | `habla.test.ts`                                                                                         | No consta ninguna                                                                                                                                                                                                                                                                                     |
| Textos de la interfaz desde la base              | `textosBase.test.ts`, `textos.test.ts`, `semilla-textos.test.ts`                                        | Probado en navegador de escritorio: respaldo a los JSON sin la tabla y lectura real de `la-merced-dev`; no en teléfono                                                                                                                                                                                |
| Editor de textos (`/gestor/textos`)              | `gestor/textos.test.ts`, `vistaPrevia.test.ts`, `textos.test.ts`                                        | Navegador de escritorio con sesión y base simuladas (vista previa, idiomas, guardado interceptado); no contra la base real                                                                                                                                                                            |
| Ubicación y orden (`/gestor/ubicaciones`)        | `ubicacion.test.ts`, `orden.test.ts`, `guardado.test.ts`, `ubicaciones.test.ts`, `reordenar.test.ts`    | RPC probada en SQL con los 3 roles en `la-merced-dev`; pantalla validada por el equipo en navegador; no en teléfono                                                                                                                                                                                   |
| Audios, publicación y respaldo (Sprint 4)        | `publicacion/*.test.ts`, `respaldo.test.ts`, `faltantes.test.ts`, `importar.test.ts`, `audios.test.ts`  | Navegador de escritorio contra `la-merced-dev` (25 nov 2026): tres idiomas, audio y transcripción tras recargar, rechazos reales de Storage, 403 a editor y revisor por petición directa, respaldo con caída simulada. Publicar real e importación real: pendientes de la migración y del deploy hook |
| Gestor de fichas (`/gestor`)                     | `sesion.test.ts`, `gestor*.test.ts`, `fotos.test.ts`, `fuentes.test.ts`, `gestor/*.test.ts`             | Probado en navegador de escritorio contra `la-merced-dev` con los usuarios de prueba (nov. 2026); no en teléfono                                                                                                                                                                                      |

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
- **"Ver cómo era"**: botón en el mapa y pantalla `/ver-como-era` con `<model-viewer>` (girar y pellizcar, sin cámara). El modelo es una esfera provisional de prueba; faltan los volúmenes en Blender, las partes con nivel de confianza y "Ver en 3D" en la ficha.
- **Ficha**: no incluye "Ver en 3D".

## Solo estructura o marcador

- Componentes especificados y no implementados: hoja inferior/diálogo, banners.

## No existe (según búsqueda en `src/` y `package.json`)

Modelo 3D real (solo hay una esfera provisional, ver Parcial), PWA / uso sin conexión, interruptor de tema `contrast`
en producción (solo en `/estilos`), ajuste de texto grande, modo respeto, estampa animada al completar un punto.

## Discrepancias especificación ↔ código (informativas)

| Especificado                                                                                           | Implementado                                                                                                        |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
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

## Prueba de reglas de acceso

`supabase/probar-rls.mjs` (`npm run db:probar-rls`) se fusionó en `main` con el PR #2 (6 nov 2026).
