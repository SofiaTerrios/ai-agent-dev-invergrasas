import { calcularPeriodo } from './periodo';

describe('calcularPeriodo', () => {
  it('compares this month so far with the same days of last month', () => {
    expect(calcularPeriodo('2026-11-12')).toMatchObject({
      desde: '2026-11-01',
      hasta: '2026-11-12',
      anterior_desde: '2026-10-01',
      anterior_hasta: '2026-10-12',
    });
  });

  it('caps the day for shorter months and crosses the year', () => {
    expect(calcularPeriodo('2026-03-31')).toMatchObject({
      anterior_desde: '2026-02-01',
      anterior_hasta: '2026-02-28',
    });
    expect(calcularPeriodo('2027-01-15')).toMatchObject({
      anterior_desde: '2026-12-01',
      anterior_hasta: '2026-12-15',
    });
  });

  it('compares a whole month with the month before', () => {
    expect(
      calcularPeriodo('2026-11-12', '2026-10-01', '2026-10-31'),
    ).toMatchObject({
      anterior_desde: '2026-09-01',
      anterior_hasta: '2026-09-30',
    });
  });

  it('compares the year to date with the same days of last year', () => {
    expect(
      calcularPeriodo('2028-02-29', '2028-01-01', '2028-02-29'),
    ).toMatchObject({
      anterior_desde: '2027-01-01',
      anterior_hasta: '2027-02-28',
    });
  });

  it('compares any other range with the same number of days before it', () => {
    expect(
      calcularPeriodo('2026-11-12', '2026-08-15', '2026-11-12'),
    ).toMatchObject({
      anterior_desde: '2026-05-17',
      anterior_hasta: '2026-08-14',
    });
  });

  it('lists the 12 months ending in the month of hasta', () => {
    const { meses } = calcularPeriodo('2026-02-10');
    expect(meses).toHaveLength(12);
    expect(meses[0]).toBe('2025-03');
    expect(meses[11]).toBe('2026-02');
  });

  it('rejects an inverted range', () => {
    expect(() =>
      calcularPeriodo('2026-11-12', '2026-11-10', '2026-11-01'),
    ).toThrow(/posterior/);
  });
});
