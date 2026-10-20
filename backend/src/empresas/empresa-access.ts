import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type Actor = { id: string; rol?: string };

// Admins can act on any empresa; everyone else only on the ones they are linked to.
export async function assertEmpresaAccess(
  prisma: PrismaService,
  actor: Actor,
  empresaId: string,
) {
  if (actor.rol === 'admin') return;
  const link = await prisma.userEmpresa.findUnique({
    where: {
      user_id_empresa_id: { user_id: actor.id, empresa_id: empresaId },
    },
  });
  if (!link) throw new ForbiddenException('Forbidden');
}

// Empresa ids the actor can read, or null when there is no restriction (admin).
export async function accessibleEmpresaIds(
  prisma: PrismaService,
  actor: Actor,
): Promise<string[] | null> {
  if (actor.rol === 'admin') return null;
  const links = await prisma.userEmpresa.findMany({
    where: { user_id: actor.id, empresa: { deleted_at: null } },
  });
  return links.map((link) => link.empresa_id);
}
