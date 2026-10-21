# Traducciones pendientes al kaqchikel

Para el equipo de investigación. Estas claves todavía no están en `src/i18n/cak.json`, así que la app las muestra en español cuando el visitante elige kaqchikel.

Cómo agregarlas:

- Copia la clave en `cak.json` con la misma estructura que en `es.json`. Por ejemplo, `bienvenida.titulo` va como `{ "bienvenida": { "titulo": "..." } }`.
- Lo que está entre llaves dobles (`{{count}}`, `{{duracion}}`, `{{idioma}}`) se deja igual: la app lo reemplaza por un número o un texto.
- `zona.puntos_one` es el singular ("1 punto") y `zona.puntos_other` el plural ("3 puntos"). Si en kaqchikel no cambia, pon el mismo texto en las dos.
- Cuando traduzcas una clave, bórrala de esta lista. La prueba `src/i18n/traducciones.test.ts` falla si falta en `cak.json` una clave que no está listada aquí.

| Clave                       | Español                                                        | English                                                                          |
| --------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `comun.continuar`           | Continuar                                                      | Continue                                                                         |
| `comun.cargando`            | Cargando…                                                      | Loading…                                                                         |
| `comun.reintentar`          | Reintentar                                                     | Try again                                                                        |
| `comun.proximamente`        | Próximamente                                                   | Coming soon                                                                      |
| `comun.cambiarIdioma`       | Cambiar idioma. Idioma actual: {{idioma}}                      | Change language. Current language: {{idioma}}                                    |
| `navegacion.atras`          | Atrás                                                          | Back                                                                             |
| `navegacion.volverAlInicio` | Atrás, volver al inicio                                        | Back to start                                                                    |
| `navegacion.idioma`         | Idioma                                                         | Language                                                                         |
| `navegacion.volverAIdioma`  | Volver a elegir idioma                                         | Back to choose language                                                          |
| `navegacion.ruta`           | Ruta                                                           | Route                                                                            |
| `navegacion.volverARuta`    | Volver a elegir ruta                                           | Back to choose route                                                             |
| `navegacion.zonas`          | Zonas                                                          | Zones                                                                            |
| `navegacion.volverAZonas`   | Volver a la elección de zonas                                  | Back to zones                                                                    |
| `navegacion.camara`         | Cámara                                                         | Camera                                                                           |
| `navegacion.volverACamara`  | Volver a la explicación de la cámara                           | Back to the camera explanation                                                   |
| `bienvenida.titulo`         | ¡Hola! Soy Santi                                               | Hi! I'm Santi                                                                    |
| `bienvenida.subtitulo`      | Te acompaño a descubrir La Merced.                             | I'll help you discover La Merced.                                                |
| `bienvenida.empezar`        | Empezar                                                        | Start                                                                            |
| `idioma.titulo`             | Elige tu idioma                                                | Choose your language                                                             |
| `ruta.titulo`               | ¿Cómo quieres recorrerla?                                      | How do you want to explore it?                                                   |
| `ruta.duracionPendiente`    | [X] min                                                        | [X] min                                                                          |
| `ruta.recomendada.nombre`   | Recomendada                                                    | Recommended                                                                      |
| `ruta.recomendada.detalle`  | Todos los puntos · {{duracion}}                                | Every point · {{duracion}}                                                       |
| `ruta.esencial.nombre`      | Esencial                                                       | Essential                                                                        |
| `ruta.esencial.detalle`     | Lo más importante · {{duracion}}                               | The highlights · {{duracion}}                                                    |
| `ruta.libre.nombre`         | Libre                                                          | Free                                                                             |
| `ruta.libre.detalle`        | Tú eliges el orden                                             | You choose the order                                                             |
| `zona.titulo`               | Elige tu zona                                                  | Choose your zone                                                                 |
| `zona.puntos_one`           | {{count}} punto                                                | {{count}} point                                                                  |
| `zona.puntos_other`         | {{count}} puntos                                               | {{count}} points                                                                 |
| `zona.sinImagen`            | Imagen de la zona pendiente                                    | Zone image coming soon                                                           |
| `zona.error`                | No se pudieron cargar las zonas. Revisa tu conexión.           | The zones couldn't be loaded. Check your connection.                             |
| `camara.explicacion`        | Apunta la cámara a la fachada para ubicarnos. Solo es una vez. | Point your camera at the façade so we can find our place. You only do this once. |
| `camara.activar`            | Activar cámara                                                 | Turn on camera                                                                   |
| `camara.saltar`             | Saltar                                                         | Skip                                                                             |
| `enConstruccion.titulo`     | En construcción                                                | Under construction                                                               |
| `enConstruccion.texto`      | Esta pantalla llega pronto.                                    | This screen is coming soon.                                                      |
| `zonas.fachada-principal`   | Fachada principal                                              | Main façade                                                                      |
| `zonas.fachada-secundaria`  | Fachada secundaria                                             | Side façade                                                                      |
| `zonas.interior`            | Interior                                                       | Interior                                                                         |     | Clave | Español | English |
| ---                         | ---                                                            | ---                                                                              |
| `comun.continuar`           | Continuar                                                      | Continue                                                                         |
| `comun.cargando`            | Cargando…                                                      | Loading…                                                                         |
| `comun.reintentar`          | Reintentar                                                     | Try again                                                                        |
| `comun.proximamente`        | Próximamente                                                   | Coming soon                                                                      |
| `comun.cambiarIdioma`       | Cambiar idioma. Idioma actual: {{idioma}}                      | Change language. Current language: {{idioma}}                                    |
| `navegacion.atras`          | Atrás                                                          | Back                                                                             |
| `navegacion.volverAlInicio` | Atrás, volver al inicio                                        | Back to start                                                                    |
| `navegacion.idioma`         | Idioma                                                         | Language                                                                         |
| `navegacion.volverAIdioma`  | Volver a elegir idioma                                         | Back to choose language                                                          |
| `navegacion.ruta`           | Ruta                                                           | Route                                                                            |
| `navegacion.volverARuta`    | Volver a elegir ruta                                           | Back to choose route                                                             |
| `navegacion.zonas`          | Zonas                                                          | Zones                                                                            |
| `navegacion.volverAZonas`   | Volver a la elección de zonas                                  | Back to zones                                                                    |
| `navegacion.camara`         | Cámara                                                         | Camera                                                                           |
| `navegacion.volverACamara`  | Volver a la explicación de la cámara                           | Back to the camera explanation                                                   |
| `bienvenida.titulo`         | ¡Hola! Soy Santi                                               | Hi! I'm Santi                                                                    |
| `bienvenida.subtitulo`      | Te acompaño a descubrir La Merced.                             | I'll help you discover La Merced.                                                |
| `bienvenida.empezar`        | Empezar                                                        | Start                                                                            |
| `idioma.titulo`             | Elige tu idioma                                                | Choose your language                                                             |
| `ruta.titulo`               | Elige tu ruta                                                  | Choose your route                                                                |
| `ruta.intro`                | ¿Cómo quieres recorrer la fachada?                             | How do you want to explore the façade?                                           |
| `ruta.duracionPendiente`    | [X] min                                                        | [X] min                                                                          |
| `ruta.recomendada.nombre`   | Recomendada                                                    | Recommended                                                                      |
| `ruta.recomendada.detalle`  | Todos los puntos · {{duracion}}                                | Every point · {{duracion}}                                                       |
| `ruta.esencial.nombre`      | Esencial                                                       | Essential                                                                        |
| `ruta.esencial.detalle`     | Lo más importante · {{duracion}}                               | The highlights · {{duracion}}                                                    |
| `ruta.libre.nombre`         | Libre                                                          | Free                                                                             |
| `ruta.libre.detalle`        | Tú eliges el orden                                             | You choose the order                                                             |
| `zona.titulo`               | Elige tu zona                                                  | Choose your zone                                                                 |
| `zona.puntos_one`           | {{count}} punto                                                | {{count}} point                                                                  |
| `zona.puntos_other`         | {{count}} puntos                                               | {{count}} points                                                                 |
| `zona.sinImagen`            | Imagen de la zona pendiente                                    | Zone image coming soon                                                           |
| `zona.error`                | No se pudieron cargar las zonas. Revisa tu conexión.           | The zones couldn't be loaded. Check your connection.                             |
| `camara.explicacion`        | Apunta la cámara a la fachada para ubicarnos. Solo es una vez. | Point your camera at the façade so we can find our place. You only do this once. |
| `camara.activar`            | Activar cámara                                                 | Turn on camera                                                                   |
| `camara.saltar`             | Saltar                                                         | Skip                                                                             |
| `enConstruccion.titulo`     | En construcción                                                | Under construction                                                               |
| `enConstruccion.texto`      | Esta pantalla llega pronto.                                    | This screen is coming soon.                                                      |
| `zonas.fachada-principal`   | Fachada principal                                              | Main façade                                                                      |
| `zonas.fachada-secundaria`  | Fachada secundaria                                             | Side façade                                                                      |
| `zonas.interior`            | Interior                                                       | Interior                                                                         |
