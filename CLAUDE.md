# La Merced: guía digital patrimonial

App web móvil para visitar la Iglesia de La Merced (Antigua Guatemala) con Santi, el quetzal guía.
Proyecto UVG × FUNPANCHOY. El equipo humano decide qué se construye; tú ejecutas tareas aprobadas.
Este archivo es un índice: la verdad está en las fuentes que enlaza. Si algo aquí las contradice, gana la fuente.

## Stack y estructura (ver `package.json`, `README.md`, `docs/ia/ARQUITECTURA.md`)

React 19 + TypeScript estricto + Vite, react-router 7, i18next (es / cak / en), CSS plano con tokens,
Supabase (Postgres, Auth, Storage), Vercel, Vitest. Node 24 (`.nvmrc`). Alias `@/` → `src/`.

- `src/visitante/` pantallas del visitante · `src/componentes/` componentes compartidos · `src/app/` router
- `src/datos/` y `src/lib/` único acceso a Supabase · `src/i18n/` traducciones · `src/gestor/` panel (stub, carga diferida)
- `docs/diseno/` Design System · `supabase/` migraciones y seed · `scripts/` generadores

## Fuentes de verdad por dominio

| Dominio                                                                      | Fuente                                       |
| ---------------------------------------------------------------------------- | -------------------------------------------- |
| Valores visuales (color, espaciado, tipografía, radios, sombras, movimiento) | `docs/diseno/tokens.json`                    |
| Combinaciones de contraste permitidas y prohibidas                           | `docs/diseno/contraste.md`                   |
| Principios y reglas visuales                                                 | `docs/diseno/sistema-de-diseno.md`           |
| Especificación de componentes                                                | `docs/diseno/componentes.md`                 |
| Convenciones de equipo, esquema, RLS, despliegue                             | `README.md`, `supabase/migrations/`          |
| Frontera de acceso a datos                                                   | `eslint.config.js`                           |
| Estado real y decisiones abiertas                                            | `docs/ia/ESTADO.md`, `docs/ia/DECISIONES.md` |
| Propósito, alcance, flujos y criterios de aceptación del producto            | `docs/producto/` (`ALCANCE.md` primero)      |

Cada documento gobierna su dominio; no hay precedencia universal. Si dos documentos normativos se
contradicen, **informa y pide una decisión humana**; no elijas tú.

## Autonomía supervisada

Sin pedir aprobación, dentro de una tarea ya autorizada: leer código y docs no sensibles, editar los
archivos del alcance, reutilizar componentes, implementar lo especificado, ejecutar lint/typecheck/test/build,
escribir pruebas relacionadas y hacer correcciones locales necesarias.

**Pide aprobación antes de:** cambiar la arquitectura general; editar `docs/diseno/`; introducir convenciones
visuales; instalar, actualizar o quitar dependencias; tocar esquema, migraciones o RLS; operar contra bases
remotas; cambiar CI, despliegue o seguridad; refactorizar fuera del alcance; decidir producto no especificado.

**Nunca:** hacer `git commit` o `git push` por tu cuenta, tocar `main`, desplegar, leer o mostrar secretos,
ejecutar comandos destructivos sin permiso, inventar traducciones al kaqchikel, inventar contenido histórico
o niveles de confianza patrimonial, ni declarar verificaciones que no ejecutaste.

## Cinco decisiones innegociables

**A. El Design System es normativo.** Antes de cambiar algo visual, lee la fuente que corresponda.
Reutiliza `src/componentes/` y los tokens. No inventes colores, espaciados, tipografías, radios, animaciones
ni pares de contraste. No dupliques valores del Design System en instrucciones para IA. Si falta un token o
componente, di qué falta y propón cómo seguir. Detalle: `.claude/rules/design-system.md`.

