import { ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Request } from 'express';

export type AuthUser = {
  id: string;
  userId: string;
  email?: string;
  nombre?: string;
  rol?: string;
};

export type AuthRequest = Request & { user?: AuthUser };

// Returns the HTTP request for both REST handlers and GraphQL resolvers.
export function getRequest(context: ExecutionContext): AuthRequest {
  if (context.getType<GqlContextType>() === 'graphql') {
    return GqlExecutionContext.create(context).getContext<{
      req: AuthRequest;
    }>().req;
  }
  return context.switchToHttp().getRequest<AuthRequest>();
}
