# Task: Create Empresa

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `done`
**Created:** 2026-05-05
**Depends On:** `tasks/04-user-login.md`

## Context
Invergrasas needs to manage companies (Empresas) that operate within the system. This task covers creating the `Empresa` TypeORM entity and the endpoint to allow authenticated users to register a new company. 

## Requirements
- [x] Create `Empresa` TypeORM entity with fields: `id` (uuid), `razon_social`, `nit`, `direccion`, `telefono`, `correo`, `created_at`.
- [x] `nit` must be unique in the database.
- [x] `POST /api/empresas` endpoint accepts `razon_social`, `nit`, `direccion`, `telefono`, `correo`.
- [x] Endpoint is protected by JWT Auth Guard.
- [x] Endpoint returns `201 Created` with the created company data on success.
- [x] Endpoint returns `409 Conflict` if the NIT already exists.
- [x] Endpoint returns `400 Bad Request` with field-level validation errors (e.g., valid email, non-empty fields).

## Acceptance Criteria
- [x] `POST /api/empresas` with valid data creates the empresa and returns its structure.
- [x] Attempting to create an empresa with an existing NIT returns `409 Conflict`.
- [x] Unauthenticated requests return `401 Unauthorized`.
- [x] Unit tests cover `EmpresasService` creation logic.
- [x] E2E tests for the create empresa endpoint.

## Files to Create or Modify
- `backend/src/empresas/entities/empresa.entity.ts`
- `backend/src/empresas/dto/create-empresa.dto.ts`
- `backend/src/empresas/empresas.controller.ts`
- `backend/src/empresas/empresas.service.ts`
- `backend/src/empresas/empresas.module.ts`
- `backend/src/empresas/empresas.service.spec.ts`
- `backend/test/empresas/create.e2e-spec.ts`

## Estado actual (2026-10-20)

- Implementado con Prisma (IG-9). Crear empresas requiere rol `admin` (IG-7).
