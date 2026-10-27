import { BadRequestException } from '@nestjs/common';

// Colombian plates: cars "ABC 123", motorcycles "ABC 12D". Stored uppercase
// with one space after the letters.
export function normalizarPlaca(entrada: string) {
  const texto = entrada.toUpperCase().replace(/[\s-]/g, '');
  const match = /^([A-Z]{3})(\d{2}[0-9A-Z])$/.exec(texto);
  if (!match) {
    throw new BadRequestException('Placa inválida: usa el formato ABC 123');
  }
  return `${match[1]} ${match[2]}`;
}
