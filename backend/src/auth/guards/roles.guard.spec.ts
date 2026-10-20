import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Role } from '../../graphql/enums';
import { RolesGuard } from './roles.guard';

class TestController {
  open() {}
  adminOnly() {}
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  const httpContext = (
    user: unknown,
    handler = TestController.prototype.adminOnly,
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
      TestController.prototype.adminOnly,
    );
    ctx.setType('graphql');
    return ctx;
  };

  beforeEach(() => {
    jest
      .spyOn(reflector, 'getAllAndOverride')
      .mockImplementation((_key, [handler]) =>
        handler === TestController.prototype.adminOnly
          ? [Role.admin]
          : undefined,
      );
  });

  it('allows handlers without @Roles', () => {
    expect(
      guard.canActivate(httpContext(undefined, TestController.prototype.open)),
    ).toBe(true);
  });

  it('allows a user with a required role (REST)', () => {
    expect(guard.canActivate(httpContext({ id: 'u', rol: 'admin' }))).toBe(
      true,
    );
  });

  it('forbids a user without the required role (REST)', () => {
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

  it('rejects requests without an authenticated user', () => {
    expect(() => guard.canActivate(httpContext(undefined))).toThrow(
      UnauthorizedException,
    );
  });
});
