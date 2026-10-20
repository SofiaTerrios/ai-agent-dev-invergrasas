export type Producto = "RBD" | "Oleina";
export type TipoEmpaque = "Granel" | "Caneca" | "Balde";

export const PRODUCTO_LABELS: Record<Producto, string> = {
  RBD: "RBD",
  Oleina: "Oleína de palma",
};

export const TIPO_EMPAQUE_LABELS: Record<TipoEmpaque, string> = {
  Granel: "Granel",
  Caneca: "Caneca",
  Balde: "Balde",
};

export type Pedido = {
  id: string;
  empresa_id: string;
  cliente_id: string;
  producto: Producto;
  tipo_empaque: TipoEmpaque;
  cantidad_kg: number;
  fecha: string;
  cliente?: { nombre?: string } | null;
};

export type PedidoInput = {
  empresa_id: string;
  cliente_id: string;
  producto: Producto;
  tipo_empaque: TipoEmpaque;
  cantidad_kg: number;
  // YYYY-MM-DD
  fecha: string;
};

const PEDIDO_FIELDS = `
  id
  empresa_id
  cliente_id
  producto
  tipo_empaque
  cantidad_kg
  fecha
  cliente {
    nombre
  }
`;

export const CREATE_PEDIDO_MUTATION = `
  mutation CreatePedido($input: CreatePedidoInput!) {
    createPedido(input: $input) {
      ${PEDIDO_FIELDS}
    }
  }
`;

export const UPDATE_PEDIDO_MUTATION = `
  mutation UpdatePedido($id: ID!, $input: UpdatePedidoInput!) {
    updatePedido(id: $id, input: $input) {
      ${PEDIDO_FIELDS}
    }
  }
`;

// Roles that can create and edit pedidos (backend: PERMISOS.pedidos.escribir)
const ROLES_ESCRITURA_PEDIDOS = ["admin", "comercial", "empleado"];

export function puedeEditarPedidos(rol?: string) {
  return Boolean(rol && ROLES_ESCRITURA_PEDIDOS.includes(rol));
}
