# Task: Implement User Registration

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `done`
**Created:** 2026-05-05
**Depends On:** `tasks/01-project-setup.md`

## Context
Invergrasas internal web system requires user management to handle sales and deliveries (palm olein, RBD, etc.). This task implements the backend registration endpoint and the TypeORM entity for the `User` model, serving as a foundation for authentication.

## Requirements
- [x] Create `User` TypeORM entity with fields: `id` (uuid), `nombre`, `email`, `password`, `rol`, `created_at`
- [x] `email` must be unique in the database
- [x] `POST /api/auth/register` endpoint accepts `nombre`, `email`, `password`, `rol`
- [x] Password hashed with bcrypt (min 10 rounds) before saving
- [x] Endpoint returns `201` with user public profile (no password) on success
- [x] Endpoint returns `409` if email already exists
- [x] Endpoint returns `400` with field-level validation errors for missing/invalid input
- [ ] Input validation: email format, password min 8 chars, nombre non-empty, rol valid type

## Acceptance Criteria
- [x] `POST /api/auth/register` with valid data creates user and returns `{ id, nombre, email, rol, created_at }`
- [x] Duplicate email returns `409 Conflict`
- [x] Invalid email or password structure returns `400 Bad Request`
- [x] Unit tests cover `AuthService` registration logic
- [x] E2E tests for registration endpoints

## Files to Create or Modify
- `backend/src/users/entities/user.entity.ts` - add `User` model
- `backend/src/auth/dto/register-user.dto.ts` - DTO with class-validator decorators
- `backend/src/auth/auth.controller.ts` - `POST /api/auth/register` route
- `backend/src/auth/auth.service.ts` - registration business logic
- `backend/src/users/users.module.ts` - User module
- `backend/src/auth/auth.module.ts` - Auth module setup
- `backend/src/auth/auth.service.spec.ts` - unit tests implementation
- `backend/test/auth/register.e2e-spec.ts` - end-to-end tests for registration

## Estado actual (2026-10-20)

- Implementado con Prisma (no TypeORM, eliminado en IG-9).
- Pendiente: la contraseña exige mínimo 6 caracteres, no 8.
- El registro público solo crea usuarios `empleado` (IG-7).
