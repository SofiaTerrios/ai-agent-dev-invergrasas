# Contexto del proyecto

Todo agente (humano o IA) debe leer este archivo antes de empezar una tarea.

## Proyecto

**Invergrasas**: sitio público y plataforma interna de operaciones.

## Negocio

Invergrasas produce y comercializa grasas y aceites vegetales para la industria alimentaria:

- oleína de palma;
- RBD (aceite de palma refinado, blanqueado y desodorizado);
- otros aceites refinados.

Despacha a clientes industriales a granel, en caneca o en balde. Con cada lote emite un **certificado de análisis** con los parámetros de calidad, que firma el área de calidad.

## Objetivos

- Landing pública que presente la empresa y sus productos.
- Registrar los pedidos/entregas despachados a cada cliente y hacerles seguimiento.
- Generar certificados de análisis en PDF de forma consistente y trazable.
- Separar la información por empresa (una instalación puede manejar varias razones sociales) y por rol.

## Usuarios

| Rol | Qué hace |
|---|---|
| `admin` | Gestiona empresas, usuarios y roles; acceso total. |
| `comercial` | Gestiona clientes y pedidos; consulta certificados. |
| `calidad` | Genera y consulta certificados de análisis. |
| `empleado` | Registra y consulta pedidos de sus empresas. |

## Stack

Next.js 16 + NestJS 11 + GraphQL + Prisma 6/PostgreSQL 16 + pdfkit. Detalle en `docs/ARCHITECTURE.md`.

## Restricciones

- Toda la API requiere autenticación, salvo registro y login.
- Un usuario solo ve datos de las empresas a las que está asociado (los admin ven todas).
- Nunca se borran filas: se usa borrado lógico (`deleted_at`).
- Los PDFs generados no se versionan en git: pueden contener datos de clientes.
- Cero `any`; lint, typecheck y tests deben pasar en CI.

## Convenciones

- Ramas: `feature/IG-<n>-<descripcion>`.
- Commits: Conventional Commits con la clave de Jira, p. ej. `feat(IG-10): ...`.
- Nombres de dominio en español (`empresa`, `pedido`, `certificado`); columnas en `snake_case`.

## Última actualización

- Fecha: 2026-10-20 (IG-14)
