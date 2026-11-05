import { hoyEnBogota } from './movimientos.service';
import { numeroFormateado } from './movimiento.types';

describe('movimientos utils', () => {
  it('uses the Colombian date, not UTC', () => {
    // 03:00 UTC is still the previous day in Bogotá (UTC-5)
    expect(hoyEnBogota(new Date('2026-10-28T03:00:00Z'))).toBe('2026-10-27');
    expect(hoyEnBogota(new Date('2026-10-28T06:00:00Z'))).toBe('2026-10-28');
  });

  it('formats the number with three digits and the year', () => {
    expect(numeroFormateado(12, 2026)).toBe('012-2026');
    expect(numeroFormateado(1234, 2026)).toBe('1234-2026');
  });
});
