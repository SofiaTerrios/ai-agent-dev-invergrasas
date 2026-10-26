import type { Empresa } from "@/graphql/empresas";
import type { Rol } from "@/lib/permisos";

const USUARIO_FIELDS = `
  id
  nombre
  email
  rol
  documento
  telefono
  activo
  debe_cambiar_password
  tiene_firma
  created_at
  vehiculo_por_defecto {
    id
    placa
  }
  empresas {
    id
    razon_social
  }
`;

export const GET_USUARIOS_QUERY = `
  query GetUsuarios($first: Int, $after: String, $incluirInactivos: Boolean) {
    usuarios(first: $first, after: $after, incluirInactivos: $incluirInactivos) {
      edges {
        node {
          ${USUARIO_FIELDS}
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

export const GET_USUARIO_FIRMA_QUERY = `
  query GetUsuarioFirma($id: ID!) {
    usuario(id: $id) {
      id
      firma
    }
  }
`;

export const CREATE_USUARIO_MUTATION = `
  mutation CreateUsuario($input: CreateUsuarioInput!) {
    createUsuario(input: $input) {
      ${USUARIO_FIELDS}
    }
  }
`;

export const UPDATE_USUARIO_MUTATION = `
  mutation UpdateUsuario($id: ID!, $input: UpdateUsuarioInput!) {
    updateUsuario(id: $id, input: $input) {
      ${USUARIO_FIELDS}
    }
  }
`;

export const DESACTIVAR_USUARIO_MUTATION = `
  mutation DesactivarUsuario($id: ID!) {
    desactivarUsuario(id: $id) {
      id
      activo
    }
  }
`;

export const REACTIVAR_USUARIO_MUTATION = `
  mutation ReactivarUsuario($id: ID!) {
    reactivarUsuario(id: $id) {
      id
      activo
    }
  }
`;

export const RESTABLECER_PASSWORD_MUTATION = `
  mutation RestablecerPassword($id: ID!, $password: String!) {
    restablecerPasswordUsuario(id: $id, password: $password) {
      id
      debe_cambiar_password
    }
  }
`;

export const CHANGE_PASSWORD_MUTATION = `
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input) {
      message
    }
  }
`;

export type Usuario = {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  documento?: string | null;
  telefono?: string | null;
  activo: boolean;
  debe_cambiar_password: boolean;
  tiene_firma: boolean;
  created_at: string;
  vehiculo_por_defecto: { id: string; placa: string } | null;
  empresas: Pick<Empresa, "id" | "razon_social">[];
};

export type CreateUsuarioInput = {
  nombre: string;
  email: string;
  password: string;
  rol: Rol;
  documento?: string;
  telefono?: string;
  empresa_ids: string[];
  firma?: string;
};

// null clears documento/telefono/firma; an absent field is left as is
export type UpdateUsuarioInput = Partial<
  Omit<CreateUsuarioInput, "password" | "firma" | "documento" | "telefono">
> & {
  documento?: string | null;
  telefono?: string | null;
  firma?: string | null;
};

export const FIRMA_MAX_BYTES = 300 * 1024;
