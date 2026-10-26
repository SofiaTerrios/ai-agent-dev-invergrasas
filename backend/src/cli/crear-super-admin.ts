/**
 * Creates the first Super Administrador (IG-24), or promotes and reactivates
 * the user with that email. Credentials come from the environment, never
 * from the code:
 *
 *   SUPER_ADMIN_EMAIL=... SUPER_ADMIN_PASSWORD=... npm run super-admin
 *
 * An existing user keeps their password. A new one must change it on the
 * first login.
 */
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/hash';
import { registrarAuditoria } from '../auditoria/auditoria.service';

type Env = Record<string, string | undefined>;

export async function crearSuperAdmin(prisma: PrismaClient, env: Env) {
  const email = env.SUPER_ADMIN_EMAIL?.trim();
  const password = env.SUPER_ADMIN_PASSWORD;
  const nombre = env.SUPER_ADMIN_NOMBRE?.trim() || 'Super Administrador';
  if (!email || !password) {
    throw new Error('Define SUPER_ADMIN_EMAIL y SUPER_ADMIN_PASSWORD');
  }
  if (password.length < 8) {
    throw new Error('SUPER_ADMIN_PASSWORD debe tener al menos 8 caracteres');
  }

  // Plain client: deactivated users are found too
  const existing = await prisma.user.findUnique({ where: { email } });
  return prisma.$transaction(async (tx) => {
    const user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: { rol: 'super_admin', deleted_at: null },
        })
      : await tx.user.create({
          data: {
            nombre,
            email,
            password: await hashPassword(password),
            rol: 'super_admin',
            debe_cambiar_password: true,
          },
        });
    await registrarAuditoria(tx, {
      actorId: null,
      accion: existing ? 'usuario.promover_super_admin' : 'usuario.crear',
      entidad: 'usuario',
      entidadId: user.id,
      detalle: { rol: 'super_admin', origen: 'cli' },
    });
    return { user, creado: !existing };
  });
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const { user, creado } = await crearSuperAdmin(prisma, process.env);
    console.log(
      creado
        ? `Super Administrador creado: ${user.email}`
        : `${user.email} ahora es Super Administrador (contraseña sin cambios)`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
