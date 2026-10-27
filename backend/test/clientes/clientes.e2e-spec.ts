import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  ciudad,
  createE2EApp,
  createEmpresa,
  createUser,
  gql,
} from '../utils/e2e';

const CLIENTE_FIELDS = `
  id razon_social nit dv registro tipos datos_incompletos
  ciudad { nombre departamento }
  sedes { id nombre direccion principal activa ciudad { nombre } actividad_economica { nombre } }
  contactos { id nombre cargo sede_id }
`;
const CREATE = `mutation($input: CreateClienteInput!) { createCliente(input: $input) { ${CLIENTE_FIELDS} } }`;
const UPDATE = `mutation($id: ID!, $input: UpdateClienteInput!) { updateCliente(id: $id, input: $input) { ${CLIENTE_FIELDS} } }`;
const DELETE = `mutation($id: ID!) { deleteCliente(id: $id) { message } }`;
const GET = `query($id: ID!) { cliente(id: $id) { ${CLIENTE_FIELDS} } }`;
const LIST = `
  query($search: String, $tipo: TipoEmpresa) {
    clientes(search: $search, tipo: $tipo) { totalCount edges { node { id razon_social } } }
  }
`;
const CREATE_SEDE = `mutation($input: CreateSedeInput!) { createSede(input: $input) { id principal } }`;
const UPDATE_SEDE = `mutation($id: ID!, $input: UpdateSedeInput!) { updateSede(id: $id, input: $input) { id principal direccion } }`;
const DELETE_SEDE = `mutation($id: ID!) { deleteSede(id: $id) { message } }`;
const CREATE_CONTACTO = `mutation($input: CreateContactoInput!) { createContacto(input: $input) { id nombre cargo } }`;
const CONTACTOS = `
  query($clienteId: ID!, $sedeId: ID, $search: String) {
    contactos(clienteId: $clienteId, sedeId: $sedeId, search: $search) { id nombre }
  }
`;

type Sede = {
  id: string;
  nombre: string;
  direccion: string;
  principal: boolean;
  activa: boolean;
};
type Cliente = {
  id: string;
  razon_social: string;
  nit: string;
  dv: string;
  tipos: string[];
  datos_incompletos: boolean;
  ciudad: { nombre: string; departamento: string };
  sedes: (Sede & { actividad_economica: { nombre: string } | null })[];
  contactos: { id: string; nombre: string; cargo: string; sede_id: string }[];
};

