# Task: Edit Empresa

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `pending`
**Created:** 2026-05-05
**Depends On:** `tasks/05-create-empresa.md`

## Context
Users must be able to update company details (Empresa) when information such as address or phone number changes.

## Requirements
- [ ] `PUT /api/empresas/:id` endpoint accepts partial updates: `razon_social`, `nit`, `direccion`, `telefono`, `correo`.
- [ ] Endpoint is protected by JWT Auth Guard.
- [ ] Verifies the company exists before updating; returns `404 Not Found` if it doesn't.
- [ ] If `nit` is updated, ensures it does not conflict with another existing company (`409 Conflict`).
- [ ] Endpoint returns `200 OK` with the updated entity.

## Acceptance Criteria
- [ ] Valid updates modify the record and return the updated entity.
- [ ] Invalid completely empty payload or invalid formats return `400 Bad Request`.
- [ ] Attempting to update a non-existent ID returns `404 Not Found`.
- [ ] Unit tests cover `EmpresasService` update logic.
- [ ] E2E tests for the edit empresa endpoint.

## Files to Create or Modify
- `backend/src/empresas/dto/update-empresa.dto.ts`
- `backend/src/empresas/empresas.controller.ts` (added PUT endpoint)
- `backend/src/empresas/empresas.service.ts` (added update method)
- `backend/src/empresas/empresas.service.spec.ts`
- `backend/test/empresas/update.e2e-spec.ts`