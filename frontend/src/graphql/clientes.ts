export const GET_CLIENTES_QUERY = `
  query GetClientes($first: Int, $after: String) {
    clientes(first: $first, after: $after) {
      edges {
        node {
          id
          nombre
          contacto
          telefono
          correo
          empresa_id
          created_at
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

export const CREATE_CLIENTE_MUTATION = `
  mutation CreateCliente($input: CreateClienteInput!) {
    createCliente(input: $input) {
      id
      nombre
      contacto
      telefono
      correo
      empresa_id
      created_at
    }
  }
`;

export const UPDATE_CLIENTE_MUTATION = `
  mutation UpdateCliente($id: ID!, $input: UpdateClienteInput!) {
    updateCliente(id: $id, input: $input) {
      id
      nombre
      contacto
      telefono
      correo
      empresa_id
      created_at
    }
  }
`;

export const DELETE_CLIENTE_MUTATION = `
  mutation DeleteCliente($id: ID!) {
    deleteCliente(id: $id) {
      message
    }
  }
`;

export type Cliente = {
  id: string;
  nombre: string;
  contacto: string;
  telefono: string;
  correo: string;
  empresa_id: string;
  created_at: string;
};

export type CreateClienteInput = {
  nombre: string;
  contacto: string;
  telefono: string;
  correo: string;
  empresa_id: string;
};

export type UpdateClienteInput = Partial<CreateClienteInput>;

export const GET_CLIENTES_BY_EMPRESA_QUERY = `
  query GetClientesByEmpresa($empresaId: ID!, $first: Int, $after: String) {
    clientesByEmpresa(empresaId: $empresaId, first: $first, after: $after) {
      edges {
        node {
          id
          nombre
          empresa_id
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;
