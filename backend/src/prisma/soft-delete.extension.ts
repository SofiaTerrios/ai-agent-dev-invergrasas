import { Prisma } from '@prisma/client';

// Read operations that must ignore soft-deleted rows.
const READ_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
]);

/**
 * Adds `deleted_at: null` to every top-level read so soft-deleted rows are
 * hidden by default. All models carry a `deleted_at` column.
 *
 * - To include deleted rows, set `deleted_at` explicitly in the `where`
 *   (e.g. `deleted_at: undefined` for "any", `{ not: null }` for "only deleted").
 * - Nested filters/includes (`some`, `include: { relation: true }`) are not
 *   rewritten: add `deleted_at: null` there by hand when it matters.
 * - Deleting is done with `update({ data: { deleted_at: new Date() } })`.
 */
export const softDeleteExtension = Prisma.defineExtension({
  name: 'softDelete',
  query: {
    $allModels: {
      async $allOperations({ operation, args, query }) {
        if (READ_OPERATIONS.has(operation)) {
          const queryArgs = (args ?? {}) as { where?: Record<string, unknown> };
          const where = queryArgs.where ?? {};
          if (!('deleted_at' in where)) {
            queryArgs.where = { ...where, deleted_at: null };
          }
          return query(queryArgs);
        }
        return query(args);
      },
    },
  },
});
