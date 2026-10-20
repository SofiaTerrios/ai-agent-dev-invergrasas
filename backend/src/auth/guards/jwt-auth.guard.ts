import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { getRequest } from '../request.util';
import { userFromAuthHeader } from '../jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = getRequest(context);
    if (!request?.headers) {
      throw new UnauthorizedException('No request found');
    }

    request.user = userFromAuthHeader(request.headers.authorization);
    return true;
  }
}
