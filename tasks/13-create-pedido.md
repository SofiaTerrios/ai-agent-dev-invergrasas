# Task: Create Pedido (Entrega)

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `pending`
**Created:** 2026-05-06
**Depends On:** `tasks/09-create-cliente.md`

## Context
Invergrasas needs to register orders/deliveries (Pedidos) that belong to a specific company (Empresa) and client (Cliente). A user creates the order.

## Requirements
- [ ] Create `Pedido` TypeORM entity with fields:
  - `id` (uuid)
  - `empresa_id` (ManyToOne -> Empresa)
  - `cliente_id` (ManyToOne -> Cliente)
  - `producto` (Enum: 'RBD', 'Oleina')
  - `tipo_empaque` (Enum: 'Granel', 'Caneca', 'Balde')
  - `cantidad_kg` (numeric/decimal)
  - `fecha` (datetime or date)
  - `creado_por` (ManyToOne -> User, represents user_id)
- [ ] `POST /api/pedidos` endpoint accepts the required fields.
- [ ] Endpoint is protected by JWT Auth Guard.
- [ ] Validates that the provided `empresa_id` and `cliente_id` exist.
- [ ] Sets `creado_por` automatically based on the authenticated user's ID.
- [ ] Endpoint returns `201 Created` with the created pedido data.

## Acceptance Criteria
- [ ] `POST /api/pedidos` creates a new order in the database.
- [ ] Attempting to create an order with non-existent entities returns `404 Not Found`.
- [ ] Invalid enums for `producto` or `tipo_empaque` return `400 Bad Request`.
- [ ] Unauthenticated requests return `401 Unauthorized`.
- [ ] Unit tests cover `PedidosService` creation logic.
- [ ] E2E tests for the create pedido endpoint.

## Files to Create or Modify
- `backend/src/pedidos/entities/pedido.entity.ts`
- `backend/src/pedidos/dto/create-pedido.dto.ts`
- `backend/src/pedidos/pedidos.controller.ts`
- `backend/src/pedidos/pedidos.service.ts`
- `backend/src/pedidos/pedidos.module.ts`
- `backend/src/pedidos/pedidos.service.spec.ts`
- `backend/test/pedidos/create.e2e-spec.ts`
