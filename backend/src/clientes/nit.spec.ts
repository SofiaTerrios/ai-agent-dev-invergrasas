import { BadRequestException } from '@nestjs/common';
import { digitoVerificacion, normalizarNit } from './nit';

describe('NIT', () => {
  it.each([
    ['901684306', '1'], // Invergrasas SAS (pie del certificado)
    ['800197268', '4'], // DIAN
    ['860034313', '7'],
    ['900123456', '8'],
  ])('calcula el DV de %s = %s', (nit, dv) => {
    expect(digitoVerificacion(nit)).toBe(dv);
  });

  it('acepta puntos, espacios y el DV correcto', () => {
    expect(normalizarNit(' 901.684.306-1 ')).toEqual({
      nit: '901684306',
      dv: '1',
    });
    expect(normalizarNit('901 684 306')).toEqual({ nit: '901684306', dv: '1' });
  });

  it('rechaza un DV que no coincide o un formato inválido', () => {
    expect(() => normalizarNit('901684306-2')).toThrow(/no coincide/);
    expect(() => normalizarNit('ABC123')).toThrow(BadRequestException);
    expect(() => normalizarNit('123')).toThrow(BadRequestException);
  });
});
