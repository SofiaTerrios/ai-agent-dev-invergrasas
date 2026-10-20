import type { IncomingHttpHeaders } from 'http';
import { userFromAuthHeader } from '../auth/jwt';

export type GqlContext = { req?: { headers?: IncomingHttpHeaders } };

// For resolvers that read the token themselves (e.g. optional auth).
export function getUserFromContext(context: GqlContext) {
  return userFromAuthHeader(context.req?.headers?.authorization);
}
