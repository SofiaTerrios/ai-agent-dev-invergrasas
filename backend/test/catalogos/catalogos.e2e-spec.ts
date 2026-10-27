import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  createE2EApp,
  createEmpresa,
  createCliente,
  createUser,
  gql,
} from '../utils/e2e';

const CIUDADES = `query($search: String) { ciudades(search: $search, first: 5) { codigo_dane nombre departamento } }`;
const ACTIVIDADES = `query { actividadesEconomicas { id nombre } }`;
const CREATE_ACTIVIDAD = `mutation($nombre: String!) { createActividadEconomica(nombre: $nombre) { id nombre } }`;
const DELETE_ACTIVIDAD = `mutation($id: ID!) { deleteActividadEconomica(id: $id) { message } }`;
const PRODUCTOS = `query { productos { id nombre empaques { nombre retornable } } }`;
const EMPAQUES = `query { tiposEmpaque { id nombre retornable } }`;
const CREATE_EMPAQUE = `mutation($input: TipoEmpaqueInput!) { createTipoEmpaque(input: $input) { id nombre capacidad retornable } }`;
const SET_EMPAQUES = `mutation($productoId: ID!, $ids: [ID!]!) { setEmpaquesProducto(productoId: $productoId, tipoEmpaqueIds: $ids) { empaques { nombre } } }`;
const VEHICULOS = `query { vehiculos { placa transportador { razon_social } } }`;
const CREATE_VEHICULO = `mutation($input: CreateVehiculoInput!) { createVehiculo(input: $input) { id placa } }`;
const DEFAULT = `mutation($userId: ID!, $vehiculoId: ID) { asignarVehiculoPorDefecto(userId: $userId, vehiculoId: $vehiculoId) { placa } }`;

type Producto = { id: string; nombre: string; empaques: { nombre: string }[] };

