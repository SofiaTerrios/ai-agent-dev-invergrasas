import { SetMetadata } from '@nestjs/common';
import { Role } from '../../graphql/enums';

export const ROLES_KEY = 'roles';

// Roles allowed to run a handler. Checked by RolesGuard (after JwtAuthGuard).
export const Roles = (...roles: readonly Role[]) =>
  SetMetadata(ROLES_KEY, roles);
