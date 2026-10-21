# Task: Edit Cliente

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `done`
**Created:** 2026-05-05
**Depends On:** `tasks/09-create-cliente.md`

## Context
Users need to be able to modify the details of an existing client (Cliente), such as updating their contact person, phone number, or email.

## Requirements
- [x] `PUT /api/clientes/:id` endpoint accepts partial updates: `nombre`, `contacto`, `telefono`, `correo`, `empresa_id`.
- [x] Endpoint is protected by JWT Auth Guard.
- [x] Verifies the client exists before updating; returns `404 Not Found` if it doesn't.
- [x] If `empresa_id` is updated, ensures the new company exists.
- [x] Endpoint returns `200 OK` with the updated client entity.

## Acceptance Criteria
- [x] Valid updates modify the client record and return the updated entity.
- [x] Invalid completely empty payload or invalid formats return `400 Bad Request`.
- [x] Attempting to update a non-existent client ID returns `404 Not Found`.
- [x] Unit tests cover `ClientesService` update logic.
- [x] E2E tests for the edit client endpoint.

## Files to Create or Modify
- `backend/src/clientes/dto/update-cliente.dto.ts`
- `backend/src/clientes/clientes.controller.ts` (added PUT endpoint)
- `backend/src/clientes/clientes.service.ts` (added update method)
- `backend/src/clientes/clientes.service.spec.ts`
- `backend/test/clientes/update.e2e-spec.ts`

## Estado actual (2026-10-20)

- Disponible en `PUT /clientes/:id` y la mutation `updateCliente`.
