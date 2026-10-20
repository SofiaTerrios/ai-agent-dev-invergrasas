import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  createCliente,
  createE2EApp,
  createEmpresa,
  createUser,
  gql,
} from '../utils/e2e';

const UPDATE = `
  mutation($id: ID!, $input: UpdatePedidoInput!) {
    updatePedido(id: $id, input: $input) { id cantidad_kg tipo_empaque }
  }
`;

describe('Pedidos E2E - update', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let empleadoToken: string;
  let otroToken: string;
  let adminToken: string;
  let pedidoId: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    const empresaId = (await createEmpresa(prisma)).id;
    const otraEmpresa = (await createEmpresa(prisma)).id;
    const clienteId = (await createCliente(prisma, empresaId)).id;
    const empleado = await createUser(prisma, 'empleado', [empresaId]);
    empleadoToken = empleado.token;
    otroToken = (await createUser(prisma, 'empleado', [otraEmpresa])).token;
    adminToken = (await createUser(prisma, 'admin')).token;
    pedidoId = (
      await prisma.pedido.create({
        data: {
          empresa_id: empresaId,
          cliente_id: clienteId,
          creado_por: empleado.user.id,
          producto: 'RBD',
          tipo_empaque: 'Granel',
          cantidad_kg: 100,
          fecha: new Date('2026-02-01'),
        },
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
  });

  const update = (
    token: string | null,
    id: string,
    input: Record<string, unknown>,
  ) =>
    gql<{ updatePedido: { cantidad_kg: number; tipo_empaque: string } }>(
      app,
      token,
      UPDATE,
      { id, input },
    );

  it('updates an existing pedido', async () => {
    const res = await update(empleadoToken, pedidoId, {
      cantidad_kg: 250.5,
      tipo_empaque: 'Caneca',
    });
    expect(res.data.updatePedido).toMatchObject({
      cantidad_kg: 250.5,
      tipo_empaque: 'Caneca',
    });
  });

  it('rejects invalid enum values', async () => {
    const res = await update(empleadoToken, pedidoId, {
      tipo_empaque: 'Bolsa',
    });
    expect(res.errors).toBeDefined();
  });

  it('rejects a negative cantidad_kg', async () => {
    const res = await update(empleadoToken, pedidoId, { cantidad_kg: -1 });
    expect(res.errors?.[0]?.extensions?.code).toBe('BAD_REQUEST');
  });

  it('returns NOT_FOUND for a missing pedido', async () => {
    const res = await update(
      empleadoToken,
      '00000000-0000-4000-8000-000000000000',
      {
        cantidad_kg: 1,
      },
    );
    expect(res.errors?.[0]?.message).toBe('Pedido not found');
  });

  it('requires authentication', async () => {
    const res = await update(null, pedidoId, { cantidad_kg: 1 });
    expect(res.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
  });

  it('forbids employees outside the pedido empresa', async () => {
    const res = await update(otroToken, pedidoId, { cantidad_kg: 1 });
    expect(res.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
  });

  it('lets admins update without empresa association', async () => {
    const res = await update(adminToken, pedidoId, { cantidad_kg: 300 });
    expect(res.data.updatePedido.cantidad_kg).toBe(300);
  });
});
