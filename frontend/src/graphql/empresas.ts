export const GET_EMPRESAS_QUERY = `
  query GetEmpresas {
    empresas {
      id
      razon_social
      nit
      direccion
      telefono
      correo
      created_at
    }
  }
`;

export const CREATE_EMPRESA_MUTATION = `
  mutation CreateEmpresa($input: CreateEmpresaInput!) {
    createEmpresa(input: $input) {
      id
      razon_social
      nit
      direccion
      telefono
      correo
      created_at
    }
  }
`;

export const UPDATE_EMPRESA_MUTATION = `
  mutation UpdateEmpresa($id: ID!, $input: UpdateEmpresaInput!) {
    updateEmpresa(id: $id, input: $input) {
      id
      razon_social
      nit
      direccion
      telefono
      correo
      created_at
    }
  }
`;

export type Empresa = {
  id: string;
  razon_social: string;
  nit: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  created_at: string;
};

export type CreateEmpresaInput = {
  razon_social: string;
  nit: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
};

export type UpdateEmpresaInput = Partial<CreateEmpresaInput>;
