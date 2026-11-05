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

### DEC-009: Firmante de certificados como usuario y anulación en vez de edición

- **Fecha:** 2026-10-26 · **Estado:** aceptada (anulación a confirmar con el negocio) · **Jira:** IG-19, IG-21, IG-22
- **Contexto:** el nombre de la firmante estaba escrito en el código y las imágenes de logo y firma del repo estaban corruptas. Un certificado emitido no se podía corregir.
- **Decisión:** la firmante es un usuario con imagen de firma, elegido por el super admin (`configuracion.certificados.firmante_id`). Cada certificado guarda `firmante_id` y el nombre en `firmado_por`. El logo sale de `frontend/public/logo.jpg`. Un certificado no se edita: se anula con motivo (queda en el historial con su PDF) y se reemite uno nuevo enlazado con `reemplaza_id`. El PDF se genera antes de guardar el certificado.
- **Consecuencias:** sin firmante configurada no se generan certificados. Los subíndices (I₂, O₂) se dibujan a mano porque las fuentes estándar del PDF no los tienen.

### DEC-010: Datos maestros (clientes, sedes, contactos, catálogos)

- **Fecha:** 2026-10-27 · **Estado:** aceptada · **Jira:** IG-35, IG-36, IG-37, IG-38, IG-26, IG-40
- **Contexto:** los SDD proponían camelCase e IDs `cuid`, y `Cliente` pasaba de nombre/contacto/teléfono/correo a razón social, NIT, sedes y contactos.
- **Decisión:**
  - Se sigue la convención del schema (snake_case, `uuid`).
  - La migración conserva los clientes existentes: `nombre` pasa a `razon_social`; teléfono y correo van a una sede principal y `contacto` a un registro de contacto. Quedan con tipo `GENERADOR` y marcados «datos incompletos» (sin NIT, ciudad ni dirección) hasta completarlos. Hay un `down.sql` manual para revertirla.
  - «Desactivar» (sedes, contactos, catálogos, vehículos) es borrado lógico (`deleted_at`), como en usuarios; no se agregó una columna `activo`. Un nombre o placa borrado se restaura al volver a crearlo.
  - Las ciudades (DIVIPOLA, 1121 municipios) y los catálogos base van en la migración, así cada ambiente los tiene sin un seed aparte. Fuente: paquete npm `divipola` 1.0.3 (MIT); `datos.gov.co` no era accesible.
  - Se eliminó el endpoint REST `/clientes`: el frontend usa GraphQL y mantener los dos con el nuevo modelo duplicaba la lógica.
- **Consecuencias:** todas las operaciones de clientes respetan la empresa del usuario (antes `clientesByEmpresa` no lo validaba). La copia de los datos de sede y contacto en cada certificado de entrega, el transportador y destino por defecto y el alta rápida de contactos en el formulario se usan en la fase 4 (IG-39).

### DEC-011: Pedidos pasan a movimientos de entrega

- **Fecha:** 2026-10-27 · **Estado:** aceptada · **Jira:** IG-39, IG-27, IG-28, IG-30, IG-31, IG-32, IG-33
- **Contexto:** IG-39 reemplaza los pedidos (IG-10/11/12) por movimientos de entrega y recolección.
- **Decisión (negocio, 27-oct):**
  - `Pedido` se migra a `Movimiento` tipo ENTREGA con consecutivo histórico por empresa y año. Se retiran la tabla, la API y las pantallas de pedidos; `/dashboard/pedidos` redirige a Entregas. Hay un `down.sql` manual.
  - Recoger más envases de los que el cliente tiene en el inventario se permite, con advertencia en el formulario.
- **Consecuencias:**
  - Los pedidos migrados no tenían envases, contacto ni transportador: no afectan el inventario y su PDF se genera al pedirlo.
  - El consecutivo sale de `secuencias_movimiento` con un UPSERT atómico en la misma transacción que el movimiento, su inventario y su PDF; si algo falla no se guarda nada ni se consume el número.
  - El conductor debe tener rol entrega, estar asignado a la empresa y tener imagen de firma.
  - Anular (solo super admin) conserva número y PDF (con marca ANULADO) y saca el movimiento del inventario.
  - El texto certificador por tipo es configurable por el super admin y queda copiado en cada movimiento; el texto definitivo lo define el negocio.
