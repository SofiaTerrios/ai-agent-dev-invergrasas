# Arquitectura — Invergrasas

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TailwindCSS 4, TypeScript |
| Backend | NestJS 11, GraphQL (Apollo, code-first) + algunos endpoints REST |
| Datos | PostgreSQL 16 + Prisma 6 (migraciones en `backend/prisma/migrations`) |
| PDFs | pdfkit (certificados de análisis) |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |
| Despliegue | Docker + Render (ver `docs/DEPLOY.md`) |

```
frontend/  Next.js: landing pública y dashboard (/dashboard/*)
backend/   NestJS: API GraphQL en /graphql y REST en /api/*
  prisma/            schema.prisma y migraciones
  src/auth/          registro, login, JWT, guards y roles
  src/empresas/      empresas y asociación usuario–empresa
  src/clientes/      clientes por empresa
  src/pedidos/       pedidos / entregas
  src/certificados/  certificados de análisis y descarga de PDF
  src/common/        paginación por cursor
  src/prisma/        PrismaService + extensión de borrado lógico
  test/              e2e contra PostgreSQL real
```

## Modelo de datos

- `User` (con `rol`: `admin` | `comercial` | `calidad` | `empleado`) ↔ `Empresa` vía `UserEmpresa`.
- `Empresa` 1–N `Cliente`, `Pedido` y `CertificadoAnalisis`.
- `Pedido`: cliente, producto (`RBD` | `Oleina`), empaque (`Granel` | `Caneca` | `Balde`), `cantidad_kg` y fecha.
- `CertificadoAnalisis` 1–N `ParametroAnalisis` (acidez, humedad, índice de yodo, etc.).

## Reglas transversales

- **Autenticación:** JWT (`Authorization: Bearer`), firmado con `JWT_SECRET` (`src/auth/jwt.ts`). Los resolvers y controladores usan `JwtAuthGuard` y obtienen el usuario con `@CurrentUser()`.
- **Roles (RBAC):** `@Roles()` + `RolesGuard`. La matriz de permisos está en `src/auth/roles.ts`; un rol no permitido recibe 403 / `FORBIDDEN`. El registro público solo crea `empleado`; los roles los asigna un admin (`updateUserRol`).
- **Multi-tenancy:** el acceso a una empresa se valida con `assertEmpresaAccess` / `accessibleEmpresaIds` (`src/empresas/empresa-access.ts`). Los admin acceden a todas.
- **Borrado lógico:** todos los modelos tienen `deleted_at`. Una extensión de Prisma oculta los registros borrados en las lecturas, y nunca se borran filas de verdad.
- **Paginación:** los listados devuelven `XConnection { edges { cursor node } pageInfo { endCursor hasNextPage } totalCount }`, con `first`/`after`. El máximo por página se configura con `PAGINATION_MAX_LIMIT`.
- **PDFs:** se guardan en `CERTIFICADOS_DIR` (fuera de git) y se descargan solo con token en `GET /api/certificados/:id/pdf`.
- **Tipado:** `no-explicit-any` es error en backend y frontend.

## Frontend

- `/` landing pública; `/login`, `/register`.
- `/dashboard` resumen y pedidos recientes.
- `/dashboard/pedidos` listado, filtros, crear y editar.
- `/dashboard/certificados` asistente de generación.
- `/dashboard/empresas` y `/dashboard/clientes` (admin).
- Llamadas GraphQL con `fetch` (`src/lib/graphql.ts`); la sesión vive en `localStorage` (`src/lib/session.ts`).
- La empresa activa se recuerda por navegador (`src/lib/empresaActiva.ts`).

## Calidad

- **Backend:** ESLint, `tsc`, tests unitarios (Jest) y e2e (Nest + PostgreSQL, `npm run test:e2e`).
- **Frontend:** ESLint, `tsc` y `next build`.
- Todo corre en CI en cada PR y push a `main`.
