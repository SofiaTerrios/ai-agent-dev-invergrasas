import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createE2EApp, gql, tokenFor } from '../utils/e2e';

describe('Clientes E2E - Delete (soft delete)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let empresaId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());

    const user = await prisma.user.create({
      data: {
        nombre: 'Admin',
        email: 'admin-delete@test.com',
        password: 'x',
        rol: 'admin',
      },
    });
    token = tokenFor(user);
    const empresa = await prisma.empresa.create({
      data: { razon_social: 'Empresa Delete', nit: 'DEL-1' },
    });
    empresaId = empresa.id;
    await prisma.userEmpresa.create({
      data: { user_id: user.id, empresa_id: empresa.id },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  const createCliente = (nombre: string) =>
    prisma.cliente.create({
      data: {
        nombre,
        contacto: 'Contacto',
        telefono: '123',
        correo: `${nombre.toLowerCase()}@test.com`,
        empresa_id: empresaId,
      },
    });

  it('keeps the row with deleted_at and hides it from listings', async () => {
    const cliente = await createCliente('Borrable');

    await request(app.getHttpServer())
      .delete(`/clientes/${cliente.id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const row = await prisma.cliente.findUnique({
      where: { id: cliente.id, deleted_at: undefined },
    });
    expect(row).not.toBeNull();
    expect(row!.deleted_at).toBeInstanceOf(Date);

    const res = await gql<{ clientesByEmpresa: unknown }>(
      app,
      token,
      `query($empresaId: ID!) { clientesByEmpresa(empresaId: $empresaId) { edges { node { id } } totalCount } }`,
      { empresaId },
    );
    expect(res.errors).toBeUndefined();
    expect(res.data.clientesByEmpresa).toEqual({
      edges: [],
      totalCount: 0,
    });
  });

  it('returns 404 when deleting an already deleted cliente', async () => {
    const cliente = await createCliente('DosVeces');
    const del = () =>
      request(app.getHttpServer())
        .delete(`/clientes/${cliente.id}`)
        .set('Authorization', `Bearer ${token}`);

    await del().expect(204);
    await del().expect(404);
  });

  it('does not hard delete pedidos of a deleted cliente', async () => {
    const cliente = await createCliente('ConPedidos');
    const user = await prisma.user.findFirstOrThrow();
    await prisma.pedido.create({
      data: {
        empresa_id: empresaId,
        cliente_id: cliente.id,
        creado_por: user.id,
        producto: 'RBD',
        tipo_empaque: 'Granel',
        cantidad_kg: 10,
        fecha: new Date(),
      },
    });

    await gql(
      app,
      token,
      `mutation($id: ID!) { deleteCliente(id: $id) { message } }`,
      {
        id: cliente.id,
      },
    );

    expect(
      await prisma.pedido.count({ where: { cliente_id: cliente.id } }),
    ).toBe(1);
  });

  it('returns 401 when unauthenticated', async () => {
    const cliente = await createCliente('SinToken');
    await request(app.getHttpServer())
      .delete(`/clientes/${cliente.id}`)
      .expect(401);
  });
});
