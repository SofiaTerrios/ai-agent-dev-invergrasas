# Task: List User Empresas

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `pending`
**Created:** 2026-05-05
**Depends On:** `tasks/08-associate-user-empresa.md`

## Context
When a user logs in, they need to see only the companies (Empresas) they are associated with.

## Requirements
- [ ] `GET /api/empresas` endpoint that returns a list of companies.
- [ ] The endpoint uses the authenticated user's ID (from JWT) to filter the results.
- [ ] Only returns `Empresas` linked to the current `User`.
- [ ] Returns `200 OK` with an array of company objects.

## Acceptance Criteria
- [ ] A user with 2 assigned companies receives exactly those 2 companies in the response.
- [ ] A user with no companies receives an empty array `[]`.
- [ ] Unauthenticated requests return `401 Unauthorized`.
- [ ] Unit tests cover filtering by user ID logic.
- [ ] E2E tests for the list endpoint.

## Files to Create or Modify
- `backend/src/empresas/empresas.controller.ts` (added GET endpoint or updated existing)
- `backend/src/empresas/empresas.service.ts` (added findAll method filtering by userId)
- `backend/src/empresas/empresas.service.spec.ts`
- `backend/test/empresas/list.e2e-spec.ts`