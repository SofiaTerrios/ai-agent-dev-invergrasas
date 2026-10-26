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
  src/auth/          registro, login, cambio de contraseña, JWT, guards y permisos
  src/usuarios/      gestión de usuarios (super admin)
  src/auditoria/     registro de acciones sensibles (audit_logs)
  src/cli/           comandos (crear el primer super admin)
  src/empresas/      empresas y asociación usuario–empresa
  src/clientes/      clientes por empresa
  src/pedidos/       pedidos / entregas
  src/certificados/  certificados de análisis y descarga de PDF
  src/common/        paginación por cursor
  src/prisma/        PrismaService + extensión de borrado lógico
  test/              e2e contra PostgreSQL real
```

## Modelo de datos

- `User` (con `rol`: `super_admin` | `admin` | `comercial` | `calidad` | `entrega` | `empleado`) ↔ `Empresa` vía `UserEmpresa`. Un usuario con `deleted_at` está desactivado.
- `AuditLog`: quién hizo qué acción sensible y sobre qué entidad.
- `Empresa` 1–N `Cliente`, `Pedido` y `CertificadoAnalisis`.
- `Pedido`: cliente, producto (`RBD` | `Oleina`), empaque (`Granel` | `Caneca` | `Balde`), `cantidad_kg` y fecha.
- `CertificadoAnalisis` 1–N `ParametroAnalisis` (acidez, humedad, índice de yodo, etc.). Guarda quién lo firmó (`firmante_id`, `firmado_por`) y quién lo emitió. Un certificado anulado conserva su PDF y puede tener uno que lo corrige (`reemplaza_id`).
- `Configuracion`: ajustes clave/valor del sistema (p. ej. `certificados.firmante_id`).

## Reglas transversales

- **Autenticación:** JWT (`Authorization: Bearer`), firmado con `JWT_SECRET` (`src/auth/jwt.ts`). Los resolvers y controladores usan `JwtAuthGuard` y obtienen el usuario con `@CurrentUser()`. El guard lee el usuario en la BD en cada petición: un usuario desactivado pierde el acceso y un cambio de rol aplica sin volver a iniciar sesión.
- **Permisos:** `@Permiso('modulo', 'accion')` + `RolesGuard`. La matriz está en `src/auth/roles.ts` (`PERMISOS`, `puede()`) y documentada en `docs/PERMISOS.md`; `super_admin` pasa siempre. Un rol no permitido recibe 403 / `FORBIDDEN`. El registro público solo crea `empleado`; los roles los asigna el super admin.
- **Multi-tenancy:** el acceso a una empresa se valida con `assertEmpresaAccess` / `accessibleEmpresaIds` (`src/empresas/empresa-access.ts`). Los roles con `empresas · accesoTotal` (y `super_admin`) acceden a todas.
- **Auditoría:** las acciones sensibles se guardan en `audit_logs` con `AuditoriaService`, dentro de la misma transacción que el cambio.
- **Borrado lógico:** todos los modelos tienen `deleted_at`. Una extensión de Prisma oculta los registros borrados en las lecturas, y nunca se borran filas de verdad.
- **Paginación:** los listados devuelven `XConnection { edges { cursor node } pageInfo { endCursor hasNextPage } totalCount }`, con `first`/`after`. El máximo por página se configura con `PAGINATION_MAX_LIMIT`.
- **PDFs:** se guardan en `CERTIFICADOS_DIR` (fuera de git) y se descargan solo con token en `GET /api/certificados/:id/pdf`. El logo está en `src/utils/pdf/assets/` y `nest-cli.json` lo copia a `dist/`; la firma sale del usuario firmante. Si falta alguno, no se guarda nada.
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
