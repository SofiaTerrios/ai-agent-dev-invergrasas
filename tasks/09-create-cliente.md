# Task: Create Cliente

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `pending`
**Created:** 2026-05-05
**Depends On:** `tasks/05-create-empresa.md`

## Context
Invergrasas needs to manage clients (Clientes) that belong to a specific company (Empresa). This task covers creating the `Cliente` TypeORM entity and the endpoint to allow authenticated users to register a new client for an existing company.

## Requirements
- [ ] Create `Cliente` TypeORM entity with fields: `id` (uuid), `nombre`, `contacto`, `telefono`, `correo`.
- [ ] Add a Many-to-One relationship to link the `Cliente` to an `Empresa` (`empresa_id`).
- [ ] `POST /api/clientes` endpoint accepts `nombre`, `contacto`, `telefono`, `correo`, and `empresa_id`.
- [ ] Endpoint is protected by JWT Auth Guard.
- [ ] Validates that the provided `empresa_id` exists (`404 Not Found` if it doesn't).
- [ ] Endpoint returns `201 Created` with the created client data on success.
- [ ] Endpoint returns `400 Bad Request` with field-level validation errors (e.g., valid email, non-empty fields).

## Acceptance Criteria
- [ ] `POST /api/clientes` with valid data creates the client associated with the enterprise.
- [ ] Attempting to create a client with a non-existent `empresa_id` returns `404 Not Found`.
- [ ] Unauthenticated requests return `401 Unauthorized`.
- [ ] Unit tests cover `ClientesService` creation logic.
- [ ] E2E tests for the create client endpoint.

## Files to Create or Modify
- `backend/src/clientes/entities/cliente.entity.ts`
- `backend/src/empresas/entities/empresa.entity.ts` (to add OneToMany relation)
- `backend/src/clientes/dto/create-cliente.dto.ts`
- `backend/src/clientes/clientes.controller.ts`
- `backend/src/clientes/clientes.service.ts`
- `backend/src/clientes/clientes.module.ts`
- `backend/src/clientes/clientes.service.spec.ts`
- `backend/test/clientes/create.e2e-spec.ts`