-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('admin', 'comercial', 'calidad', 'empleado');

-- Convert users.rol in place. Unknown values fall back to 'empleado'.
ALTER TABLE "users" ALTER COLUMN "rol" TYPE "Rol" USING (
    CASE
        WHEN LOWER(TRIM("rol")) IN ('admin', 'comercial', 'calidad', 'empleado')
            THEN LOWER(TRIM("rol"))
        ELSE 'empleado'
    END
)::"Rol";

ALTER TABLE "users" ALTER COLUMN "rol" SET DEFAULT 'empleado';
