import { SetMetadata } from '@nestjs/common';
import { Accion, Modulo } from '../roles';

export const PERMISO_KEY = 'permiso';

export type PermisoRequerido = { modulo: Modulo; accion: string };

// Permission needed to run a handler (see PERMISOS). Checked by RolesGuard
// (after JwtAuthGuard).
export const Permiso = <M extends Modulo>(modulo: M, accion: Accion<M>) =>
  SetMetadata(PERMISO_KEY, { modulo, accion: accion as string });
