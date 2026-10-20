import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser, getRequest } from '../request.util';

// User set on the request by JwtAuthGuard.
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser | undefined =>
    getRequest(context).user,
);