describe('Clientes E2E - empresa cliente, sedes y contactos', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let empresaId: string;
  let otraEmpresaId: string;
  let comercialToken: string;
  let calidadToken: string;
  let entregaToken: string;
  let otraToken: string;
  let bogotaId: string;
  let soachaId: string;
  let panaderiaId: string;

  const input = (overrides: Record<string, unknown> = {}) => ({
    empresa_id: empresaId,
    razon_social: 'Panadería La Espiga',
    nit: '901.684.306-1',
    ciudad_id: bogotaId,
    tipos: ['GENERADOR'],
    sede_principal: {
      nombre: 'Espiga Calle 109',
      direccion: 'Calle 109 # 15-20',
      ciudad_id: bogotaId,
      actividad_economica_id: panaderiaId,
      localidad: 'Usaquén',
    },
    ...overrides,
  });

  const crear = async (overrides: Record<string, unknown> = {}) => {
    const res = await gql<{ createCliente: Cliente }>(
      app,
      comercialToken,
      CREATE,
      { input: input(overrides) },
    );
    expect(res.errors).toBeUndefined();
    return res.data.createCliente;
  };

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    empresaId = (await createEmpresa(prisma)).id;
    otraEmpresaId = (await createEmpresa(prisma)).id;
    comercialToken = (await createUser(prisma, 'comercial', [empresaId])).token;
    calidadToken = (await createUser(prisma, 'calidad', [empresaId])).token;
    entregaToken = (await createUser(prisma, 'entrega', [empresaId])).token;
    otraToken = (await createUser(prisma, 'comercial', [otraEmpresaId])).token;
    bogotaId = (await ciudad(prisma, '11001')).id;
    soachaId = (await ciudad(prisma, '25754')).id;
    panaderiaId = (
      await prisma.actividadEconomica.findUniqueOrThrow({
        where: { nombre: 'Panadería' },
      })
    ).id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('crear', () => {
    let cliente: Cliente;

    beforeAll(async () => {
      cliente = await crear();
    });

    it('creates the cliente with its principal sede in one step', () => {
      expect(cliente).toMatchObject({
        razon_social: 'Panadería La Espiga',
        nit: '901684306',
        dv: '1',
        tipos: ['GENERADOR'],
        datos_incompletos: false,
        ciudad: { nombre: 'Bogotá, D.C.' },
      });
      expect(cliente.sedes).toEqual([
        expect.objectContaining({
          nombre: 'Espiga Calle 109',
          principal: true,
          activa: true,
          actividad_economica: { nombre: 'Panadería' },
        }),
      ]);
    });

    it('does not allow two clientes with the same NIT in the empresa', async () => {
      const res = await gql(app, comercialToken, CREATE, {
        input: input({ razon_social: 'Otra', nit: '901684306' }),
      });
      expect(res.errors?.[0]?.message).toMatch(/Ya existe un cliente/);
    });

    it('allows the same NIT in another empresa', async () => {
      const res = await gql(app, otraToken, CREATE, {
        input: input({ empresa_id: otraEmpresaId }),
      });
      expect(res.errors).toBeUndefined();
    });

    it('validates the DV', async () => {
      const res = await gql(app, comercialToken, CREATE, {
        input: input({ nit: '900123456-1' }),
      });
      expect(res.errors?.[0]?.message).toMatch(/dígito de verificación/);
    });

    it('only lets admin and comercial create', async () => {
      const res = await gql(app, calidadToken, CREATE, {
        input: input({ nit: '800197268' }),
      });
      expect(res.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    });
  });

  describe('buscar y editar', () => {
    let id: string;

    beforeAll(async () => {
      id = (
        await crear({
          razon_social: 'Transportes Andinos SAS',
          nit: '800197268-4',
          tipos: ['TRANSPORTADOR', 'DESTINO'],
        })
      ).id;
    });

    it('finds clientes by part of the name or the NIT', async () => {
      type List = {
        clientes: { edges: { node: { razon_social: string } }[] };
      };
      const nombres = async (variables: Record<string, string>) =>
        (
          await gql<List>(app, calidadToken, LIST, variables)
        ).data.clientes.edges.map((e) => e.node.razon_social);

      expect(await nombres({ search: 'andinos' })).toEqual([
        'Transportes Andinos SAS',
      ]);
      expect(await nombres({ search: '800.197' })).toEqual([
        'Transportes Andinos SAS',
      ]);
      expect(await nombres({ tipo: 'DESTINO' })).toEqual([
        'Transportes Andinos SAS',
      ]);
    });

    it('updates the datos', async () => {
      const res = await gql<{ updateCliente: Cliente }>(
        app,
        comercialToken,
        UPDATE,
        {
          id,
          input: { ciudad_id: soachaId, tipos: ['TRANSPORTADOR'] },
        },
      );
      expect(res.data.updateCliente).toMatchObject({
        tipos: ['TRANSPORTADOR'],
        ciudad: { nombre: 'Soacha', departamento: 'Cundinamarca' },
      });
    });

    it('hides clientes of other empresas', async () => {
      const res = await gql(app, otraToken, GET, { id });
      expect(res.errors?.[0]?.message).toBe('Cliente no encontrado');

      const list = await gql<{ clientes: { totalCount: number } }>(
        app,
        otraToken,
        LIST,
        { search: 'andinos' },
      );
      expect(list.data.clientes.totalCount).toBe(0);
    });

    it('soft deletes', async () => {
      await gql(app, comercialToken, DELETE, { id });
      const row = await prisma.cliente.findUniqueOrThrow({
        where: { id, deleted_at: undefined },
      });
      expect(row.deleted_at).not.toBeNull();
    });
  });

  describe('sedes', () => {
    let cliente: Cliente;
    let principalId: string;
    let segundaId: string;

    beforeAll(async () => {
      cliente = await crear({ razon_social: 'Hotel Sol', nit: '860034313' });
      principalId = cliente.sedes[0].id;
      const sede = await gql<{
        createSede: { id: string; principal: boolean };
      }>(app, comercialToken, CREATE_SEDE, {
        input: {
          cliente_id: cliente.id,
          nombre: 'Hotel Sol Norte',
          direccion: 'Av 19 # 100',
          ciudad_id: bogotaId,
        },
      });
      expect(sede.data.createSede.principal).toBe(false);
      segundaId = sede.data.createSede.id;
    });

    it('keeps exactly one principal sede', async () => {
      const denied = await gql(app, comercialToken, UPDATE_SEDE, {
        id: principalId,
        input: { principal: false },
      });
      expect(denied.errors?.[0]?.message).toMatch(/siempre debe haber una/);

      await gql(app, comercialToken, UPDATE_SEDE, {
        id: segundaId,
        input: { principal: true },
      });
      const res = await gql<{ cliente: Cliente }>(app, comercialToken, GET, {
        id: cliente.id,
      });
      expect(
        res.data.cliente.sedes.map((s) => [s.nombre, s.principal]),
      ).toEqual([
        ['Hotel Sol Norte', true],
        ['Espiga Calle 109', false],
      ]);
    });

    it('does not deactivate the principal sede, but does the others', async () => {
      const denied = await gql(app, comercialToken, DELETE_SEDE, {
        id: segundaId,
      });
      expect(denied.errors?.[0]?.message).toMatch(/sede principal/);

      const ok = await gql(app, comercialToken, DELETE_SEDE, {
        id: principalId,
      });
      expect(ok.errors).toBeUndefined();
      const res = await gql<{ cliente: Cliente }>(app, comercialToken, GET, {
        id: cliente.id,
      });
      expect(res.data.cliente.sedes.map((s) => s.id)).toEqual([segundaId]);
    });
  });

  describe('contactos', () => {
    let cliente: Cliente;

    beforeAll(async () => {
      cliente = await crear({ razon_social: 'Casino Real', nit: '890900608' });
    });

    it('lets entrega create contactos (quick create), not calidad', async () => {
      const ok = await gql<{ createContacto: { cargo: string } }>(
        app,
        entregaToken,
        CREATE_CONTACTO,
        {
          input: {
            cliente_id: cliente.id,
            sede_id: cliente.sedes[0].id,
            nombre: 'Adolfo García',
            cargo: 'Jefe de Producción',
          },
        },
      );
      expect(ok.data.createContacto.cargo).toBe('Jefe de Producción');

      const denied = await gql(app, calidadToken, CREATE_CONTACTO, {
        input: { cliente_id: cliente.id, nombre: 'X' },
      });
      expect(denied.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');
    });

    it('rejects a sede of another cliente', async () => {
      const otro = await crear({ razon_social: 'Otro', nit: '899999063' });
      const res = await gql(app, comercialToken, CREATE_CONTACTO, {
        input: {
          cliente_id: cliente.id,
          sede_id: otro.sedes[0].id,
          nombre: 'X',
        },
      });
      expect(res.errors?.[0]?.message).toBe('La sede no pertenece al cliente');
    });

    it('lists the contactos of the sede first, never those of other clientes', async () => {
      await gql(app, comercialToken, CREATE_CONTACTO, {
        input: { cliente_id: cliente.id, nombre: 'Ana Compras' },
      });
      const res = await gql<{ contactos: { nombre: string }[] }>(
        app,
        comercialToken,
        CONTACTOS,
        { clienteId: cliente.id, sedeId: cliente.sedes[0].id },
      );
      expect(res.data.contactos.map((c) => c.nombre)).toEqual([
        'Adolfo García',
        'Ana Compras',
      ]);

      const otra = await gql(app, otraToken, CONTACTOS, {
        clienteId: cliente.id,
      });
      expect(otra.errors?.[0]?.message).toBe('Cliente no encontrado');
    });
  });

  it('marks migrated clientes without NIT as datos_incompletos', async () => {
    const legacy = await prisma.cliente.create({
      data: {
        razon_social: 'Cliente Migrado',
        empresa_id: empresaId,
        sedes: { create: { nombre: 'Principal', principal: true } },
      },
    });
    const res = await gql<{ cliente: Cliente }>(app, comercialToken, GET, {
      id: legacy.id,
    });
    expect(res.data.cliente).toMatchObject({
      nit: null,
      datos_incompletos: true,
    });
  });
});
