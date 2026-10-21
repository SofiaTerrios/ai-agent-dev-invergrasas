# Task: Create Pedido (Entrega)

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `done`
**Created:** 2026-05-06
**Depends On:** `tasks/09-create-cliente.md`

## Context
Invergrasas needs to register orders/deliveries (Pedidos) that belong to a specific company (Empresa) and client (Cliente). A user creates the order.

## Requirements
- [x] Create `Pedido` TypeORM entity with fields:
  - `id` (uuid)
  - `empresa_id` (ManyToOne -> Empresa)
  - `cliente_id` (ManyToOne -> Cliente)
  - `producto` (Enum: 'RBD', 'Oleina')
  - `tipo_empaque` (Enum: 'Granel', 'Caneca', 'Balde')
  - `cantidad_kg` (numeric/decimal)
  - `fecha` (datetime or date)
  - `creado_por` (ManyToOne -> User, represents user_id)
- [x] `POST /api/pedidos` endpoint accepts the required fields.
- [x] Endpoint is protected by JWT Auth Guard.
- [x] Validates that the provided `empresa_id` and `cliente_id` exist.
- [x] Sets `creado_por` automatically based on the authenticated user's ID.
- [x] Endpoint returns `201 Created` with the created pedido data.

## Acceptance Criteria
- [x] `POST /api/pedidos` creates a new order in the database.
- [x] Attempting to create an order with non-existent entities returns `404 Not Found`.
- [x] Invalid enums for `producto` or `tipo_empaque` return `400 Bad Request`.
- [x] Unauthenticated requests return `401 Unauthorized`.
- [x] Unit tests cover `PedidosService` creation logic.
- [x] E2E tests for the create pedido endpoint.

## Files to Create or Modify
- `backend/src/pedidos/entities/pedido.entity.ts`
- `backend/src/pedidos/dto/create-pedido.dto.ts`
- `backend/src/pedidos/pedidos.controller.ts`
- `backend/src/pedidos/pedidos.service.ts`
- `backend/src/pedidos/pedidos.module.ts`
- `backend/src/pedidos/pedidos.service.spec.ts`
- `backend/test/pedidos/create.e2e-spec.ts`

## Estado actual (2026-10-20)

- Expuesto como la mutation GraphQL `createPedido` (no hay `POST /api/pedidos`).
- Valida que el usuario pertenezca a la empresa y que el cliente sea de esa empresa.
- UI de creación: IG-11.
