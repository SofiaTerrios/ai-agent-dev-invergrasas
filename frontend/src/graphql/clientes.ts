// Empresas cliente (IG-36), sedes (IG-37) y contactos (IG-38)

export type TipoEmpresa = "GENERADOR" | "TRANSPORTADOR" | "DESTINO" | "GESTOR";

export const TIPOS_EMPRESA: { value: TipoEmpresa; label: string }[] = [
  { value: "GENERADOR", label: "Generador" },
  { value: "TRANSPORTADOR", label: "Transportador" },
  { value: "DESTINO", label: "Destino" },
  { value: "GESTOR", label: "Gestor" },
];

export type Ciudad = {
  id: string;
  nombre: string;
  departamento: string;
};

export type Sede = {
  id: string;
  cliente_id: string;
  nombre: string;
  actividad_economica: { id: string; nombre: string } | null;
  direccion: string | null;
  telefono: string | null;
  barrio: string | null;
  localidad: string | null;
  email: string | null;
  ciudad: Ciudad | null;
  principal: boolean;
  activa: boolean;
};

export type Contacto = {
  id: string;
  cliente_id: string;
  sede_id: string | null;
  nombre: string;
  documento: string | null;
  cargo: string | null;
  telefono: string | null;
  email: string | null;
};

export type Cliente = {
  id: string;
  razon_social: string;
  nit: string | null;
  dv: string | null;
  registro: string | null;
  ciudad: Ciudad | null;
  tipos: TipoEmpresa[];
  empresa_id: string;
  datos_incompletos: boolean;
  sedes: Sede[];
  contactos: Contacto[];
  created_at: string;
};

const CIUDAD = `ciudad { id nombre departamento }`;
const SEDE_FIELDS = `
  id cliente_id nombre direccion telefono barrio localidad email principal activa
  actividad_economica { id nombre }
  ${CIUDAD}
`;
const CONTACTO_FIELDS = `id cliente_id sede_id nombre documento cargo telefono email`;
const CLIENTE_FIELDS = `
  id razon_social nit dv registro tipos empresa_id datos_incompletos created_at
  ${CIUDAD}
  sedes { ${SEDE_FIELDS} }
  contactos { ${CONTACTO_FIELDS} }
`;

export const GET_CLIENTES_QUERY = `
  query GetClientes($empresaId: ID, $search: String, $tipo: TipoEmpresa, $first: Int, $after: String) {
    clientes(empresaId: $empresaId, search: $search, tipo: $tipo, first: $first, after: $after) {
      edges { node { ${CLIENTE_FIELDS} } }
      pageInfo { endCursor hasNextPage }
      totalCount
    }
  }
`;

export const GET_CLIENTE_QUERY = `
  query GetCliente($id: ID!) {
    cliente(id: $id) { ${CLIENTE_FIELDS} }
  }
`;

// Light list for selects (pedidos, certificados)
export const GET_CLIENTES_BY_EMPRESA_QUERY = `
  query GetClientesByEmpresa($empresaId: ID!, $first: Int, $after: String) {
    clientesByEmpresa(empresaId: $empresaId, first: $first, after: $after) {
      edges { node { id razon_social nit dv empresa_id } }
      pageInfo { endCursor hasNextPage }
      totalCount
    }
  }
`;

export const CREATE_CLIENTE_MUTATION = `
  mutation CreateCliente($input: CreateClienteInput!) {
    createCliente(input: $input) { ${CLIENTE_FIELDS} }
  }
`;

export const UPDATE_CLIENTE_MUTATION = `
  mutation UpdateCliente($id: ID!, $input: UpdateClienteInput!) {
    updateCliente(id: $id, input: $input) { ${CLIENTE_FIELDS} }
  }
`;

export const DELETE_CLIENTE_MUTATION = `
  mutation DeleteCliente($id: ID!) {
    deleteCliente(id: $id) { message }
  }
`;

export const CREATE_SEDE_MUTATION = `
  mutation CreateSede($input: CreateSedeInput!) {
    createSede(input: $input) { ${SEDE_FIELDS} }
  }
`;

export const UPDATE_SEDE_MUTATION = `
  mutation UpdateSede($id: ID!, $input: UpdateSedeInput!) {
    updateSede(id: $id, input: $input) { ${SEDE_FIELDS} }
  }
`;

export const DELETE_SEDE_MUTATION = `
  mutation DeleteSede($id: ID!) {
    deleteSede(id: $id) { message }
  }
`;

export const CREATE_CONTACTO_MUTATION = `
  mutation CreateContacto($input: CreateContactoInput!) {
    createContacto(input: $input) { ${CONTACTO_FIELDS} }
  }
`;

export const UPDATE_CONTACTO_MUTATION = `
  mutation UpdateContacto($id: ID!, $input: UpdateContactoInput!) {
    updateContacto(id: $id, input: $input) { ${CONTACTO_FIELDS} }
  }
`;

export const DELETE_CONTACTO_MUTATION = `
  mutation DeleteContacto($id: ID!) {
    deleteContacto(id: $id) { message }
  }
`;

export type SedeDatos = {
  nombre: string;
  direccion: string;
  ciudad_id: string;
  actividad_economica_id?: string | null;
  telefono?: string | null;
  barrio?: string | null;
  localidad?: string | null;
  email?: string | null;
};

export type CreateClienteInput = {
  empresa_id: string;
  razon_social: string;
  nit: string;
  registro?: string | null;
  ciudad_id: string;
  tipos: TipoEmpresa[];
  sede_principal: SedeDatos;
};

export type UpdateClienteInput = Partial<Omit<CreateClienteInput, "empresa_id" | "sede_principal">>;

export type ContactoDatos = {
  sede_id?: string | null;
  nombre: string;
  documento?: string | null;
  cargo?: string | null;
  telefono?: string | null;
  email?: string | null;
};

// "901684306" + "1" → "901.684.306-1"
export function formatNit(nit?: string | null, dv?: string | null) {
  if (!nit) return "";
  const conPuntos = nit.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return dv ? `${conPuntos}-${dv}` : conPuntos;
}

// Same DIAN algorithm as the API, to show the DV while typing
const PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
export function digitoVerificacion(nit: string) {
  const digitos = nit.replace(/\D/g, "");
  if (digitos.length < 5 || digitos.length > 15) return null;
  const suma = [...digitos]
    .reverse()
    .reduce((total, d, i) => total + Number(d) * PESOS[i], 0);
  const resto = suma % 11;
  return String(resto > 1 ? 11 - resto : resto);
}
