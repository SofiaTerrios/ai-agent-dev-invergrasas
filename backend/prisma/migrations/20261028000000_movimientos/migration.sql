-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTREGA', 'RECOLECCION', 'ENTREGA_Y_RECOLECCION');

-- CreateTable
CREATE TABLE "movimientos" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "fecha" DATE NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "sede_id" TEXT,
    "contacto_id" TEXT,
    "usuario_entrega_id" TEXT NOT NULL,
    "vehiculo_id" TEXT,
    "transportador_id" TEXT,
    "destino_id" TEXT,
    "observacion" TEXT,
    "snapshot" JSONB NOT NULL,
    "firma_entrega" BYTEA,
    "firma_entrega_mime" TEXT,
    "archivo_url" TEXT,
    "creado_por" TEXT NOT NULL,
    "anulado_at" TIMESTAMP(3),
    "anulado_por" TEXT,
    "motivo_anulacion" TEXT,
    "origen_pedido_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimiento_lineas" (
    "id" TEXT NOT NULL,
    "movimiento_id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "producto_id" TEXT,
    "unidad_medida" TEXT,
    "cantidad" DECIMAL(12,2),
    "tipo_empaque_id" TEXT NOT NULL,
    "cantidad_envases" INTEGER NOT NULL DEFAULT 0,
    "vacios_recibidos" INTEGER NOT NULL DEFAULT 0,
    "vacios_entregados" INTEGER NOT NULL DEFAULT 0,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "movimiento_lineas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "secuencias_movimiento" (
    "empresa_id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "ultimo" INTEGER NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "secuencias_movimiento_pkey" PRIMARY KEY ("empresa_id","anio")
);

-- CreateTable
CREATE TABLE "inventario_envases" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "tipo_empaque_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "movimiento_id" TEXT,
    "motivo" TEXT,
    "creado_por" TEXT,
    "fecha" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inventario_envases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "movimientos_origen_pedido_id_key" ON "movimientos"("origen_pedido_id");

-- CreateIndex
CREATE INDEX "movimientos_cliente_id_idx" ON "movimientos"("cliente_id");

-- CreateIndex
CREATE INDEX "movimientos_usuario_entrega_id_idx" ON "movimientos"("usuario_entrega_id");

-- CreateIndex
CREATE INDEX "movimientos_fecha_idx" ON "movimientos"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "movimientos_empresa_id_anio_numero_key" ON "movimientos"("empresa_id", "anio", "numero");

-- CreateIndex
CREATE INDEX "movimiento_lineas_movimiento_id_idx" ON "movimiento_lineas"("movimiento_id");

-- CreateIndex
CREATE INDEX "inventario_envases_cliente_id_tipo_empaque_id_idx" ON "inventario_envases"("cliente_id", "tipo_empaque_id");

-- CreateIndex
CREATE INDEX "inventario_envases_movimiento_id_idx" ON "inventario_envases"("movimiento_id");

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_sede_id_fkey" FOREIGN KEY ("sede_id") REFERENCES "sedes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_contacto_id_fkey" FOREIGN KEY ("contacto_id") REFERENCES "contactos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_usuario_entrega_id_fkey" FOREIGN KEY ("usuario_entrega_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_vehiculo_id_fkey" FOREIGN KEY ("vehiculo_id") REFERENCES "vehiculos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_transportador_id_fkey" FOREIGN KEY ("transportador_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_destino_id_fkey" FOREIGN KEY ("destino_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos" ADD CONSTRAINT "movimientos_anulado_por_fkey" FOREIGN KEY ("anulado_por") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_lineas" ADD CONSTRAINT "movimiento_lineas_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_lineas" ADD CONSTRAINT "movimiento_lineas_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_lineas" ADD CONSTRAINT "movimiento_lineas_tipo_empaque_id_fkey" FOREIGN KEY ("tipo_empaque_id") REFERENCES "tipos_empaque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_envases" ADD CONSTRAINT "inventario_envases_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_envases" ADD CONSTRAINT "inventario_envases_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_envases" ADD CONSTRAINT "inventario_envases_tipo_empaque_id_fkey" FOREIGN KEY ("tipo_empaque_id") REFERENCES "tipos_empaque"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_envases" ADD CONSTRAINT "inventario_envases_movimiento_id_fkey" FOREIGN KEY ("movimiento_id") REFERENCES "movimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_envases" ADD CONSTRAINT "inventario_envases_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ── Migrar pedidos a movimientos ENTREGA ────────────────────────────────────
-- Cada pedido pasa a un movimiento con consecutivo histórico por empresa y año
-- (orden: fecha, creación). Su línea conserva producto, empaque y kg; los
-- pedidos no registraban envases, así que no afectan el inventario.

