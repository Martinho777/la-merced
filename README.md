# Guía digital patrimonial de La Merced

Aplicación web para visitar La Merced (Antigua Guatemala) con Santi, el quetzal guía.
Proyecto UVG × FUNPANCHOY.

- **App del visitante**: React + TypeScript + Vite, servida como sitio estático en Vercel.
- **Gestor de contenido** (`/gestor`): en el mismo proyecto, cargado aparte para que el visitante nunca lo descargue.
- **Datos, usuarios y archivos**: Supabase (PostgreSQL, Auth y Storage).

Los documentos formales del proyecto (entregas, cronograma, material de la URL) están en
[`documentos/`](documentos/README.md), con un índice de dónde está cada uno.

## Requisitos

- Node.js 24 (LTS). Con nvm: `nvm use` (lee `.nvmrc`).
- npm 11 o más reciente (viene con Node 24).
- Acceso al proyecto de Supabase `la-merced-dev` y al proyecto de Vercel (pídelo al responsable del bloque 1).

## Instalación

```bash
git clone <url-del-repo> la-merced
cd la-merced
npm install
cp .env.example .env.local   # y llena los valores
npm run dev
```

La app queda en http://localhost:5173. El gestor está en http://localhost:5173/gestor.

### Variables de entorno

| Variable                 | Qué es                                                                 |
| ------------------------ | ---------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | URL del proyecto (Supabase → Project Settings → API).                  |
| `VITE_SUPABASE_ANON_KEY` | Clave **pública** (`anon` o `publishable`). Es segura en el navegador. |

- Los valores se comparten por el canal privado del equipo, nunca en el repo ni en un chat público.
- La clave `service_role` / `secret` **nunca** va en el frontend, en `.env.example` ni en el repo.
- Si falta una variable, la app falla al arrancar con un mensaje que dice cuál.

### Probar la cámara en el teléfono

`getUserMedia` exige HTTPS fuera de `localhost`. Usa la vista previa de Vercel de tu PR, o en local
corre `npm run dev:https` (certificado autofirmado de `@vitejs/plugin-basic-ssl`, solo en desarrollo) y
abre en el teléfono la dirección `Network: https://…` que imprime Vite, con el teléfono en la misma red.
El navegador avisará que el certificado no es de confianza: acéptalo para esa dirección.

## Scripts

| Script              | Qué hace                                                |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo.                                 |
| `npm run lint`      | ESLint + revisión de formato con Prettier.              |
| `npm run format`    | Formatea todo con Prettier.                             |
| `npm run typecheck` | Revisa tipos con `tsc`.                                 |
| `npm run test`      | Pruebas con Vitest.                                     |
| `npm run build`     | Compila a `dist/`.                                      |
| `npm run db:push`   | Aplica las migraciones pendientes al proyecto enlazado. |
| `npm run db:types`  | Regenera `src/lib/tipos-db.ts` desde el esquema.        |

La CI (GitHub Actions) corre `lint`, `typecheck`, `test` y `build` en cada PR y en cada push a `main`.

## Estructura

```
src/
├─ app/          router, providers, layout raíz
├─ visitante/    pantallas del visitante (bienvenida, cámara, mapa, ficha)
├─ gestor/       panel del gestor; se carga solo en /gestor
├─ componentes/  componentes compartidos (bloque de diseño)
├─ assets/santi/ SVG por capas de Santi
├─ datos/        todas las consultas a Supabase pasan por aquí
├─ lib/          cliente de Supabase, helper de Storage y tipos generados
└─ i18n/         archivos de traducción (es, cak, en)
supabase/
├─ migrations/              una migración por cambio de esquema
├─ seed.sql                 zonas, punto de prueba y contorno provisional
└─ contorno-provisional.svg se sube a Storage al poner en marcha el proyecto
```

## Convenciones

- **Ramas**: `main` siempre publicable. Cada tarea va en `feat/<tema>` o `fix/<tema>` y entra por PR
  con al menos una aprobación y la CI en verde. Nadie empuja directo a `main`.
- **Commits** en español con prefijo `feat:`, `fix:`, `chore:` o `docs:`. Ejemplo: `feat: tabla de fichas por idioma`.
- **Nombres**: tablas y columnas en español y `snake_case`; código TypeScript en español y `camelCase`;
  componentes en `PascalCase`.
