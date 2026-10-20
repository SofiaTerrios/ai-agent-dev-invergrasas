-- AlterTable
ALTER TABLE "certificados_analisis" ADD COLUMN     "cliente_id" TEXT,
ADD COLUMN     "empresa_id" TEXT;

-- CreateIndex
CREATE INDEX "certificados_analisis_empresa_id_idx" ON "certificados_analisis"("empresa_id");

-- CreateIndex
CREATE INDEX "certificados_analisis_cliente_id_idx" ON "certificados_analisis"("cliente_id");

-- AddForeignKey
ALTER TABLE "certificados_analisis" ADD CONSTRAINT "certificados_analisis_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados_analisis" ADD CONSTRAINT "certificados_analisis_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill: certificados only stored the customer name as free text.
-- Link them to the cliente (and its empresa) when the name matches exactly one
-- active cliente. Rows that stay NULL are only visible to admins.
WITH matches AS (
    SELECT ca.id AS certificado_id,
           MIN(c.id) AS cliente_id,
           MIN(c.empresa_id) AS empresa_id
    FROM "certificados_analisis" ca
    JOIN "clientes" c
      ON LOWER(TRIM(c.nombre)) = LOWER(TRIM(ca.empresa_cliente))
     AND c.deleted_at IS NULL
    WHERE ca.empresa_id IS NULL
    GROUP BY ca.id
    HAVING COUNT(*) = 1
)
UPDATE "certificados_analisis" ca
SET cliente_id = m.cliente_id,
    empresa_id = m.empresa_id
FROM matches m
WHERE ca.id = m.certificado_id;

-- Single-tenant installs: if there is only one empresa, every remaining
-- certificado belongs to it.
UPDATE "certificados_analisis"
SET empresa_id = (SELECT id FROM "empresas" WHERE deleted_at IS NULL LIMIT 1)
WHERE empresa_id IS NULL
  AND (SELECT COUNT(*) FROM "empresas" WHERE deleted_at IS NULL) = 1;