-- Productos y empaques que usaban los pedidos y aún no estén en el catálogo
INSERT INTO "productos" ("id", "nombre")
SELECT gen_random_uuid()::text, x."nombre"
FROM (
  SELECT DISTINCT CASE "producto"
    WHEN 'RBD' THEN 'Aceite de palma RBD'
    WHEN 'Oleina' THEN 'Oleína de palma'
    ELSE "producto" END AS "nombre"
  FROM "pedidos"
) x
WHERE NOT EXISTS (SELECT 1 FROM "productos" p WHERE p."nombre" = x."nombre");

INSERT INTO "tipos_empaque" ("id", "nombre")
SELECT gen_random_uuid()::text, x."tipo_empaque"
FROM (SELECT DISTINCT "tipo_empaque" FROM "pedidos") x
WHERE NOT EXISTS (SELECT 1 FROM "tipos_empaque" e WHERE e."nombre" = x."tipo_empaque");

WITH numerados AS (
  SELECT p.*,
    EXTRACT(YEAR FROM p."fecha")::int AS "anio",
    ROW_NUMBER() OVER (
      PARTITION BY p."empresa_id", EXTRACT(YEAR FROM p."fecha")
      ORDER BY p."fecha", p."created_at", p."id"
    ) AS "numero"
  FROM "pedidos" p
)
INSERT INTO "movimientos" (
  "id", "empresa_id", "numero", "anio", "tipo", "fecha", "cliente_id", "sede_id",
  "usuario_entrega_id", "snapshot", "creado_por", "origen_pedido_id", "created_at", "deleted_at"
)
SELECT
  gen_random_uuid()::text, n."empresa_id", n."numero", n."anio", 'ENTREGA', n."fecha"::date,
  n."cliente_id", s."id", n."creado_por",
  jsonb_build_object(
    'cliente', jsonb_build_object(
      'razon_social', c."razon_social", 'nit', c."nit", 'dv', c."dv",
      'registro', c."registro", 'ciudad', cc."nombre"
    ),
    'sede', CASE WHEN s."id" IS NULL THEN NULL ELSE jsonb_build_object(
      'nombre', s."nombre", 'actividad', a."nombre", 'direccion', s."direccion",
      'telefono', s."telefono", 'barrio', s."barrio", 'localidad', s."localidad",
      'email', s."email", 'ciudad', sc."nombre"
    ) END,
    'contacto', NULL,
    'conductor', jsonb_build_object('nombre', u."nombre", 'documento', u."documento", 'cargo', NULL),
    'vehiculo', NULL,
    'transportador', NULL,
    'destino', NULL,
    'migrado_de_pedido', true
  ),
  n."creado_por", n."id", n."created_at", n."deleted_at"
FROM numerados n
JOIN "clientes" c ON c."id" = n."cliente_id"
JOIN "users" u ON u."id" = n."creado_por"
LEFT JOIN "ciudades" cc ON cc."id" = c."ciudad_id"
LEFT JOIN LATERAL (
  SELECT * FROM "sedes" s
  WHERE s."cliente_id" = n."cliente_id" AND s."principal"
  ORDER BY s."deleted_at" NULLS FIRST
  LIMIT 1
) s ON true
LEFT JOIN "actividades_economicas" a ON a."id" = s."actividad_economica_id"
LEFT JOIN "ciudades" sc ON sc."id" = s."ciudad_id";

INSERT INTO "movimiento_lineas" (
  "id", "movimiento_id", "orden", "producto_id", "unidad_medida", "cantidad", "tipo_empaque_id"
)
SELECT gen_random_uuid()::text, m."id", 1, pr."id", 'kg', p."cantidad_kg", e."id"
FROM "pedidos" p
JOIN "movimientos" m ON m."origen_pedido_id" = p."id"
JOIN "productos" pr ON pr."nombre" = CASE p."producto"
  WHEN 'RBD' THEN 'Aceite de palma RBD'
  WHEN 'Oleina' THEN 'Oleína de palma'
  ELSE p."producto" END
JOIN "tipos_empaque" e ON e."nombre" = p."tipo_empaque";

-- Los nuevos movimientos siguen la numeración de los migrados
INSERT INTO "secuencias_movimiento" ("empresa_id", "anio", "ultimo")
SELECT "empresa_id", "anio", MAX("numero") FROM "movimientos" GROUP BY "empresa_id", "anio";

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_cliente_id_fkey";

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_creado_por_fkey";

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_empresa_id_fkey";

-- DropTable
DROP TABLE "pedidos";
