-- Reversa manual de 20261028000000_movimientos (Prisma no ejecuta este
-- archivo). Recrea la tabla pedidos con los movimientos que vinieron de
-- pedidos (origen_pedido_id). Los movimientos creados después del deploy,
-- el inventario y las secuencias se pierden. Después de correrlo:
--   DELETE FROM "_prisma_migrations" WHERE migration_name = '20261028000000_movimientos';

BEGIN;

CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "creado_por" TEXT NOT NULL,
    "producto" TEXT NOT NULL,
    "tipo_empaque" TEXT NOT NULL,
    "cantidad_kg" DECIMAL(10,2) NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),
    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "pedidos_empresa_id_idx" ON "pedidos"("empresa_id");
CREATE INDEX "pedidos_cliente_id_idx" ON "pedidos"("cliente_id");
CREATE INDEX "pedidos_creado_por_idx" ON "pedidos"("creado_por");

INSERT INTO "pedidos" (
  "id", "empresa_id", "cliente_id", "creado_por", "producto", "tipo_empaque",
  "cantidad_kg", "fecha", "created_at", "deleted_at"
)
SELECT m."origen_pedido_id", m."empresa_id", m."cliente_id", m."creado_por",
  CASE pr."nombre"
    WHEN 'Aceite de palma RBD' THEN 'RBD'
    WHEN 'Oleína de palma' THEN 'Oleina'
    ELSE pr."nombre" END,
  e."nombre", l."cantidad", m."fecha", m."created_at", m."deleted_at"
FROM "movimientos" m
JOIN "movimiento_lineas" l ON l."movimiento_id" = m."id" AND l."orden" = 1
JOIN "productos" pr ON pr."id" = l."producto_id"
JOIN "tipos_empaque" e ON e."id" = l."tipo_empaque_id"
WHERE m."origen_pedido_id" IS NOT NULL;

ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TABLE "inventario_envases", "movimiento_lineas", "secuencias_movimiento", "movimientos";
DROP TYPE "TipoMovimiento";

COMMIT;
