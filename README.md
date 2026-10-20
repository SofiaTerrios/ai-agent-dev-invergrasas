# Invergrasas

Sitio público y plataforma interna de operaciones de Invergrasas, productora de oleína de palma, RBD y aceites refinados. Incluye:

- **Landing pública:** presentación de la empresa y sus productos.
- **Dashboard interno:** empresas, clientes, pedidos/entregas y generación de certificados de análisis en PDF, con roles (admin, comercial, calidad, empleado) y datos separados por empresa.

Seguimiento de tareas en Jira (proyecto **IG**). Estado y próximos pasos en `docs/ROADMAP.md` y `NEXT_TASK.md`.

## Estructura

```
frontend/   Next.js 16 (landing + /dashboard)
backend/    NestJS 11 + GraphQL + Prisma/PostgreSQL (API en /graphql y /api/*)
docs/       ARCHITECTURE, ROADMAP, DEPLOY y ADRs
memory/     contexto del proyecto, progreso y decisiones
tasks/      tareas del repositorio (estado en memory/progress.md)
agents/, factory/, templates/, specs/   flujo de trabajo con agentes de IA (ver docs/AGENTS.md)
render.yaml, render.staging.yaml        despliegue (docs/DEPLOY.md)
```

## Desarrollo local

Requisitos: Node.js 22 y PostgreSQL 16 (o Docker).

```bash
# 1. Base de datos (o usa un PostgreSQL propio)
cp backend/.env.example backend/.env   # ajusta DATABASE_URL, JWT_SECRET, etc.
docker compose --env-file backend/.env up -d

# 2. Backend: http://localhost:4000 (GraphQL en /graphql)
cd backend
npm ci
npx prisma migrate deploy
npm run start:dev

# 3. Frontend: http://localhost:3000
cd ../frontend
npm ci
NEXT_PUBLIC_API_URL=http://localhost:4000 npm run dev
```

Primer admin: regístrate en `/register` y ejecuta en la BD:

```sql
UPDATE users SET rol = 'admin' WHERE email = '...';
```

Desde ahí, ese admin asigna roles con la mutation `updateUserRol`.

## Calidad

```bash
# Backend
cd backend
npx eslint "{src,test}/**/*.ts"
npx tsc --noEmit
npm test                         # unitarios
npm run test:e2e -- --runInBand  # e2e: requiere DATABASE_URL a una BD desechable

# Frontend
cd frontend
npm run lint
npx tsc --noEmit
npm run build
```

CI (`.github/workflows/ci.yml`) corre todo lo anterior en cada PR y en cada push a `main`.

## Documentación

- `docs/ARCHITECTURE.md`: stack, módulos y reglas transversales (auth, roles, multi-tenancy, borrado lógico, paginación).
- `docs/ROADMAP.md`: fases y estado.
- `docs/DEPLOY.md`: despliegue en Render, ambientes, variables y dominio.
- `memory/decisions.md`: decisiones de arquitectura.
- `memory/progress.md`: estado de tareas (repositorio y Jira).
