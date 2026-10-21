# Task: Frontend - Auth UI

**Domain:** `[FRONTEND]`
**Assigned Agent:** Frontend Agent
**Status:** `done`
**Created:** 2026-05-06
**Depends On:** `tasks/01-project-setup.md`

## Context
Crear las interfaces de autenticación (login, registro, recuperación de contraseña) con buen diseño, accesibilidad y utilizando los colores/tema ya definidos en el proyecto (Tailwind config). Debe ser responsivo y reutilizar componentes UI desde una carpeta `frontend/src/components/`.

## Requirements
- [x] `Login` page: formulario con email y password, validación en cliente, feedback de errores, llamado a `POST /api/auth/login`, almacena token de sesión con seguridad (httpOnly ideal, o localStorage si no hay alternativa).
- [x] `Register` page: formulario con nombre, email, password, confirmación de password, validaciones, llamado a `POST /api/auth/register` y manejo de errores del servidor.
- [x] `Forgot Password` (opcional): formulario para pedir recuperación si el backend la soporta o mostrar nota si no está implementado.
- [x] Componentes reutilizables: `AuthLayout`, `Input`, `Button`, `FormError`, `LoadingSpinner` dentro de `frontend/src/components/`.
- [x] Rutas y organización: usar App Router agrupando las páginas de auth en `app/(auth)/` con una `AuthLayout` que centre el contenido.
- [x] Usar los tokens de color/espaciado del proyecto (leer `tailwind.config.js`) y clases utilitarias existentes.
- [x] A11y: labels asociados, foco visible, mensajes de error accesibles.
- [ ] Tests: crear 1–2 pruebas de integración/visual (jest/react-testing-library) para `LoginForm` (validación básica) — si el entorno de test del frontend ya existe.

## Acceptance Criteria
- [x] Login y Register renderizan correctamente en móvil y escritorio.
- [x] Validaciones cliente funcionan y muestran errores.
- [x] POST hacia los endpoints de Auth se realiza (puede usarse mock si no hay backend disponible localmente).
- [x] Componentes están en `frontend/src/components/` y pueden reutilizarse en otras vistas.

## Files to Create or Modify
- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/app/(auth)/register/page.tsx`
- `frontend/src/components/auth/LoginForm.tsx`
- `frontend/src/components/auth/RegisterForm.tsx`
- `frontend/src/components/layouts/AuthLayout.tsx`
- `frontend/src/components/ui/Input.tsx`
- `frontend/src/components/ui/Button.tsx`
- `frontend/src/components/ui/FormError.tsx`
- `frontend/src/styles/README.md` (nota sobre tokens y colores a usar)

## Notes
- Coloca componentes dentro de carpetas claras: `components/auth/`, `components/ui/`, `components/layouts/`.
- Reutilizar clases Tailwind, preferir variables definidas en `tailwind.config.js`.

## Estado actual (2026-10-20)

- Pendiente: el frontend no tiene tests automatizados (no hay Jest/RTL configurado); se valida con lint, typecheck y build en CI.
