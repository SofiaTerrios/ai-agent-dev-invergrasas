# Progreso

Estado de las tareas del repositorio (`tasks/`) y de las tareas de Jira (proyecto IG).

Leyenda de estados:

- `pending`: no iniciada.
- `in-progress`: en curso.
- `blocked`: esperando una decisión o dependencia.
- `done`: criterios de aceptación cumplidos.

## Tareas del repositorio (`tasks/`)

| Tarea | Título | Estado | Notas |
|---|---|---|---|
| 01 | Project setup | `done` | |
| 01 | Landing page | `done` | |
| 02 | Authentication (backend) | `done` | |
| 02 | Auth UI (frontend) | `done` | Sin tests automatizados de frontend. |
| 03 | User registration | `done` | Contraseña mínima de 6 caracteres (la tarea pedía 8). |
| 03 | Dashboard UI | `done` | |
| 04 | User login | `done` | |
| 04 | UI de certificados | `done` | |
| 05–08 | Empresas (crear, editar, listar, asociar usuario) | `done` | |
| 09–12 | Clientes (crear, editar, listar, borrar) | `done` | Borrado lógico (IG-4). |
| 13–15 | Pedidos API (crear, listar, editar) | `done` | Crear y editar vía GraphQL. |
| 16 | Certificados PDF (backend) | `done` | Falta validar el formato visual con el negocio. |

## Jira

| Clave | Título | Estado |
|---|---|---|
| IG-4 | Soft delete (`deleted_at`) en todos los modelos | `done` |
| IG-5 | `empresa_id` en certificados (multi-tenancy) | `done` |
| IG-6 | Paginación por cursor en los listados | `done` |
| IG-7 | RBAC por módulo: enum de roles y guards | `done` |
| IG-8 | Eliminar los usos de `any` | `done` |
| IG-9 | Quitar TypeORM y dependencias sobrantes | `done` |
| IG-10 | Listar y filtrar pedidos en el dashboard | `done` |
| IG-11 | Crear pedido desde el dashboard | `done` |
| IG-12 | Editar pedido desde el dashboard | `done` |
| IG-13 | Sacar de git PDFs generados y `.DS_Store` | `done` (historial pendiente de decisión) |
| IG-14 | Actualizar documentación y estado de tareas | `done` |
| IG-15 | CI con GitHub Actions | `done` |
| IG-16 | Despliegue (frontend, backend y BD) | `blocked`: configuración lista; falta crear cuenta/servicios en Render y elegir dominio |
| IG-18 | Pantalla de historial de certificados | `in-progress`: implementado, en revisión |
| IG-19 | Logo e imagen de firma en el PDF | `in-progress`: implementado, en revisión |
| IG-20 | Validar el formato del PDF con el negocio | `blocked`: PDFs de muestra listos; falta el visto bueno del negocio |
| IG-21 | Firmante vinculada a la usuaria Adriana | `in-progress`: implementado; falta crear su usuario con la firma real |
| IG-22 | Anular y reemitir certificados | `in-progress`: implementado; la propuesta falta confirmarla con el negocio |
| IG-26 | Catálogo de productos y tipos de empaque | `in-progress`: implementado, en revisión |
| IG-35 | Catálogos de ciudades y actividades económicas | `in-progress`: implementado, en revisión |
| IG-36 | Empresa cliente con datos completos y tipos | `in-progress`: implementado; falta completar NIT/ciudad de los clientes migrados |
| IG-37 | Sedes del cliente | `in-progress`: implementado; la copia en el certificado llega con IG-39 |
| IG-38 | Contactos del cliente | `in-progress`: implementado; el alta rápida en el formulario llega con IG-39 |
| IG-40 | Transportador, conductor y vehículos | `in-progress`: implementado; los valores por defecto del movimiento llegan con IG-39 |
| IG-24 | Rol Super Administrador con acceso total | `done` |
| IG-25 | Matriz de permisos y rol `entrega` | `done` (matriz pendiente de validar con el negocio) |
| IG-29 | Gestión de usuarios por el Super Administrador | `done` |

## Hitos

| Hito | Estado |
|---|---|
| M1: Auth, empresas y clientes | `done` |
| M2: Pedidos y certificados | `done` |
| M3: Calidad (tipado, tests, CI) | `done` |
| M4: Despliegue público | `blocked` (IG-16) |

## Última actualización

- Fecha: 2026-10-27 (fase 3: datos maestros)
