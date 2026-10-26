# Próxima tarea

Las tareas de `tasks/` (01–16) y las de Jira IG-4 a IG-15 están completas; ver `memory/progress.md`.

**Fase 1 (usuarios y roles: IG-24, IG-25, IG-29) implementada**, en revisión. Pendiente de esa fase:

- Validar la matriz de `docs/PERMISOS.md` con el negocio.
- Decidir qué pasa con el rol `empleado` y si se mantiene el registro público (hoy crea `empleado` sin empresas, es decir, sin acceso a datos).

Siguiente fase: certificados (IG-18, IG-19, IG-21, IG-20, IG-22).

## Despliegue

**IG-16: poner la plataforma en una URL pública.** La configuración está lista (`render.yaml`, `render.staging.yaml`, Dockerfiles). Falta:

1. Crear la cuenta / Blueprints en Render.
2. Definir `FRONTEND_URL` y `NEXT_PUBLIC_API_URL`.
3. Elegir el dominio.

Pasos en `docs/DEPLOY.md`.

## Después (sin tarea de Jira todavía)

- Campos de N.º de recibo y unidades en `Pedido` (columnas pedidas en IG-10 / IG-11).
- Validar en `clientesByEmpresa` que el usuario pertenezca a la empresa.
- Corregir el error de hidratación (#418) de `DashboardLayout`.
- Módulo Clientes para `comercial` (hoy el menú usa `clientes · leerTodos`, es decir, admin y super admin).
- Validar en `createCliente`/`updateCliente` que el usuario pertenezca a la empresa.
- Listado / historial de certificados en el frontend.
- Decidir si se limpia el historial de git de PDFs con datos de clientes.
