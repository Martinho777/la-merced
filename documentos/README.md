# Documentos del proyecto

Índice de los documentos formales de la Guía digital La Merced (proyecto UVG × FUNPANCHOY), para
encontrarlos rápido sin conocer el código. Los PDF de esta carpeta son las versiones entregadas;
el resto de documentos vive en otras carpetas del repositorio y se enlaza abajo.

## En esta carpeta

| Documento                                                                    | Qué es                                                                                                                                                                                                                                                               | Fecha y autor          |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| [Guía digital La Merced · Sprint 1](sprint-1-guia-digital-la-merced-v2.pdf)  | Documento entregado del Sprint 1 (investigación y propuesta, del 8 de septiembre al 9 de octubre de 2026). Según el cronograma, reúne la investigación y los hallazgos, los fundamentos y la propuesta, el stack tecnológico y el cronograma. Versión 2, 21 páginas. | Sprint 1, octubre 2026 |
| [Cronograma de sprints](cronograma-de-sprints.pdf)                           | Plan de entrega de la fachada central: sprints 2 a 6 (13 oct 2026 – 8 feb 2027, con diciembre libre), diagrama de Gantt, los cuatro bloques de cada sprint, cuándo se da por terminado cada uno y las tres entregas del equipo de investigación (URL).               | 22 oct 2026 · @Martin  |
| [Material que necesitamos de la URL](material-que-necesitamos-de-la-url.pdf) | Lo que el equipo de investigación (URL) debe entregar y para cuándo: foto de referencia, lista de puntos, fichas, fotos, fuentes y nivel de confianza, traducciones y narración, información para el 3D, formato de los archivos y preguntas abiertas.               | 22 oct 2026 · @Martin  |

Nombres originales de los archivos, por si alguien los busca así: `Sprint1_Guia_Digital_La_Merced_v2 (2) (1).pdf`,
`Cronograma La Merced.pdf` y `Material URL.pdf`.

## En otras carpetas del repositorio

| Documento                               | Dónde                                                                     | Qué es                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Instalación, base de datos y despliegue | [`README.md`](../README.md)                                               | Cómo poner en marcha el proyecto, convenciones del equipo, esquema y reglas de acceso. |
| Sistema de diseño (aprobado)            | [`docs/diseno/sistema-de-diseno.md`](../docs/diseno/sistema-de-diseno.md) | Principios, color, tipografía, espaciado, movimiento y uso de Santi.                   |
| Componentes (aprobado)                  | [`docs/diseno/componentes.md`](../docs/diseno/componentes.md)             | Cómo se ve y se comporta cada pieza de la interfaz.                                    |
| Contraste de colores (aprobado)         | [`docs/diseno/contraste.md`](../docs/diseno/contraste.md)                 | Combinaciones de colores permitidas y prohibidas (WCAG 2.2 AA).                        |
| Valores del diseño (aprobado)           | [`docs/diseno/tokens.json`](../docs/diseno/tokens.json)                   | Colores, tamaños y tiempos exactos que usa la app.                                     |
| Estado del proyecto                     | [`docs/ia/ESTADO.md`](../docs/ia/ESTADO.md)                               | Qué está hecho, qué está a medias y qué falta.                                         |
| Decisiones del equipo                   | [`docs/ia/DECISIONES.md`](../docs/ia/DECISIONES.md)                       | Decisiones aprobadas y preguntas abiertas.                                             |
| Traducciones pendientes al kaqchikel    | [`src/i18n/PENDIENTE-cak.md`](../src/i18n/PENDIENTE-cak.md)               | Textos de la app que el equipo de investigación todavía tiene que traducir.            |
| Esquema de la base de datos             | [`supabase/migrations/`](../supabase/migrations/)                         | Tablas y reglas de acceso, un archivo por cambio.                                      |

## Falta en el repositorio

- **Wireframes** (`La Merced · Wireframes.pdf`): las maquetas de las pantallas. Conviene agregarlas a
  esta carpeta.

## Cómo agregar un documento

1. Copia el PDF (o el archivo final) a esta carpeta con un nombre corto, en minúsculas y con guiones,
   por ejemplo `fichas-fachada-central.pdf`.
2. Agrega una fila a la tabla de arriba: qué es, fecha y autor.
