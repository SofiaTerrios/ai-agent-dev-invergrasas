# Invergrasas — Backend

API en NestJS 11:

- GraphQL code-first en `/graphql`;
- REST en `/api/*` (auth, empresas, pedidos y descarga de certificados) y en `/clientes`.

Usa Prisma 6 sobre PostgreSQL 16 y genera los PDF de certificados con pdfkit.

## Configuración

Copia `.env.example` a `.env`:

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión PostgreSQL (Prisma). |
| `JWT_SECRET` | Firma de tokens. Obligatoria en producción. |
| `FRONTEND_URL` | Origen permitido por CORS. |
| `CERTIFICADOS_DIR` | Carpeta de PDFs generados (por defecto `static/certificados`, ignorada por git). |
| `PAGINATION_MAX_LIMIT` | Máximo de registros por página (por defecto 100). |

## Desarrollo

```bash
npm ci
npx prisma migrate deploy   # aplica migraciones
npm run start:dev           # http://localhost:4000
npx prisma migrate dev      # crea una migración nueva tras cambiar schema.prisma
```

## Tests

```bash
npx eslint "{src,test}/**/*.ts"
npx tsc --noEmit
npm test                         # unitarios (src/**/*.spec.ts)
npm run test:e2e -- --runInBand  # e2e (test/**/*.e2e-spec.ts)
```

Los e2e levantan la app contra un PostgreSQL real y **vacían sus tablas**. Apunta `DATABASE_URL` a una base desechable con las migraciones aplicadas:

```bash
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/invergrasas_test
npx prisma migrate deploy
npm run test:e2e -- --runInBand
```

## Producción

`Dockerfile` construye la API y, al arrancar, ejecuta `prisma migrate deploy` antes de `node dist/main`. Ver `../docs/DEPLOY.md`.

Arquitectura y reglas transversales (roles, multi-tenancy, borrado lógico, paginación) en `../docs/ARCHITECTURE.md`.
