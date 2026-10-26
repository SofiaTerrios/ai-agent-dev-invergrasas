# Task: Delete Cliente

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `done`
**Created:** 2026-05-05
**Depends On:** `tasks/09-create-cliente.md`

## Context
Users need the ability to remove a client (Cliente) from the system when they are no longer relevant to the company.

## Requirements
- [x] `DELETE /api/clientes/:id` endpoint to remove a client.
- [x] Endpoint is protected by JWT Auth Guard.
- [x] Verifies the client exists before deleting; returns `404 Not Found` if it doesn't.
- [x] Successfully deletes the entity from the database.
- [x] Endpoint returns `204 No Content` or `200 OK` indicating successful deletion.

## Acceptance Criteria
- [x] A valid request completely removes the client from the database.
- [x] Attempting to delete a non-existent client ID returns `404 Not Found`.
- [x] Unauthenticated requests return `401 Unauthorized`.
- [x] Unit tests cover `ClientesService` deletion logic.
- [x] E2E tests for the delete client endpoint.

## Files to Create or Modify
- `backend/src/clientes/clientes.controller.ts` (added DELETE endpoint)
- `backend/src/clientes/clientes.service.ts` (added remove method)
- `backend/src/clientes/clientes.service.spec.ts`
- `backend/test/clientes/delete.e2e-spec.ts`

## Estado actual (2026-10-20)

- El borrado es lógico (`deleted_at`): el cliente deja de aparecer pero la fila se conserva (IG-4).
