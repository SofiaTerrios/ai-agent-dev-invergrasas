const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL ??
  `${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000"}/graphql`;

type GraphQLError = {
  message?: string;
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
};

export async function graphqlRequest<TData, TVariables = Record<string, unknown>>(
  query: string,
  variables?: TVariables,
  token?: string | null,
) {
  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = (await response.json().catch(() => ({}))) as GraphQLResponse<TData>;
  const graphQLError = payload.errors?.[0]?.message;

  if (!response.ok || graphQLError || !payload.data) {
    throw new Error(graphQLError ?? "No se pudo completar la solicitud.");
  }

  return payload.data;
}

export type PageInfo = {
  endCursor: string | null;
  hasNextPage: boolean;
};

// Shape of the paginated list queries (`XConnection` in the API).
export type Connection<T> = {
  edges: { node: T }[];
  pageInfo: PageInfo;
  totalCount: number;
};

export const PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

export function connectionNodes<T>(connection: Connection<T> | undefined | null) {
  return connection?.edges.map((edge) => edge.node) ?? [];
}

// Walks every page of a paginated query (for selects that need the full list).
// The query must accept `$first: Int` and `$after: String`.
export async function fetchAllNodes<T>(
  query: string,
  field: string,
  variables: Record<string, unknown>,
  token?: string | null,
) {
  const nodes: T[] = [];
  let after: string | null = null;
  do {
    const data: Record<string, Connection<T>> = await graphqlRequest<
      Record<string, Connection<T>>
    >(query, { ...variables, first: MAX_PAGE_SIZE, after }, token);
    const page: Connection<T> = data[field];
    nodes.push(...connectionNodes(page));
    after = page.pageInfo.hasNextPage ? page.pageInfo.endCursor : null;
  } while (after);
  return nodes;
}
