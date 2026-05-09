import { gql } from "@apollo/client";

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
