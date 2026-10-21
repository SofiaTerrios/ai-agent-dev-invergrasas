# Task: Edit Empresa

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `done`
**Created:** 2026-05-05
**Depends On:** `tasks/05-create-empresa.md`

## Context
Users must be able to update company details (Empresa) when information such as address or phone number changes.

## Requirements
- [x] `PUT /api/empresas/:id` endpoint accepts partial updates: `razon_social`, `nit`, `direccion`, `telefono`, `correo`.
- [x] Endpoint is protected by JWT Auth Guard.
- [x] Verifies the company exists before updating; returns `404 Not Found` if it doesn't.
- [x] If `nit` is updated, ensures it does not conflict with another existing company (`409 Conflict`).
- [x] Endpoint returns `200 OK` with the updated entity.

## Acceptance Criteria
- [x] Valid updates modify the record and return the updated entity.
- [x] Invalid completely empty payload or invalid formats return `400 Bad Request`.
- [x] Attempting to update a non-existent ID returns `404 Not Found`.
- [x] Unit tests cover `EmpresasService` update logic.
- [x] E2E tests for the edit empresa endpoint.

## Files to Create or Modify
- `backend/src/empresas/dto/update-empresa.dto.ts`
- `backend/src/empresas/empresas.controller.ts` (added PUT endpoint)
- `backend/src/empresas/empresas.service.ts` (added update method)
- `backend/src/empresas/empresas.service.spec.ts`
- `backend/test/empresas/update.e2e-spec.ts`

## Estado actual (2026-10-20)

- Editar empresas requiere rol `admin` (IG-7).
