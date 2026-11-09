# Traducciones pendientes al kaqchikel

Para el equipo de investigación. Estas claves todavía no están en `src/i18n/cak.json`, así que la app las muestra en español cuando el visitante elige kaqchikel.

Cómo agregarlas:

- Copia la clave en `cak.json` con la misma estructura que en `es.json`. Por ejemplo, `bienvenida.titulo` va como `{ "bienvenida": { "titulo": "..." } }`.
- Lo que está entre llaves dobles (`{{count}}`, `{{duracion}}`, `{{idioma}}`) se deja igual: la app lo reemplaza por un número o un texto.
- `zona.puntos_one` es el singular ("1 punto") y `zona.puntos_other` el plural ("3 puntos"). Si en kaqchikel no cambia, pon el mismo texto en las dos.
- Cuando traduzcas una clave, bórrala de esta lista. La prueba `src/i18n/traducciones.test.ts` falla si falta en `cak.json` una clave que no está listada aquí.

| Clave                             | Español                                                             | English                                                                          |
| --------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `comun.continuar`                 | Continuar                                                           | Continue                                                                         |
| `comun.cargando`                  | Cargando…                                                           | Loading…                                                                         |
| `comun.reintentar`                | Reintentar                                                          | Try again                                                                        |
| `comun.proximamente`              | Próximamente                                                        | Coming soon                                                                      |
| `comun.cambiarIdioma`             | Cambiar idioma. Idioma actual: {{idioma}}                           | Change language. Current language: {{idioma}}                                    |
| `navegacion.atras`                | Atrás                                                               | Back                                                                             |
| `navegacion.volverAlInicio`       | Atrás, volver al inicio                                             | Back to start                                                                    |
| `navegacion.idioma`               | Idioma                                                              | Language                                                                         |
| `navegacion.volverAIdioma`        | Volver a elegir idioma                                              | Back to choose language                                                          |
| `navegacion.ruta`                 | Ruta                                                                | Route                                                                            |
| `navegacion.volverARuta`          | Volver a elegir ruta                                                | Back to choose route                                                             |
| `navegacion.zonas`                | Zonas                                                               | Zones                                                                            |
| `navegacion.volverAZonas`         | Volver a la elección de zonas                                       | Back to zones                                                                    |
| `navegacion.camara`               | Cámara                                                              | Camera                                                                           |
| `navegacion.volverACamara`        | Volver a la explicación de la cámara                                | Back to the camera explanation                                                   |
| `navegacion.mapa`                 | Mapa                                                                | Map                                                                              |
| `navegacion.volverAlMapa`         | Volver al mapa                                                      | Back to the map                                                                  |
| `bienvenida.titulo`               | ¡Hola! Soy Santi                                                    | Hi! I'm Santi                                                                    |
| `bienvenida.subtitulo`            | Te acompaño a descubrir La Merced.                                  | I'll help you discover La Merced.                                                |
| `bienvenida.empezar`              | Empezar                                                             | Start                                                                            |
| `bienvenida.accesoEquipo`         | Acceso del equipo                                                   | Team access                                                                      |
| `idioma.titulo`                   | Elige tu idioma                                                     | Choose your language                                                             |
| `ruta.titulo`                     | Elige tu ruta                                                       | Choose your route                                                                |
| `ruta.intro`                      | ¿Cómo quieres recorrer la fachada?                                  | How do you want to explore the façade?                                           |
| `ruta.duracionPendiente`          | [X] min                                                             | [X] min                                                                          |
| `ruta.recomendada.nombre`         | Recomendada                                                         | Recommended                                                                      |
| `ruta.recomendada.detalle`        | Todos los puntos · {{duracion}}                                     | Every point · {{duracion}}                                                       |
| `ruta.esencial.nombre`            | Esencial                                                            | Essential                                                                        |
| `ruta.esencial.detalle`           | Lo más importante · {{duracion}}                                    | The highlights · {{duracion}}                                                    |
| `ruta.libre.nombre`               | Libre                                                               | Free                                                                             |
| `ruta.libre.detalle`              | Tú eliges el orden                                                  | You choose the order                                                             |
| `zona.titulo`                     | Elige tu zona                                                       | Choose your zone                                                                 |
| `zona.puntos_one`                 | {{count}} punto                                                     | {{count}} point                                                                  |
| `zona.puntos_other`               | {{count}} puntos                                                    | {{count}} points                                                                 |
| `zona.sinImagen`                  | Imagen de la zona pendiente                                         | Zone image coming soon                                                           |
| `zona.error`                      | No se pudieron cargar las zonas. Revisa tu conexión.                | The zones couldn't be loaded. Check your connection.                             |
| `camara.explicacion`              | Apunta la cámara a la fachada para ubicarnos. Solo es una vez.      | Point your camera at the façade so we can find our place. You only do this once. |
| `camara.activar`                  | Activar cámara                                                      | Turn on camera                                                                   |
| `camara.saltar`                   | Saltar                                                              | Skip                                                                             |
| `camara.errorZona`                | No se pudo cargar la zona. Revisa tu conexión.                      | The zone couldn't be loaded. Check your connection.                              |
| `alineacion.santi`                | ¡Ahí está La Merced! Vamos al mapa para recorrer la fachada juntos. | There's La Merced! Let's go to the map and explore the façade together.          |
| `alineacion.verMapa`              | Ver el mapa                                                         | See the map                                                                      |
| `alineacion.abriendo`             | Abriendo la cámara…                                                 | Opening the camera…                                                              |
| `alineacion.continuarSinCamara`   | Continuar sin cámara                                                | Continue without camera                                                          |
| `alineacion.errores.sinCamara`    | No encontramos una cámara en este dispositivo.                      | We couldn't find a camera on this device.                                        |
| `alineacion.errores.ocupada`      | La cámara está en uso por otra app. Ciérrala o continúa sin cámara. | Another app is using the camera. Close it or continue without the camera.        |
| `alineacion.errores.noCompatible` | Este navegador no permite usar la cámara.                           | This browser can't use the camera.                                               |
| `alineacion.errores.inseguro`     | La cámara solo funciona con una conexión segura (HTTPS).            | The camera only works over a secure connection (HTTPS).                          |
| `alineacion.errores.reproduccion` | No pudimos mostrar la imagen de la cámara.                          | We couldn't show the camera image.                                               |
| `alineacion.errores.interrumpida` | La cámara se detuvo.                                                | The camera stopped.                                                              |
| `alineacion.errores.desconocido`  | No pudimos abrir la cámara.                                         | We couldn't open the camera.                                                     |
| `punto.identificador`             | Detalle {{numero}}                                                  | Detail {{numero}}                                                                |
| `punto.identificadorConZona`      | {{identificador}} · {{zona}}                                        | {{identificador}} · {{zona}}                                                     |
| `punto.error`                     | No se pudo cargar este punto. Revisa tu conexión.                   | This point couldn't be loaded. Check your connection.                            |
| `punto.confirmacion.intro`        | ¡Lo viste en el mapa!                                               | You saw it on the map!                                                           |
| `punto.confirmacion.titulo`       | ¡Ese es!                                                            | That's the one!                                                                  |
| `punto.confirmacion.frase`        | Elegiste {{nombre}}. ¿Lo exploramos?                                | You chose {{nombre}}. Shall we explore it?                                       |
| `punto.confirmacion.verDetalle`   | Sí, ver detalle                                                     | Yes, see details                                                                 |
| `punto.audio.titulo`              | Escuchar historia                                                   | Listen to the story                                                              |
| `punto.audio.proximamente`        | Audio próximamente                                                  | Audio coming soon                                                                |
| `punto.audio.error`               | No se pudo cargar el audio                                          | The audio couldn't be loaded                                                     |
| `punto.audio.reproducir`          | Reproducir la historia                                              | Play the story                                                                   |
| `punto.audio.pausar`              | Pausar la historia                                                  | Pause the story                                                                  |
| `punto.audio.transcripcion`       | Transcripción                                                       | Transcript                                                                       |
| `punto.queVes`                    | Qué estás viendo                                                    | What you're seeing                                                               |
| `punto.historia`                  | Historia                                                            | History                                                                          |
| `punto.contenidoPendiente`        | Contenido pendiente de investigación.                               | Content pending research.                                                        |
| `punto.archivo.titulo`            | En el archivo                                                       | In the archive                                                                   |
| `punto.archivo.desliza`           | Desliza para ver más                                                | Swipe to see more                                                                |
| `punto.archivo.sinFecha`          | Fecha pendiente                                                     | Date pending                                                                     |
| `punto.archivo.sinCredito`        | Crédito pendiente                                                   | Credit pending                                                                   |
| `punto.marcarCompletado`          | Marcar como completado                                              | Mark as completed                                                                |
| `punto.completado`                | Completado                                                          | Completed                                                                        |
| `punto.navegacion`                | Navegación del recorrido                                            | Route navigation                                                                 |
| `punto.anterior`                  | Anterior                                                            | Previous                                                                         |
| `punto.siguiente`                 | Siguiente                                                           | Next                                                                             |
| `zonas.fachada-principal`         | Fachada principal                                                   | Main façade                                                                      |
| `zonas.fachada-secundaria`        | Fachada secundaria                                                  | Side façade                                                                      |
| `zonas.interior`                  | Interior                                                            | Interior                                                                         |
| `mapa.progreso`                   | {{visitados}}/{{total}}                                             | {{visitados}}/{{total}}                                                          |
| `mapa.progresoValor_one`          | {{visitados}} de {{count}} punto                                    | {{visitados}} of {{count}} point                                                 |
| `mapa.progresoValor_other`        | {{visitados}} de {{count}} puntos                                   | {{visitados}} of {{count}} points                                                |
| `mapa.progresoAccesible`          | Progreso del recorrido                                              | Route progress                                                                   |
| `mapa.ayuda.texto`                | Toca un punto para descubrirlo. Usa dos dedos para acercar el mapa. | Tap a point to discover it. Use two fingers to zoom in on the map.               |
| `mapa.ayuda.entendido`            | Entendido                                                           | Got it                                                                           |
| `mapa.leyenda.titulo`             | Tipos de punto                                                      | Point types                                                                      |
| `mapa.leyenda.esencial`           | Esencial                                                            | Essential                                                                        |
| `mapa.leyenda.opcional`           | Opcional                                                            | Optional                                                                         |
| `mapa.leyenda.visitado`           | Visitado                                                            | Visited                                                                          |
| `mapa.marcador`                   | Punto {{numero}}, {{nombre}}, {{tipo}}, {{estado}}                  | Point {{numero}}, {{nombre}}, {{tipo}}, {{estado}}                               |
| `mapa.marcadorSinNombre`          | Punto {{numero}}, {{tipo}}, {{estado}}                              | Point {{numero}}, {{tipo}}, {{estado}}                                           |
| `mapa.tipo.esencial`              | esencial                                                            | essential                                                                        |
| `mapa.tipo.opcional`              | opcional                                                            | optional                                                                         |
| `mapa.estado.visitado`            | visitado                                                            | visited                                                                          |
| `mapa.estado.noVisitado`          | no visitado                                                         | not visited                                                                      |
| `mapa.santi.siguiente`            | Toca el punto {{numero}}.                                           | Tap point {{numero}}.                                                            |
| `mapa.santi.libre`                | Elige un punto para empezar.                                        | Choose a point to start.                                                         |
| `mapa.controles.titulo`           | Controles del mapa                                                  | Map controls                                                                     |
| `mapa.controles.acercar`          | Acercar el mapa                                                     | Zoom in on the map                                                               |
| `mapa.controles.alejar`           | Alejar el mapa                                                      | Zoom out of the map                                                              |
| `mapa.controles.restablecer`      | Restablecer la vista del mapa                                       | Reset the map view                                                               |
| `mapa.error`                      | No se pudo cargar el mapa. Revisa tu conexión.                      | The map couldn't be loaded. Check your connection.                               |
| `mapa.verComoEra`                 | Ver cómo era                                                        | See how it was                                                                   |
| `modelo3d.titulo`                 | Cómo era                                                            | How it was                                                                       |
| `modelo3d.descripcion`            | Modelo 3D provisional: una esfera de prueba.                        | Provisional 3D model: a test sphere.                                             |
| `modelo3d.pista`                  | Gira con un dedo. Pellizca para acercar.                            | Rotate with one finger. Pinch to zoom.                                           |
| `modelo3d.provisional`            | Modelo de prueba: todavía no representa la iglesia.                 | Test model: it doesn't show the church yet.                                      |
| `modelo3d.error`                  | No se pudo cargar el modelo. Revisa tu conexión.                    | The model couldn't be loaded. Check your connection.                             |
