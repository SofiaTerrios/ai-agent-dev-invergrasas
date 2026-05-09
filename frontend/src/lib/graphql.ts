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
