-- Reversa manual de 20261027000000_datos_maestros (Prisma no ejecuta este
-- archivo). Devuelve clientes a nombre/contacto/telefono/correo tomando la
-- sede principal y el contacto más antiguo; se pierden NIT, sedes extra,
-- contactos extra, catálogos y vehículos. Después de correrlo:
--   DELETE FROM "_prisma_migrations" WHERE migration_name = '20261027000000_datos_maestros';

BEGIN;

ALTER TABLE "clientes"
ADD COLUMN "contacto" TEXT NOT NULL DEFAULT '',
ADD COLUMN "telefono" TEXT NOT NULL DEFAULT '',
ADD COLUMN "correo" TEXT NOT NULL DEFAULT '';

UPDATE "clientes" c SET
  "telefono" = COALESCE(s."telefono", ''),
  "correo" = COALESCE(s."email", '')
FROM "sedes" s
WHERE s."cliente_id" = c."id" AND s."principal";

UPDATE "clientes" c SET "contacto" = k."nombre"
FROM (
  SELECT DISTINCT ON ("cliente_id") "cliente_id", "nombre"
  FROM "contactos" ORDER BY "cliente_id", "created_at"
) k
WHERE k."cliente_id" = c."id";

ALTER TABLE "clientes" ALTER COLUMN "contacto" DROP DEFAULT,
ALTER COLUMN "telefono" DROP DEFAULT,
ALTER COLUMN "correo" DROP DEFAULT;

ALTER TABLE "users" DROP CONSTRAINT "users_vehiculo_por_defecto_id_fkey",
DROP COLUMN "vehiculo_por_defecto_id";

DROP TABLE "vehiculos", "productos_empaques", "tipos_empaque", "productos",
  "contactos", "sedes", "actividades_economicas";

ALTER TABLE "clientes" DROP CONSTRAINT "clientes_ciudad_id_fkey";
DROP INDEX "clientes_empresa_id_nit_key";
ALTER TABLE "clientes" DROP COLUMN "ciudad_id",
DROP COLUMN "dv",
DROP COLUMN "nit",
DROP COLUMN "registro",
DROP COLUMN "tipos",
DROP COLUMN "updated_at";
ALTER TABLE "clientes" RENAME COLUMN "razon_social" TO "nombre";

DROP TABLE "ciudades";
DROP TYPE "TipoEmpresa";

COMMIT;
