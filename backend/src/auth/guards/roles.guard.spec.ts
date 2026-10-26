import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Permiso } from '../decorators/permiso.decorator';
import { RolesGuard } from './roles.guard';

class TestController {
  open() {}

  @Permiso('empresas', 'editar')
  editarEmpresa() {}

  @Permiso('usuarios', 'gestionar')
  gestionarUsuarios() {}
}

type Handler = () => void;

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  const httpContext = (
    user: unknown,
    handler: Handler = TestController.prototype.editarEmpresa,
  ) => {
    const ctx = new ExecutionContextHost(
      [{ user }, {}, () => {}],
      TestController,
      handler,
    );
    ctx.setType('http');
    return ctx;
  };

  const gqlContext = (user: unknown) => {
    const ctx = new ExecutionContextHost(
      [{}, {}, { req: { user } }, {}],
      TestController,
      TestController.prototype.editarEmpresa,
    );
    ctx.setType('graphql');
    return ctx;
  };

  it('allows handlers without @Permiso', () => {
    expect(
      guard.canActivate(httpContext(undefined, TestController.prototype.open)),
    ).toBe(true);
  });

  it('allows a role that has the permission (REST)', () => {
    expect(guard.canActivate(httpContext({ id: 'u', rol: 'admin' }))).toBe(
      true,
    );
  });

  it('forbids a role without the permission (REST)', () => {
    expect(() =>
      guard.canActivate(httpContext({ id: 'u', rol: 'empleado' })),
    ).toThrow(ForbiddenException);
  });

  it('reads the user from the GraphQL context', () => {
    expect(guard.canActivate(gqlContext({ id: 'u', rol: 'admin' }))).toBe(true);
    expect(() =>
      guard.canActivate(gqlContext({ id: 'u', rol: 'calidad' })),
    ).toThrow(ForbiddenException);
  });

  it('always lets super_admin through, even where no role is listed', () => {
    const superAdmin = { id: 'u', rol: 'super_admin' };
    expect(guard.canActivate(httpContext(superAdmin))).toBe(true);
    expect(guard.canActivate(gqlContext(superAdmin))).toBe(true);
    expect(
      guard.canActivate(
        httpContext(superAdmin, TestController.prototype.gestionarUsuarios),
      ),
    ).toBe(true);
  });

  it('keeps user management for super_admin only', () => {
    expect(() =>
      guard.canActivate(
        httpContext(
          { id: 'u', rol: 'admin' },
          TestController.prototype.gestionarUsuarios,
        ),
      ),
    ).toThrow(ForbiddenException);
  });

  it('rejects requests without an authenticated user', () => {
    expect(() => guard.canActivate(httpContext(undefined))).toThrow(
      UnauthorizedException,
    );
  });
});
