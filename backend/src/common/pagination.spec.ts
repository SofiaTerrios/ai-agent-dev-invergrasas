import { BadRequestException } from '@nestjs/common';
import { decodeCursor, encodeCursor, paginate } from './pagination';

const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `id-${i + 1}` }));

describe('paginate', () => {
  const originalMax = process.env.PAGINATION_MAX_LIMIT;

  afterEach(() => {
    if (originalMax === undefined) delete process.env.PAGINATION_MAX_LIMIT;
    else process.env.PAGINATION_MAX_LIMIT = originalMax;
  });

  it('asks for one extra row to detect the next page', async () => {
    const findPage = jest.fn().mockResolvedValue(rows(3));

    const page = await paginate({ first: 2 }, findPage, () =>
      Promise.resolve(10),
    );

    expect(findPage).toHaveBeenCalledWith({ take: 3 });
    expect(page.edges.map((e) => e.node.id)).toEqual(['id-1', 'id-2']);
    expect(page.pageInfo).toEqual({
      hasNextPage: true,
      endCursor: encodeCursor('id-2'),
    });
    expect(page.totalCount).toBe(10);
  });

  it('continues after the given cursor', async () => {
    const findPage = jest.fn().mockResolvedValue(rows(1));

    const page = await paginate(
      { first: 2, after: encodeCursor('id-2') },
      findPage,
      () => Promise.resolve(3),
    );

    expect(findPage).toHaveBeenCalledWith({
      take: 3,
      skip: 1,
      cursor: { id: 'id-2' },
    });
    expect(page.pageInfo.hasNextPage).toBe(false);
  });

  it('uses 20 by default and never exceeds the configured maximum', async () => {
    process.env.PAGINATION_MAX_LIMIT = '50';
    const findPage = jest.fn().mockResolvedValue([]);

    await paginate({}, findPage, () => Promise.resolve(0));
    await paginate({ first: 1000 }, findPage, () => Promise.resolve(0));

    expect(findPage).toHaveBeenNthCalledWith(1, { take: 21 });
    expect(findPage).toHaveBeenNthCalledWith(2, { take: 51 });
  });

  it('returns an empty page with a null endCursor', async () => {
    const page = await paginate(
      {},
      () => Promise.resolve([]),
      () => Promise.resolve(0),
    );

    expect(page.edges).toEqual([]);
    expect(page.pageInfo).toEqual({ endCursor: null, hasNextPage: false });
  });

  it('rejects malformed cursors', () => {
    expect(() => decodeCursor('***')).toThrow(BadRequestException);
    expect(decodeCursor(encodeCursor('abc'))).toBe('abc');
  });
});
