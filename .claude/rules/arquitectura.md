---
paths:
  - 'src/**/*.ts'
  - 'src/**/*.tsx'
  - 'vite.config.ts'
  - 'eslint.config.js'
---

# Arquitectura

Mapa y flujos: `docs/ia/ARQUITECTURA.md`. Convenciones de equipo: `README.md` (sección Convenciones).

- **Acceso a datos.** Las pantallas y componentes usan funciones de `src/datos/`. Solo `src/datos/` y `src/lib/` pueden tocar Supabase. ESLint bloquea únicamente el import de `@supabase/supabase-js`; **no** bloquea `@/lib/supabase` ni `@/lib/storage`, así que no los importes desde fuera de esas carpetas.
- **Errores de datos.** Las funciones de `src/datos/` lanzan `Error` con mensaje en español; la pantalla decide cómo mostrarlo (ver estados `cargando/error/listo` en `src/visitante/PantallaZona.tsx`).
- **Tipos de la base** vienen de `@/lib/tipos-db` (generado). No los copies a mano.
- **Preferencias del visitante** (idioma, ruta) pasan por `src/lib/preferencias.ts`, con acceso defensivo a `localStorage`.
- **Rutas** en `src/app/router.tsx`. El gestor se carga de forma diferida y nada del visitante lo importa. `/estilos` existe solo con `import.meta.env.DEV`.
- **Nombres.** Español para lo propio; no traduzcas APIs ni identificadores de bibliotecas (`useNavigate`, `Outlet`, `import.meta`). Alias `@/` para imports internos.
- **TypeScript.** `strict`, `noUncheckedIndexedAccess`, `erasableSyntaxOnly` (sin `enum` ni parameter properties).
- **Alcance.** No cambies la arquitectura, añadas capas (stores globales, nuevas bibliotecas) ni refactorices código fuera de tu tarea. Si crees que hace falta, propónlo y espera aprobación.
- **Pruebas.** Entorno `node`, sin DOM: los componentes se prueban con `renderToStaticMarkup` (ver `src/visitante/zonas.test.tsx`). No añadas jsdom ni Testing Library sin aprobación (son dependencias).
