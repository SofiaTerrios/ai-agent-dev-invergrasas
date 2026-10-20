-- DropForeignKey
ALTER TABLE "clientes" DROP CONSTRAINT "clientes_empresa_id_fkey";

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_cliente_id_fkey";

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_creado_por_fkey";

-- DropForeignKey
ALTER TABLE "pedidos" DROP CONSTRAINT "pedidos_empresa_id_fkey";

-- AlterTable
ALTER TABLE "certificados_analisis" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "empresas" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "parametros_analisis" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "pedidos" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "user_empresas" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