- **Acceso a datos**: ningún componente llama a Supabase directo; todo pasa por funciones de `src/datos/`
  (ESLint lo impide fuera de `src/datos/` y `src/lib/`). Así, cuando las fichas aprobadas se exporten a
  archivos estáticos, solo cambia esa carpeta.
- **Alias**: `@/` apunta a `src/`.

## Base de datos

### Esquema

| Tabla           | Para qué                                                                   |
| --------------- | -------------------------------------------------------------------------- |
| `zonas`         | Fachada principal, fachada secundaria e interior.                          |
| `puntos`        | Puntos de cada zona; `pos_x`/`pos_y` van de 0 a 1 sobre la ilustración.    |
| `fichas`        | Una por punto y por idioma; estado `borrador` → `revision` → `aprobado`.   |
| `medios`        | Fotos, audios, ilustraciones y modelos 3D guardados en el bucket `medios`. |
| `fuentes`       | Referencias reutilizables entre puntos.                                    |
| `punto_fuentes` | Relación punto–fuente con su nivel de confianza.                           |
| `perfiles`      | Un usuario del gestor y su rol (`editor`, `revisor`, `admin`).             |

### Reglas de acceso (RLS)

RLS está activo en todas las tablas. `rol_actual()` lee el rol del usuario desde `perfiles`.

| Quién              | Puede                                                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Visitante (`anon`) | Leer zonas, puntos, medios, fuentes y punto_fuentes; fichas solo `aprobado`. No escribe.                                                 |
| `editor`           | Lo anterior, leer fichas en cualquier estado y crear/editar puntos, fichas, medios y fuentes. Pasa fichas a `revision`, no a `aprobado`. |
| `revisor`          | Lo mismo que el editor, y aprueba fichas o las devuelve a `borrador`.                                                                    |
| `admin`            | Todo, incluido asignar roles en `perfiles`.                                                                                              |

Si un editor guarda cambios en una ficha aprobada, debe pasarla a `borrador` o `revision`: todo cambio
a contenido publicado vuelve a pasar por un revisor.

### Cambiar el esquema

1. Crea una migración nueva (nunca edites una ya aplicada):
   ```bash
   npx supabase migration new <descripcion_corta>
   ```
2. Escribe el SQL en el archivo creado en `supabase/migrations/`.
3. Aplícala y regenera los tipos:
   ```bash
   npm run db:push
   npm run db:types
   ```
4. Abre un PR con la migración y los tipos. Lo revisa el responsable del bloque 1, que anota en el PR
   que la aplicó. (En este sprint las migraciones no se aplican desde la CI.)

## Puesta en marcha del proyecto de Supabase (una sola vez)

1. Enlaza el repo con el proyecto (pide la contraseña de la base al responsable):
   ```bash
   npx supabase login
   npx supabase link --project-ref <id-del-proyecto>
   ```
2. Aplica migraciones y semilla:
   ```bash
   npx supabase db push --include-seed
   npm run db:types
   ```
3. Sube el contorno provisional al bucket:
   ```bash
   npx supabase storage cp --experimental \
     supabase/contorno-provisional.svg \
     ss:///medios/ilustraciones/fachada-principal-contorno-provisional.svg
   ```
4. En el panel de Supabase → Authentication → Sign In / Providers, **desactiva "Allow new users to sign up"**.
   Los usuarios del gestor se invitan desde Authentication → Users → Invite.
5. Al primer admin se le asigna el rol desde el SQL Editor:
   ```sql
   update public.perfiles set rol = 'admin' where id = (select id from auth.users where email = '<correo>');
   ```
   Después, el admin asigna los demás roles (cada usuario invitado empieza sin rol, es decir, sin permisos).

El plan gratuito pausa el proyecto tras una semana sin actividad: si pasa, se reactiva desde el panel.

## Despliegue

- **Vercel** está conectado al repo: `main` va a producción y cada PR genera una vista previa con HTTPS.
- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` están cargadas en Production y Preview.
- `vercel.json` reescribe todas las rutas a `/index.html`, para que recargar `/gestor` no dé 404.
