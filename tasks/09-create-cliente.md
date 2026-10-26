# Task: Create Cliente

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `done`
**Created:** 2026-05-05
**Depends On:** `tasks/05-create-empresa.md`

## Context
Invergrasas needs to manage clients (Clientes) that belong to a specific company (Empresa). This task covers creating the `Cliente` TypeORM entity and the endpoint to allow authenticated users to register a new client for an existing company.

## Requirements
- [x] Create `Cliente` TypeORM entity with fields: `id` (uuid), `nombre`, `contacto`, `telefono`, `correo`.
- [x] Add a Many-to-One relationship to link the `Cliente` to an `Empresa` (`empresa_id`).
- [x] `POST /api/clientes` endpoint accepts `nombre`, `contacto`, `telefono`, `correo`, and `empresa_id`.
- [x] Endpoint is protected by JWT Auth Guard.
- [x] Validates that the provided `empresa_id` exists (`404 Not Found` if it doesn't).
- [x] Endpoint returns `201 Created` with the created client data on success.
- [x] Endpoint returns `400 Bad Request` with field-level validation errors (e.g., valid email, non-empty fields).

## Acceptance Criteria
- [x] `POST /api/clientes` with valid data creates the client associated with the enterprise.
- [x] Attempting to create a client with a non-existent `empresa_id` returns `404 Not Found`.
- [x] Unauthenticated requests return `401 Unauthorized`.
- [x] Unit tests cover `ClientesService` creation logic.
- [x] E2E tests for the create client endpoint.

## Files to Create or Modify
- `backend/src/clientes/entities/cliente.entity.ts`
- `backend/src/empresas/entities/empresa.entity.ts` (to add OneToMany relation)
- `backend/src/clientes/dto/create-cliente.dto.ts`
- `backend/src/clientes/clientes.controller.ts`
- `backend/src/clientes/clientes.service.ts`
- `backend/src/clientes/clientes.module.ts`
- `backend/src/clientes/clientes.service.spec.ts`
- `backend/test/clientes/create.e2e-spec.ts`

## Estado actual (2026-10-20)

- Implementado con Prisma (IG-9) en `POST /clientes` y la mutation `createCliente`; requiere rol `admin` o `comercial` (IG-7).
