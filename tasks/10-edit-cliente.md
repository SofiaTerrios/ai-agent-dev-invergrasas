# Task: Edit Cliente

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `pending`
**Created:** 2026-05-05
**Depends On:** `tasks/09-create-cliente.md`

## Context
Users need to be able to modify the details of an existing client (Cliente), such as updating their contact person, phone number, or email.

## Requirements
- [ ] `PUT /api/clientes/:id` endpoint accepts partial updates: `nombre`, `contacto`, `telefono`, `correo`, `empresa_id`.
- [ ] Endpoint is protected by JWT Auth Guard.
- [ ] Verifies the client exists before updating; returns `404 Not Found` if it doesn't.
- [ ] If `empresa_id` is updated, ensures the new company exists.
- [ ] Endpoint returns `200 OK` with the updated client entity.

## Acceptance Criteria
- [ ] Valid updates modify the client record and return the updated entity.
- [ ] Invalid completely empty payload or invalid formats return `400 Bad Request`.
- [ ] Attempting to update a non-existent client ID returns `404 Not Found`.
- [ ] Unit tests cover `ClientesService` update logic.
- [ ] E2E tests for the edit client endpoint.

## Files to Create or Modify
- `backend/src/clientes/dto/update-cliente.dto.ts`
- `backend/src/clientes/clientes.controller.ts` (added PUT endpoint)
- `backend/src/clientes/clientes.service.ts` (added update method)
- `backend/src/clientes/clientes.service.spec.ts`
- `backend/test/clientes/update.e2e-spec.ts`