# Task: Associate User with Empresa

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `done`
**Created:** 2026-05-05
**Depends On:** `tasks/05-create-empresa.md`

## Context
A user can belong to one or multiple companies, and a company has multiple users. We need to implement a Many-to-Many (or relations) table between `User` and `Empresa` and an endpoint to establish this association.

## Requirements
- [x] Add `@ManyToMany` (or join table) relation between `User` and `Empresa` entities.
- [x] Generate/Run migrations for the pivot table if necessary.
- [x] `POST /api/empresas/:id/users` endpoint to assign a user to the company. Expects `{ "userId": "uuid" }` in the body.
- [x] Endpoint is protected by JWT Auth Guard.
- [x] Validates both `Empresa` and `User` exist before creating the association (`404 Not Found` otherwise).
- [x] Prevents duplicate associations (silently ignore or return a specific message).

## Acceptance Criteria
- [x] Endpoint associates an existing user with an existing empresa.
- [x] Querying the database explicitly shows the relation.
- [x] Invalid `userId` or `empresaId` returns `404 Not Found`.
- [x] Unit tests cover association logic.
- [x] E2E tests for the association endpoint.

## Files to Create or Modify
- `backend/src/users/entities/user.entity.ts` (update relations)
- `backend/src/empresas/entities/empresa.entity.ts` (update relations)
- `backend/src/empresas/dto/associate-user.dto.ts`
- `backend/src/empresas/empresas.controller.ts` (added association endpoint)
- `backend/src/empresas/empresas.service.ts` (added association logic)
- `backend/test/empresas/associate.e2e-spec.ts`

## Estado actual (2026-10-20)

- Relación `UserEmpresa` en Prisma; re-asociar restaura una asociación borrada (IG-4).
