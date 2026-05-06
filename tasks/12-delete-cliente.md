# Task: Delete Cliente

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `pending`
**Created:** 2026-05-05
**Depends On:** `tasks/09-create-cliente.md`

## Context
Users need the ability to remove a client (Cliente) from the system when they are no longer relevant to the company.

## Requirements
- [ ] `DELETE /api/clientes/:id` endpoint to remove a client.
- [ ] Endpoint is protected by JWT Auth Guard.
- [ ] Verifies the client exists before deleting; returns `404 Not Found` if it doesn't.
- [ ] Successfully deletes the entity from the database.
- [ ] Endpoint returns `204 No Content` or `200 OK` indicating successful deletion.

## Acceptance Criteria
- [ ] A valid request completely removes the client from the database.
- [ ] Attempting to delete a non-existent client ID returns `404 Not Found`.
- [ ] Unauthenticated requests return `401 Unauthorized`.
- [ ] Unit tests cover `ClientesService` deletion logic.
- [ ] E2E tests for the delete client endpoint.

## Files to Create or Modify
- `backend/src/clientes/clientes.controller.ts` (added DELETE endpoint)
- `backend/src/clientes/clientes.service.ts` (added remove method)
- `backend/src/clientes/clientes.service.spec.ts`
- `backend/test/clientes/delete.e2e-spec.ts`