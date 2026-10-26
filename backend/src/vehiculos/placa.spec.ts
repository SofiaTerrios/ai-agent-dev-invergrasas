import { normalizarPlaca } from './placa';

describe('normalizarPlaca', () => {
  it.each([
    ['abc123', 'ABC 123'],
    [' ABC  123 ', 'ABC 123'],
    ['abc-123', 'ABC 123'],
    ['xyz12d', 'XYZ 12D'],
  ])('%s → %s', (entrada, placa) => {
    expect(normalizarPlaca(entrada)).toBe(placa);
  });

  it.each(['AB123', 'ABCD123', '123ABC', ''])('rechaza "%s"', (entrada) => {
    expect(() => normalizarPlaca(entrada)).toThrow(/Placa inválida/);
  });
});
