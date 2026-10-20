import { BadRequestException, Type } from '@nestjs/common';
import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { Type as TransformType } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

const DEFAULT_LIMIT = 20;
const DEFAULT_MAX_LIMIT = 100;

// Page size cap, configurable with PAGINATION_MAX_LIMIT.
export function maxPageSize() {
  const configured = Number(process.env.PAGINATION_MAX_LIMIT);
  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_LIMIT;
}

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, {
    nullable: true,
    description: `Tamaño de página (por defecto ${DEFAULT_LIMIT}, se limita al máximo configurado)`,
  })
  @IsOptional()
  @TransformType(() => Number)
  @IsInt()
  @Min(1)
  first?: number;

  @Field(() => String, {
    nullable: true,
    description: 'endCursor de la página anterior',
  })
  @IsOptional()
  @IsString()
  after?: string;
}

@ObjectType()
export class PageInfo {
  @Field(() => String, { nullable: true })
  endCursor!: string | null;

  @Field()
  hasNextPage!: boolean;
}

export type Edge<T> = { cursor: string; node: T };

export type Connection<T> = {
  edges: Edge<T>[];
  pageInfo: PageInfo;
  totalCount: number;
};

// GraphQL connection type for a model: `XConnection { edges { cursor node } pageInfo totalCount }`.
export function ConnectionType<T>(classRef: Type<T>, name: string) {
  @ObjectType(`${name}Edge`)
  abstract class EdgeType {
    @Field()
    cursor!: string;

    @Field(() => classRef)
    node!: T;
  }

  @ObjectType({ isAbstract: true })
  abstract class ConnectionTypeClass {
    @Field(() => [EdgeType])
    edges!: Edge<T>[];

    @Field(() => PageInfo)
    pageInfo!: PageInfo;

    @Field(() => Int)
    totalCount!: number;
  }

  return ConnectionTypeClass;
}

export function encodeCursor(id: string) {
  return Buffer.from(id, 'utf8').toString('base64url');
}

export function decodeCursor(cursor: string) {
  const id = Buffer.from(cursor, 'base64url').toString('utf8');
  if (!id || encodeCursor(id) !== cursor) {
    throw new BadRequestException('Cursor inválido');
  }
  return id;
}

export type PageQuery = {
  take: number;
  skip?: number;
  cursor?: { id: string };
};

export function emptyConnection<T>(): Connection<T> {
  return {
    edges: [],
    pageInfo: { endCursor: null, hasNextPage: false },
    totalCount: 0,
  };
}

/**
 * Cursor pagination over Prisma: `findPage` must spread the given
 * `take`/`skip`/`cursor` into its findMany and use a stable orderBy ending in `id`.
 */
export async function paginate<T extends { id: string }>(
  args: PaginationArgs = {},
  findPage: (query: PageQuery) => Promise<T[]>,
  count: () => Promise<number>,
): Promise<Connection<T>> {
  const limit = Math.min(args.first ?? DEFAULT_LIMIT, maxPageSize());
  const cursorId = args.after ? decodeCursor(args.after) : undefined;

  const [rows, totalCount] = await Promise.all([
    findPage({
      take: limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    }),
    count(),
  ]);

  const nodes = rows.slice(0, limit);
  const edges = nodes.map((node) => ({ cursor: encodeCursor(node.id), node }));
  return {
    edges,
    pageInfo: {
      endCursor: edges.length ? edges[edges.length - 1].cursor : null,
      hasNextPage: rows.length > limit,
    },
    totalCount,
  };
}
