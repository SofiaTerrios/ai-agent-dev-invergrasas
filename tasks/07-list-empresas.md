# Task: List User Empresas

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `done`
**Created:** 2026-05-05
**Depends On:** `tasks/08-associate-user-empresa.md`

## Context
When a user logs in, they need to see only the companies (Empresas) they are associated with.

## Requirements
- [x] `GET /api/empresas` endpoint that returns a list of companies.
- [x] The endpoint uses the authenticated user's ID (from JWT) to filter the results.
- [x] Only returns `Empresas` linked to the current `User`.
- [x] Returns `200 OK` with an array of company objects.

## Acceptance Criteria
- [x] A user with 2 assigned companies receives exactly those 2 companies in the response.
- [x] A user with no companies receives an empty array `[]`.
- [x] Unauthenticated requests return `401 Unauthorized`.
- [x] Unit tests cover filtering by user ID logic.
- [x] E2E tests for the list endpoint.

## Files to Create or Modify
- `backend/src/empresas/empresas.controller.ts` (added GET endpoint or updated existing)
- `backend/src/empresas/empresas.service.ts` (added findAll method filtering by userId)
- `backend/src/empresas/empresas.service.spec.ts`
- `backend/test/empresas/list.e2e-spec.ts`

## Estado actual (2026-10-20)

- La respuesta está paginada (`edges`/`pageInfo`/`totalCount`, IG-6). Los admin ven todas las empresas.
