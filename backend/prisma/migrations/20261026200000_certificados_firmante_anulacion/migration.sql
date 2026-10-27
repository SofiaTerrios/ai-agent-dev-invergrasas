-- AlterTable
ALTER TABLE "certificados_analisis" ADD COLUMN     "anulado_at" TIMESTAMP(3),
ADD COLUMN     "anulado_por" TEXT,
ADD COLUMN     "emitido_por" TEXT,
ADD COLUMN     "firmante_id" TEXT,
ADD COLUMN     "motivo_anulacion" TEXT,
ADD COLUMN     "reemplaza_id" TEXT,
ALTER COLUMN "firmado_por" DROP DEFAULT;

-- CreateTable
CREATE TABLE "configuracion" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE UNIQUE INDEX "certificados_analisis_reemplaza_id_key" ON "certificados_analisis"("reemplaza_id");

-- CreateIndex
CREATE INDEX "certificados_analisis_fecha_emision_idx" ON "certificados_analisis"("fecha_emision");

-- AddForeignKey
ALTER TABLE "certificados_analisis" ADD CONSTRAINT "certificados_analisis_firmante_id_fkey" FOREIGN KEY ("firmante_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados_analisis" ADD CONSTRAINT "certificados_analisis_emitido_por_fkey" FOREIGN KEY ("emitido_por") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados_analisis" ADD CONSTRAINT "certificados_analisis_anulado_por_fkey" FOREIGN KEY ("anulado_por") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificados_analisis" ADD CONSTRAINT "certificados_analisis_reemplaza_id_fkey" FOREIGN KEY ("reemplaza_id") REFERENCES "certificados_analisis"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

