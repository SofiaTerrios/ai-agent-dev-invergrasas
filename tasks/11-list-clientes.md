# Task: List Clientes by Empresa

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `done`
**Created:** 2026-05-05
**Depends On:** `tasks/09-create-cliente.md`

## Context
To display the clients associated with a specific company, we need an endpoint that retrieves all clients belonging to a given `empresa_id`.

## Requirements
- [x] `GET /api/empresas/:empresaId/clientes` endpoint that returns a list of clients.
- [x] Endpoint is protected by JWT Auth Guard.
- [x] Ensures the `empresaId` exists, returning `404 Not Found` if not.
- [x] Returns `200 OK` with an array of client objects belonging to that enterprise.

## Acceptance Criteria
- [x] A valid `empresaId` returns all its explicitly associated clients.
- [x] An `empresaId` with no clients returns an empty array `[]`.
- [x] A non-existent `empresaId` returns `404 Not Found`.
- [x] Unauthenticated requests return `401 Unauthorized`.
- [x] Unit tests cover filtering by `empresaId` logic.
- [x] E2E tests for the list endpoint.

## Files to Create or Modify
- `backend/src/clientes/clientes.controller.ts` (added GET endpoint, or added inside empresas.controller)
- `backend/src/clientes/clientes.service.ts` (added findAllByEmpresa method)
- `backend/src/clientes/clientes.service.spec.ts`
- `backend/test/clientes/list.e2e-spec.ts`

## Estado actual (2026-10-20)

- El endpoint REST legacy se eliminó (IG-9); el listado se expone con la query GraphQL paginada `clientesByEmpresa` (IG-6).
