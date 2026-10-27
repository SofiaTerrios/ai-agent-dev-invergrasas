import { BadRequestException } from '@nestjs/common';

// DIAN weights, applied from the rightmost digit of the NIT
const PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

export function digitoVerificacion(nit: string) {
  const digitos = [...nit].reverse().map(Number);
  const suma = digitos.reduce((total, d, i) => total + d * PESOS[i], 0);
  const resto = suma % 11;
  return String(resto > 1 ? 11 - resto : resto);
}

/**
 * Normalizes "900.123.456-7", "900123456" or "900 123 456" to the digits
 * and computes the DV. A DV typed by the user must match the computed one.
 */
export function normalizarNit(entrada: string) {
  const texto = entrada.trim().replace(/[.\s]/g, '');
  const match = /^(\d{5,15})(?:-(\d))?$/.exec(texto);
  if (!match) {
    throw new BadRequestException(
      'NIT inválido: usa solo números, con o sin dígito de verificación (900123456-7)',
    );
  }
  const [, nit, dvEscrito] = match;
  const dv = digitoVerificacion(nit);
  if (dvEscrito !== undefined && dvEscrito !== dv) {
    throw new BadRequestException(
      `El dígito de verificación no coincide: para ${nit} es ${dv}`,
    );
  }
  return { nit, dv };
}
