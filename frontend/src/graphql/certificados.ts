import { gql } from "@apollo/client";
import type { Empresa } from "@/graphql/empresas";

export const CREATE_CERTIFICADO_MUTATION = gql`
  mutation CreateCertificado($input: CreateCertificadoInput!) {
    createCertificado(input: $input) {
      id
      archivo_url
      fecha_emision
      mensaje
    }
  }
`;

const CERTIFICADO_FIELDS = `
  id
  tipo
  empresa_id
  cliente_id
  empresa_cliente
  nit_cliente
  lote
  peso_kg
  fecha_emision
  fecha_vencimiento
  firmado_por
  archivo_url
  anulado
  anulado_at
  anulado_por_nombre
  motivo_anulacion
  reemplaza_id
  reemplazado_por_id
  empresa {
    id
    razon_social
  }
`;

export const GET_CERTIFICADOS_QUERY = `
  query GetCertificados(
    $first: Int
    $after: String
    $empresaId: ID
    $tipo: CertificadoTipo
    $busqueda: String
    $fechaDesde: String
    $fechaHasta: String
  ) {
    certificados(
      first: $first
      after: $after
      empresaId: $empresaId
      tipo: $tipo
      busqueda: $busqueda
      fechaDesde: $fechaDesde
      fechaHasta: $fechaHasta
    ) {
      edges {
        node {
          ${CERTIFICADO_FIELDS}
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

export const GET_CERTIFICADO_QUERY = `
  query GetCertificado($id: ID!) {
    certificado(id: $id) {
      ${CERTIFICADO_FIELDS}
      parametros {
        clave
        nombre
        valor
      }
    }
  }
`;

export const ANULAR_CERTIFICADO_MUTATION = `
  mutation AnularCertificado($id: ID!, $motivo: String!) {
    anularCertificado(id: $id, motivo: $motivo) {
      id
    }
  }
`;

export const GET_FIRMANTE_QUERY = `
  query GetFirmante {
    firmanteCertificados {
      id
      nombre
      tiene_firma
    }
  }
`;

export const ASIGNAR_FIRMANTE_MUTATION = `
  mutation AsignarFirmante($userId: ID!) {
    asignarFirmanteCertificados(userId: $userId) {
      id
      nombre
      tiene_firma
    }
  }
`;

export type Certificado = {
  id: string;
  tipo: "oleina" | "rbd";
  empresa_id: string | null;
  cliente_id: string | null;
  empresa_cliente: string;
  nit_cliente: string | null;
  lote: string;
  peso_kg: number | null;
  fecha_emision: string;
  fecha_vencimiento: string;
  firmado_por: string;
  archivo_url: string | null;
  anulado: boolean;
  anulado_at: string | null;
  anulado_por_nombre: string | null;
  motivo_anulacion: string | null;
  reemplaza_id: string | null;
  reemplazado_por_id: string | null;
  empresa: Pick<Empresa, "id" | "razon_social"> | null;
};

export type CertificadoDetalle = Certificado & {
  parametros: { clave: string | null; nombre: string; valor: string }[];
};

export type Firmante = {
  id: string;
  nombre: string;
  tiene_firma: boolean;
};

export const TIPO_LABELS: Record<Certificado["tipo"], string> = {
  oleina: "Oleína",
  rbd: "RBD",
};

// dd/mm/yyyy. Date-only values (fecha_vencimiento) are stored at UTC midnight,
// so they are shown in UTC to avoid moving them a day back.
export function formatFecha(iso: string, soloFecha = false) {
  return new Intl.DateTimeFormat("es-CO", soloFecha ? { timeZone: "UTC" } : {}).format(
    new Date(iso),
  );
}
