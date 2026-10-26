# Decisiones de arquitectura y producto

Registro de las decisiones relevantes y su porqué.

Formato de cada entrada: fecha, estado, contexto, decisión y consecuencias.

---

### DEC-001: Prisma como único ORM

- **Fecha:** 2026-10-20 · **Estado:** aceptada · **Jira:** IG-9
- **Contexto:** convivían TypeORM (con entidades y tests en sqlite) y Prisma; el código real usaba Prisma.
- **Decisión:** Prisma 6 + PostgreSQL es el único acceso a datos. Se eliminaron TypeORM, sqlite3 y pg.
- **Consecuencias:** las migraciones viven en `backend/prisma/migrations` y los e2e corren contra PostgreSQL real.

### DEC-002: Borrado lógico

- **Fecha:** 2026-10-20 · **Estado:** aceptada · **Jira:** IG-4
- **Decisión:** todos los modelos tienen `deleted_at`. Una extensión de Prisma filtra los borrados en las lecturas. Las FKs de negocio usan `Restrict`.
- **Consecuencias:** los datos históricos (p. ej. pedidos de un cliente borrado) se conservan. NIT y email siguen siendo únicos aunque el registro esté borrado.

### DEC-003: Multi-tenancy por empresa

- **Fecha:** 2026-10-20 · **Estado:** aceptada · **Jira:** IG-5, IG-10, IG-11
- **Decisión:** clientes, pedidos y certificados pertenecen a una empresa. Los usuarios acceden solo a sus empresas (`UserEmpresa`); los admin, a todas.
- **Consecuencias:** cada operación valida la empresa con `assertEmpresaAccess`. Los certificados antiguos que no se pudieron asociar a una empresa solo los ve el admin.

### DEC-004: Rol global por usuario

- **Fecha:** 2026-10-20 · **Estado:** aceptada (matriz a confirmar con el negocio) · **Jira:** IG-7
- **Decisión:** el rol está en `User`, no en `UserEmpresa`. Roles: `admin`, `comercial`, `calidad`, `empleado`. La matriz de permisos está centralizada en `backend/src/auth/roles.ts`.
- **Consecuencias:** el registro público solo crea empleados y los roles los asigna un admin. El rol viaja en el JWT, así que un cambio de rol aplica en el siguiente login.
- **Actualización (IG-24/25):** reemplazada en parte por DEC-008. El rol se lee de la BD en cada petición.

### DEC-005: Paginación por cursor

- **Fecha:** 2026-10-20 · **Estado:** aceptada · **Jira:** IG-6
- **Decisión:** los listados devuelven conexiones (`edges`/`pageInfo`/`totalCount`) con `first`/`after`. El orden es estable (`created_at` + `id`). El máximo por página es configurable.

### DEC-006: PDFs fuera de git y descarga autenticada

- **Fecha:** 2026-10-20 · **Estado:** aceptada · **Jira:** IG-5, IG-13
- **Decisión:** los PDFs se guardan en `CERTIFICADOS_DIR`, que en producción es un disco persistente. Solo se descargan vía `GET /api/certificados/:id/pdf` con token. `/static` ya no es público.
- **Pendiente:** decidir si se limpia el historial de git, que aún contiene PDFs con datos de clientes.

### DEC-007: Despliegue en Render con Docker

- **Fecha:** 2026-10-20 · **Estado:** propuesta · **Jira:** IG-16
- **Decisión:** API, frontend y PostgreSQL gestionado en Render, con ambientes staging (rama `staging`) y producción (`main`). Las migraciones se aplican al arrancar la API. Detalle en `docs/DEPLOY.md`.
- **Consecuencias:** las imágenes Docker son portables a otro proveedor si se decide cambiar.

### DEC-008: Super Administrador y permisos por módulo y acción

- **Fecha:** 2026-10-26 · **Estado:** aceptada (matriz a confirmar con el negocio) · **Jira:** IG-24, IG-25, IG-29
- **Contexto:** hacía falta un dueño del sistema con acceso total y un rol para los trabajadores de entrega. Los roles los gestionaba el `admin`.
- **Decisión:** nuevos roles `super_admin` y `entrega`. Los permisos se declaran por módulo y acción (`@Permiso('clientes', 'escribir')`) sobre la matriz `PERMISOS`; `super_admin` pasa siempre y no se lista. Solo el `super_admin` gestiona usuarios, roles y empresas asignadas; el `admin` pierde esa capacidad y la de crear empresas. El primer super admin se crea con `npm run super-admin` y credenciales en variables de entorno.
- **Consecuencias:** `JwtAuthGuard` consulta el usuario en cada petición (una lectura por id): desactivar o cambiar el rol aplica de inmediato. Los cambios de rol y altas/bajas de usuarios quedan en `audit_logs`. No se puede quedar el sistema sin un `super_admin` activo. `empleado` se mantiene hasta decidir su migración con IG-39. Detalle en `docs/PERMISOS.md`.