**B. Una diferencia entre especificación y código no es permiso para cambiar el sistema.** Ejemplo vigente:
el diseño menciona GSAP, el código usa animaciones CSS y GSAP no está instalado. Reconócelo, no lo "arregles".
No modifiques documentos aprobados para que coincidan con el código ni refactorices para igualar una
especificación sin tarea aprobada. Los hallazgos de las auditorías no son tareas automáticas. Si la
diferencia bloquea tu trabajo, detente y pregunta. Detalle: `.claude/rules/fuentes-de-verdad.md`.

**C. La documentación no sustituye las pruebas.** Nada está terminado porque "el código parece correcto".
Ejecuta las verificaciones y reporta resultados reales; no modifiques pruebas para ocultar errores; no
afirmes que algo funciona en un dispositivo real sin haberlo probado. Detalle: `.claude/rules/verificacion.md`.

**D. El contexto de producto es normativo.** Antes de implementar una funcionalidad, consulta su propósito,
alcance y criterios en `docs/producto/` (`ALCANCE.md` primero). No amplíes el alcance ni sustituyas una
decisión de experiencia por una solución técnica más compleja sin aprobación. Que algo esté en el alcance
no lo convierte en tarea. Detalle: `.claude/rules/producto.md`.

**E. Preparar una migración y aplicarla son acciones distintas.** Aprobar un cambio de esquema autoriza, como
mucho, escribir el archivo; no autoriza ejecutarlo en ningún entorno. Aplicarla exige una instrucción humana
explícita aparte. Detalle: `.claude/rules/seguridad-datos.md`.

## Convenciones

- Identificadores propios en español (`camelCase`; componentes `PascalCase`; tablas y columnas `snake_case`). No traduzcas APIs ni nombres de bibliotecas.
- Textos visibles solo vía i18n; ninguna cadena en JSX. CSS plano: solo `var(--token)`; clases en español estilo BEM.
- Ningún componente llama a Supabase: todo pasa por `src/datos/`. Migraciones nuevas, nunca editar una aplicada.
- Generados, no se editan a mano: `src/estilos/tokens.css` (`npm run tokens`), `src/lib/tipos-db.ts`
  (`npm run db:types`), WebP de `src/assets/santi/` (`npm run santi`). Cambia su fuente y regenera, con aprobación.
- Gestor (`/gestor`) en chunk aparte; `/estilos` solo en desarrollo.

## Comandos (los de `package.json`; Node 24)

`npm run lint` · `npm run typecheck` · `npm run test` · `npm run build` · `npm run dev`.
La CI corre los cuatro primeros. Si falta `node_modules`, **no instales**: dilo y reporta qué no se verificó.

## Seguridad

Nunca leas ni imprimas `.env*`; los nombres de variables están en `.env.example` (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`). `service_role` no se usa en el frontend ni se escribe en el repo. Los permisos de
`.claude/settings.json` ayudan pero no son una garantía total: la prudencia es tuya. Si ves un posible secreto
expuesto, informa dónde y de qué tipo, sin reproducirlo. Detalle: `.claude/rules/seguridad-datos.md`.

## Git y revisión humana

Trabaja en rama `feat/*` o `fix/*`, nunca en `main`. Al terminar, deja los cambios **sin commit** para
revisión humana. Si el humano pide commit, usa mensajes en español con prefijo (`feat:`, `fix:`, `chore:`,
`docs:`). No hagas push. Las preferencias personales van en `.claude/settings.local.json`, que no debe subirse a Git.

## Cómo reportar

Separa siempre: **implementado**, **verificado automáticamente**, **pendiente de verificación manual**,
**no verificado**, **bloqueado o fallido**. Indica qué comandos corriste y su resultado real.

## Más información

`.claude/rules/` (reglas por área, se cargan según los archivos que toques) · `docs/ia/` (estado, arquitectura,
decisiones) · `docs/producto/` (producto) · `documentos/README.md` (índice de los PDF formales) ·
`README.md` (instalación, base de datos, despliegue).
