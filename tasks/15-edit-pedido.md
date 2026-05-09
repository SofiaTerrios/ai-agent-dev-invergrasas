# Task: Edit Pedido

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `pending`
**Created:** 2026-05-06
**Depends On:** `tasks/13-create-pedido.md`

## Context
There may be mistakes in data entry for an order (e.g. wrong quantity or date). Users need the ability to edit existing orders.

## Requirements
- [ ] `PUT /api/pedidos/:id` endpoint to partially update a pedido.
- [ ] The endpoint is protected by JWT Auth Guard.
- [ ] Accepts partial data: `cantidad_kg`, `fecha`, `producto`, `tipo_empaque`, etc.
- [ ] Validate that the user is authorized to edit it (either admin, or the company belongs to the user).
- [ ] Endpoint returns `200 OK` with the updated order data.

## Acceptance Criteria
- [ ] Existing `Pedido` details are properly updated.
- [ ] Changing `cantidad_kg` or enums to invalid values returns `400 Bad Request`.
- [ ] Updating a non-existent order returns `404 Not Found`.
- [ ] Unauthenticated requests return `401 Unauthorized`.
- [ ] Unit tests cover `PedidosService` update logic.
- [ ] E2E tests evaluate proper modification.

## Files to Create or Modify
- `backend/src/pedidos/dto/update-pedido.dto.ts`
- `backend/src/pedidos/pedidos.controller.ts`
- `backend/src/pedidos/pedidos.service.ts`
- `backend/src/pedidos/pedidos.service.spec.ts`
- `backend/test/pedidos/update.e2e-spec.ts`
