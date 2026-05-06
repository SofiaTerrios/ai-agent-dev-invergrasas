# Task: Associate User with Empresa

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `pending`
**Created:** 2026-05-05
**Depends On:** `tasks/05-create-empresa.md`

## Context
A user can belong to one or multiple companies, and a company has multiple users. We need to implement a Many-to-Many (or relations) table between `User` and `Empresa` and an endpoint to establish this association.

## Requirements
- [ ] Add `@ManyToMany` (or join table) relation between `User` and `Empresa` entities.
- [ ] Generate/Run migrations for the pivot table if necessary.
- [ ] `POST /api/empresas/:id/users` endpoint to assign a user to the company. Expects `{ "userId": "uuid" }` in the body.
- [ ] Endpoint is protected by JWT Auth Guard.
- [ ] Validates both `Empresa` and `User` exist before creating the association (`404 Not Found` otherwise).
- [ ] Prevents duplicate associations (silently ignore or return a specific message).

## Acceptance Criteria
- [ ] Endpoint associates an existing user with an existing empresa.
- [ ] Querying the database explicitly shows the relation.
- [ ] Invalid `userId` or `empresaId` returns `404 Not Found`.
- [ ] Unit tests cover association logic.
- [ ] E2E tests for the association endpoint.

## Files to Create or Modify
- `backend/src/users/entities/user.entity.ts` (update relations)
- `backend/src/empresas/entities/empresa.entity.ts` (update relations)
- `backend/src/empresas/dto/associate-user.dto.ts`
- `backend/src/empresas/empresas.controller.ts` (added association endpoint)
- `backend/src/empresas/empresas.service.ts` (added association logic)
- `backend/test/empresas/associate.e2e-spec.ts`