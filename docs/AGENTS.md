# Reglas para agentes

Antes de implementar una tarea:

1. Leer `memory/project-context.md` y `docs/ARCHITECTURE.md`.
2. Revisar `docs/ROADMAP.md`, `NEXT_TASK.md` y la tarea en `tasks/` o en Jira (proyecto IG).
3. Revisar `memory/decisions.md` antes de cambiar algo transversal (auth, roles, multi-tenancy, paginación, borrado lógico).

Al implementar:

- Seguir las reglas transversales de `docs/ARCHITECTURE.md`: roles con `@Roles()`, acceso por empresa, `deleted_at`, listados paginados y nada de `any`.
- Cambios de esquema solo con migraciones de Prisma.
- Agregar o actualizar tests unitarios y e2e.
- Correr lint, typecheck y tests antes de commitear; CI los vuelve a correr.

Al terminar:

- Actualizar `memory/progress.md`, el estado de la tarea y `NEXT_TASK.md`.
- Registrar en `memory/decisions.md` las decisiones nuevas.
