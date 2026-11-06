---
paths:
  - 'src/datos/**'
  - 'src/lib/**'
  - 'supabase/**'
  - '.env.example'
  - 'vercel.json'
  - '.github/**'
---

# Seguridad y datos

## Secretos

- No leas, imprimas ni resumas `.env*` (salvo `.env.example`, que sirve para conocer nombres de variables). `.claude/settings.json` lo deniega, pero **esa regla no cubre todas las vías**: no sustituye tu criterio. Por ejemplo, no protege contra un script que lea el archivo por su cuenta ni contra un comando que lo abra sin nombrarlo.
- Variables del frontend: solo `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (públicas). La clave `service_role` o `secret` nunca va en el frontend, en `.env.example` ni en el repo.
- No ejecutes comandos que revelen variables de entorno. Si detectas un posible secreto expuesto, informa ubicación y tipo de riesgo, sin reproducirlo.

## Base de datos (`supabase/`, `README.md` sección Base de datos)

- Una migración nueva por cambio; nunca edites una ya aplicada. Nombres en español `snake_case`. Todo cambio de esquema, migración o política RLS **requiere aprobación humana** antes de escribirse.
- No ejecutes `db:push`, `supabase …` ni nada contra el proyecto remoto. El responsable del bloque 1 aplica las migraciones y lo anota en el PR.
- RLS activo en toda tabla. Regla de contenido: el visitante solo ve fichas `aprobado`; todo cambio a una ficha publicada vuelve a revisión. No debilites estas políticas.
- `npm run db:types` consulta el proyecto enlazado: pide aprobación antes.
- **Doble autorización (decisión E, aprobada; ver `docs/ia/DECISIONES.md`).** Preparar una migración y aplicarla son acciones independientes. La aprobación de un cambio de esquema autoriza, como mucho, escribir el archivo; no autoriza ejecutarlo en ningún entorno (local, dev ni producción). Aplicarla requiere una instrucción humana explícita aparte, y quien la da es el responsable que aplica las migraciones.

## Contenido patrimonial

No inventes fichas, fechas, fuentes ni niveles de confianza (`documentado`, `probable`, `especulativo`). Los datos de prueba del `seed.sql` están marcados como de prueba; no los hagas pasar por contenido real.

## Despliegue y CI

`vercel.json` y `.github/workflows/ci.yml` se cambian solo con aprobación. No despliegues.
