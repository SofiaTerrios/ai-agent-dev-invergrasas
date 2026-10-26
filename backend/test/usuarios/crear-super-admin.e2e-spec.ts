import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { crearSuperAdmin } from '../../src/cli/crear-super-admin';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2EApp, createUser } from '../utils/e2e';

describe('CLI crear-super-admin', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const client = new PrismaClient();

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
  });

  afterAll(async () => {
    await client.$disconnect();
    await app.close();
  });

  it('requires the credentials in the environment', async () => {
    await expect(crearSuperAdmin(client, {})).rejects.toThrow(
      /SUPER_ADMIN_EMAIL/,
    );
    await expect(
      crearSuperAdmin(client, {
        SUPER_ADMIN_EMAIL: 'corta@cli.test',
        SUPER_ADMIN_PASSWORD: '123',
      }),
    ).rejects.toThrow(/8 caracteres/);
  });

  it('creates the super admin, who must change the password', async () => {
    const { user, creado } = await crearSuperAdmin(client, {
      SUPER_ADMIN_EMAIL: 'root@cli.test',
      SUPER_ADMIN_PASSWORD: 'muysecreta',
    });

    expect(creado).toBe(true);
    expect(user).toMatchObject({
      rol: 'super_admin',
      debe_cambiar_password: true,
    });
    expect(user.password).not.toBe('muysecreta');
    expect(
      await prisma.auditLog.count({ where: { entidad_id: user.id } }),
    ).toBe(1);
  });

  it('promotes and reactivates an existing user without touching the password', async () => {
    const { user: existing } = await createUser(prisma, 'admin');
    await prisma.user.update({
      where: { id: existing.id },
      data: { deleted_at: new Date() },
    });

    const { user, creado } = await crearSuperAdmin(client, {
      SUPER_ADMIN_EMAIL: existing.email,
      SUPER_ADMIN_PASSWORD: 'otra-clave',
    });

    expect(creado).toBe(false);
    expect(user).toMatchObject({
      rol: 'super_admin',
      deleted_at: null,
      password: existing.password,
    });
  });
});