describe('Catálogos y vehículos E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let superToken: string;
  let adminToken: string;
  let entregaToken: string;
  let entregaId: string;
  let empresaId: string;

  // Catalogs keep the migration data between suites: undo this suite's changes
  const limpiarCatalogos = async () => {
    await prisma.productoEmpaque.deleteMany({
      where: { tipo_empaque: { nombre: 'Balde' } },
    });
    await prisma.tipoEmpaque.deleteMany({ where: { nombre: 'Balde' } });
    await prisma.actividadEconomica.deleteMany({
      where: { nombre: 'Colegio' },
    });
  };

  beforeAll(async () => {
    ({ app, prisma } = await createE2EApp());
    await limpiarCatalogos();
    empresaId = (await createEmpresa(prisma)).id;
    superToken = (await createUser(prisma, 'super_admin')).token;
    adminToken = (await createUser(prisma, 'admin')).token;
    const entrega = await createUser(prisma, 'entrega', [empresaId]);
    entregaToken = entrega.token;
    entregaId = entrega.user.id;
  });

  afterAll(async () => {
    await limpiarCatalogos();
    await app.close();
  });

  describe('ciudades (DIVIPOLA)', () => {
    type Res = { ciudades: { nombre: string; departamento: string }[] };

    it('loads every municipio of Colombia', async () => {
      expect(await prisma.ciudad.count()).toBe(1121);
    });

    it('finds Soacha with "soa" and Bogotá without the accent', async () => {
      const soa = await gql<Res>(app, entregaToken, CIUDADES, {
        search: 'soa',
      });
      expect(soa.data.ciudades[0]).toEqual({
        codigo_dane: '25754',
        nombre: 'Soacha',
        departamento: 'Cundinamarca',
      });

      const bogota = await gql<Res>(app, entregaToken, CIUDADES, {
        search: 'BOGOTA',
      });
      expect(bogota.data.ciudades[0].nombre).toBe('Bogotá, D.C.');
    });
  });

  describe('actividades económicas', () => {
    it('come with the base list', async () => {
      const res = await gql<{ actividadesEconomicas: { nombre: string }[] }>(
        app,
        entregaToken,
        ACTIVIDADES,
      );
      expect(res.data.actividadesEconomicas.map((a) => a.nombre)).toContain(
        'Fritanga/Snacks',
      );
    });

    it('are managed only by the super admin, and restored when recreated', async () => {
      const denied = await gql(app, adminToken, CREATE_ACTIVIDAD, {
        nombre: 'Colegio',
      });
      expect(denied.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');

      const created = await gql<{
        createActividadEconomica: { id: string };
      }>(app, superToken, CREATE_ACTIVIDAD, { nombre: '  Colegio ' });
      const id = created.data.createActividadEconomica.id;
      await gql(app, superToken, DELETE_ACTIVIDAD, { id });

      const again = await gql<{
        createActividadEconomica: { id: string; nombre: string };
      }>(app, superToken, CREATE_ACTIVIDAD, { nombre: 'Colegio' });
      expect(again.data.createActividadEconomica).toEqual({
        id,
        nombre: 'Colegio',
      });

      const dup = await gql(app, superToken, CREATE_ACTIVIDAD, {
        nombre: 'Colegio',
      });
      expect(dup.errors?.[0]?.message).toMatch(/Ya existe/);
    });
  });

  describe('productos y empaques', () => {
    it('come with the base combinations', async () => {
      const res = await gql<{ productos: Producto[] }>(
        app,
        entregaToken,
        PRODUCTOS,
      );
      expect(res.data.productos).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            nombre: 'Oleína de palma',
            empaques: [{ nombre: 'Galón', retornable: true }],
          }),
        ]),
      );
    });

    it('lets admin manage empaques and combinations, not entrega', async () => {
      const denied = await gql(app, entregaToken, CREATE_EMPAQUE, {
        input: { nombre: 'Balde' },
      });
      expect(denied.errors?.[0]?.extensions?.code).toBe('FORBIDDEN');

      const balde = await gql<{
        createTipoEmpaque: { id: string; capacidad: number };
      }>(app, adminToken, CREATE_EMPAQUE, {
        input: {
          nombre: 'Balde',
          capacidad: 5,
          unidad: 'galones',
          retornable: true,
        },
      });
      expect(balde.data.createTipoEmpaque.capacidad).toBe(5);

      const productos = await gql<{ productos: Producto[] }>(
        app,
        adminToken,
        PRODUCTOS,
      );
      const oleina = productos.data.productos.find(
        (p) => p.nombre === 'Oleína de palma',
      )!;
      const empaques = await gql<{
        tiposEmpaque: { id: string; nombre: string }[];
      }>(app, adminToken, EMPAQUES);
      const galon = empaques.data.tiposEmpaque.find(
        (e) => e.nombre === 'Galón',
      )!;

      const res = await gql<{ setEmpaquesProducto: Producto }>(
        app,
        adminToken,
        SET_EMPAQUES,
        {
          productoId: oleina.id,
          ids: [galon.id, balde.data.createTipoEmpaque.id],
        },
      );
      expect(
        res.data.setEmpaquesProducto.empaques.map((e) => e.nombre),
      ).toEqual(['Balde', 'Galón']);
    });
  });

  describe('vehículos', () => {
    let transportadorId: string;

    beforeAll(async () => {
      transportadorId = (
        await createCliente(prisma, empresaId, {
          razon_social: 'Invergrasas SAS',
          tipos: ['TRANSPORTADOR', 'DESTINO'],
        })
      ).id;
    });

    it('normalizes the plate and keeps it unique per empresa', async () => {
      const res = await gql<{ createVehiculo: { id: string; placa: string } }>(
        app,
        adminToken,
        CREATE_VEHICULO,
        {
          input: {
            empresa_id: empresaId,
            transportador_id: transportadorId,
            placa: 'abc-123',
            descripcion: 'NPR blanco',
          },
        },
      );
      expect(res.data.createVehiculo.placa).toBe('ABC 123');

      const dup = await gql(app, adminToken, CREATE_VEHICULO, {
        input: {
          empresa_id: empresaId,
          transportador_id: transportadorId,
          placa: 'ABC123',
        },
      });
      expect(dup.errors?.[0]?.message).toMatch(/Ya existe un vehículo/);

      // Default vehicle for a driver
      const def = await gql<{ asignarVehiculoPorDefecto: { placa: string } }>(
        app,
        adminToken,
        DEFAULT,
        { userId: entregaId, vehiculoId: res.data.createVehiculo.id },
      );
      expect(def.data.asignarVehiculoPorDefecto.placa).toBe('ABC 123');
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: entregaId },
      });
      expect(user.vehiculo_por_defecto_id).toBe(res.data.createVehiculo.id);

      const list = await gql<{ vehiculos: unknown[] }>(
        app,
        entregaToken,
        VEHICULOS,
      );
      expect(list.data.vehiculos).toEqual([
        {
          placa: 'ABC 123',
          transportador: { razon_social: 'Invergrasas SAS' },
        },
      ]);
    });

    it('requires a transportador of the same empresa', async () => {
      const generador = await createCliente(prisma, empresaId);
      const res = await gql(app, adminToken, CREATE_VEHICULO, {
        input: {
          empresa_id: empresaId,
          transportador_id: generador.id,
          placa: 'XYZ 987',
        },
      });
      expect(res.errors?.[0]?.message).toMatch(/tipo Transportador/);
    });
  });
});
