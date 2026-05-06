# Task: Create Empresa

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `pending`
**Created:** 2026-05-05
**Depends On:** `tasks/04-user-login.md`

## Context
Invergrasas needs to manage companies (Empresas) that operate within the system. This task covers creating the `Empresa` TypeORM entity and the endpoint to allow authenticated users to register a new company. 

## Requirements
- [ ] Create `Empresa` TypeORM entity with fields: `id` (uuid), `razon_social`, `nit`, `direccion`, `telefono`, `correo`, `created_at`.
- [ ] `nit` must be unique in the database.
- [ ] `POST /api/empresas` endpoint accepts `razon_social`, `nit`, `direccion`, `telefono`, `correo`.
- [ ] Endpoint is protected by JWT Auth Guard.
- [ ] Endpoint returns `201 Created` with the created company data on success.
- [ ] Endpoint returns `409 Conflict` if the NIT already exists.
- [ ] Endpoint returns `400 Bad Request` with field-level validation errors (e.g., valid email, non-empty fields).

## Acceptance Criteria
- [ ] `POST /api/empresas` with valid data creates the empresa and returns its structure.
- [ ] Attempting to create an empresa with an existing NIT returns `409 Conflict`.
- [ ] Unauthenticated requests return `401 Unauthorized`.
- [ ] Unit tests cover `EmpresasService` creation logic.
- [ ] E2E tests for the create empresa endpoint.

## Files to Create or Modify
- `backend/src/empresas/entities/empresa.entity.ts`
- `backend/src/empresas/dto/create-empresa.dto.ts`
- `backend/src/empresas/empresas.controller.ts`
- `backend/src/empresas/empresas.service.ts`
- `backend/src/empresas/empresas.module.ts`
- `backend/src/empresas/empresas.service.spec.ts`
- `backend/test/empresas/create.e2e-spec.ts`