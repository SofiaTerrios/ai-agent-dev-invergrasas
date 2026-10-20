import { softDeleteExtension } from './soft-delete.extension';

type QueryHandler = (params: {
  operation: string;
  args: any;
  query: (args: any) => Promise<any>;
}) => Promise<any>;

// defineExtension returns `(client) => client.$extends(definition)`; a fake
// client hands the raw definition back so the handler can be called directly.
const handler = (softDeleteExtension as any)({
  $extends: (ext: any) => ext,
}).query.$allModels.$allOperations as QueryHandler;

const run = (operation: string, args: any) => {
  const query = jest.fn(async (a: any) => a);
  return handler({ operation, args, query });
};

describe('softDeleteExtension', () => {
  it.each(['findMany', 'findFirst', 'findUnique', 'count'])(
    'adds deleted_at: null to %s',
    async (operation) => {
      await expect(run(operation, { where: { id: '1' } })).resolves.toEqual({
        where: { id: '1', deleted_at: null },
      });
    },
  );

  it('adds the filter when no where is given', async () => {
    await expect(run('findMany', undefined)).resolves.toEqual({
      where: { deleted_at: null },
    });
  });

  it('respects an explicit deleted_at filter', async () => {
    await expect(
      run('findUnique', { where: { id: '1', deleted_at: undefined } }),
    ).resolves.toEqual({ where: { id: '1', deleted_at: undefined } });
  });

  it('does not touch writes', async () => {
    const args = { where: { id: '1' }, data: { deleted_at: new Date() } };
    await expect(run('update', args)).resolves.toBe(args);
  });
});
