// Catálogos (IG-35, IG-26) y vehículos (IG-40)

export type ActividadEconomica = { id: string; nombre: string };

export type TipoEmpaqueCatalogo = {
  id: string;
  nombre: string;
  capacidad: number | null;
  unidad: string | null;
  retornable: boolean;
};

export type ProductoCatalogo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  empaques: TipoEmpaqueCatalogo[];
};

export type Vehiculo = {
  id: string;
  empresa_id: string;
  transportador_id: string;
  transportador: { id: string; razon_social: string };
  placa: string;
  descripcion: string | null;
};

export const GET_CIUDADES_QUERY = `
  query GetCiudades($search: String, $first: Int) {
    ciudades(search: $search, first: $first) { id nombre departamento }
  }
`;

export const GET_ACTIVIDADES_QUERY = `
  query GetActividades { actividadesEconomicas { id nombre } }
`;
export const CREATE_ACTIVIDAD_MUTATION = `
  mutation CreateActividad($nombre: String!) { createActividadEconomica(nombre: $nombre) { id nombre } }
`;
export const UPDATE_ACTIVIDAD_MUTATION = `
  mutation UpdateActividad($id: ID!, $nombre: String!) { updateActividadEconomica(id: $id, nombre: $nombre) { id nombre } }
`;
export const DELETE_ACTIVIDAD_MUTATION = `
  mutation DeleteActividad($id: ID!) { deleteActividadEconomica(id: $id) { message } }
`;

const EMPAQUE_FIELDS = `id nombre capacidad unidad retornable`;

export const GET_PRODUCTOS_QUERY = `
  query GetProductos { productos { id nombre descripcion empaques { ${EMPAQUE_FIELDS} } } }
`;
export const CREATE_PRODUCTO_MUTATION = `
  mutation CreateProducto($input: ProductoInput!) { createProducto(input: $input) { id } }
`;
export const UPDATE_PRODUCTO_MUTATION = `
  mutation UpdateProducto($id: ID!, $input: UpdateProductoInput!) { updateProducto(id: $id, input: $input) { id } }
`;
export const DELETE_PRODUCTO_MUTATION = `
  mutation DeleteProducto($id: ID!) { deleteProducto(id: $id) { message } }
`;
export const SET_EMPAQUES_PRODUCTO_MUTATION = `
  mutation SetEmpaques($productoId: ID!, $ids: [ID!]!) {
    setEmpaquesProducto(productoId: $productoId, tipoEmpaqueIds: $ids) { id }
  }
`;

export const GET_EMPAQUES_QUERY = `
  query GetEmpaques { tiposEmpaque { ${EMPAQUE_FIELDS} } }
`;
export const CREATE_EMPAQUE_MUTATION = `
  mutation CreateEmpaque($input: TipoEmpaqueInput!) { createTipoEmpaque(input: $input) { id } }
`;
export const UPDATE_EMPAQUE_MUTATION = `
  mutation UpdateEmpaque($id: ID!, $input: UpdateTipoEmpaqueInput!) { updateTipoEmpaque(id: $id, input: $input) { id } }
`;
export const DELETE_EMPAQUE_MUTATION = `
  mutation DeleteEmpaque($id: ID!) { deleteTipoEmpaque(id: $id) { message } }
`;

const VEHICULO_FIELDS = `id empresa_id transportador_id placa descripcion transportador { id razon_social }`;

export const GET_VEHICULOS_QUERY = `
  query GetVehiculos($empresaId: ID, $transportadorId: ID) {
    vehiculos(empresaId: $empresaId, transportadorId: $transportadorId) { ${VEHICULO_FIELDS} }
  }
`;
export const CREATE_VEHICULO_MUTATION = `
  mutation CreateVehiculo($input: CreateVehiculoInput!) { createVehiculo(input: $input) { ${VEHICULO_FIELDS} } }
`;
export const UPDATE_VEHICULO_MUTATION = `
  mutation UpdateVehiculo($id: ID!, $input: UpdateVehiculoInput!) { updateVehiculo(id: $id, input: $input) { ${VEHICULO_FIELDS} } }
`;
export const DELETE_VEHICULO_MUTATION = `
  mutation DeleteVehiculo($id: ID!) { deleteVehiculo(id: $id) { message } }
`;
export const ASIGNAR_VEHICULO_MUTATION = `
  mutation AsignarVehiculo($userId: ID!, $vehiculoId: ID) {
    asignarVehiculoPorDefecto(userId: $userId, vehiculoId: $vehiculoId) { id }
  }
`;
