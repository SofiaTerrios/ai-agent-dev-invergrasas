# Task: Implement User Login

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `done`
**Created:** 2026-05-05
**Depends On:** `tasks/03-user-registration.md`

## Context
Invergrasas internal web system users need to authenticate to access platform features securely. This task covers the login endpoint that verifies credentials and issues a JWT token for authenticated communication in future requests.

## Requirements
- [x] `POST /api/auth/login` endpoint accepts `email`, `password`
- [x] Verify user exists and password matches bcrypt hash
- [x] Implement JWT token generation upon successful validation
- [x] Endpoint returns `200` with `{ access_token, user: { id, nombre, email, rol } }` on success
- [x] Endpoint returns `401 Unauthorized` for invalid email or password
- [x] Endpoint returns `400 Bad request` for invalid input bodies
- [x] Protect specific test/profile endpoint with JWT Auth Guard

## Acceptance Criteria
- [x] `POST /api/auth/login` with correct credentials returns valid JWT and user info
- [x] `POST /api/auth/login` with wrong password returns `401 Unauthorized`
- [x] `POST /api/auth/login` with non-existent email returns `401 Unauthorized`
- [x] Unit tests for the `AuthService` validation and login methods
- [x] E2E tests for login endpoint

## Files to Create or Modify
- `backend/src/auth/dto/login-user.dto.ts` - DTO for login payload
- `backend/src/auth/auth.controller.ts` - `POST /api/auth/login` route
- `backend/src/auth/auth.service.ts` - login business logic and password verification
- `backend/src/auth/strategies/jwt.strategy.ts` - Passport JWT strategy
- `backend/src/auth/guards/jwt-auth.guard.ts` - Guard for protected routes
- `backend/src/auth/auth.module.ts` - configure JwtModule and PassportModule
- `backend/src/auth/auth.service.spec.ts` - unit tests implementation
- `backend/test/auth/login.e2e-spec.ts` - end-to-end tests for login

## Estado actual (2026-10-20)

- El login REST responde 200 / 401 (corregido en IG-9).
