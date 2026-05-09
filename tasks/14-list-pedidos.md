# Task: List and Filter Pedidos

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `done`
**Created:** 2026-05-06
**Depends On:** `tasks/13-create-pedido.md`

## Context
Users need to view the list of orders (Pedidos) associated with their companies. The list must be filterable by date range, client, and product type.

## Requirements
- [x] `GET /api/pedidos` endpoint to list orders.
- [x] The endpoint is protected by JWT Auth Guard.
- [x] Implement query parameters for filtering: `fecha_inicio`, `fecha_fin`, `cliente_id`, `producto`.
- [x] Ensure users can only see orders for companies (Empresas) they are associated with (via UserEmpresa).
- [x] Endpoint returns `200 OK` with an array of matching orders, including partial relations (like Client name).

## Acceptance Criteria
- [x] Given proper filters, the API returns only matching `Pedidos`.
- [x] If no filters are provided, returns all allowed orders for the user's companies.
- [x] Users cannot see orders belonging to companies they are not assigned to.
- [x] Unauthenticated requests return `401 Unauthorized`.
- [x] Unit tests cover `PedidosService` filtering and permission logic.
- [x] E2E tests for the list/filter endpoint.

## Files to Create or Modify
- `backend/src/pedidos/dto/filter-pedido.dto.ts` (optional)
- `backend/src/pedidos/pedidos.controller.ts`
- `backend/src/pedidos/pedidos.service.ts`
- `backend/src/pedidos/pedidos.service.spec.ts`
- `backend/test/pedidos/list.e2e-spec.ts`
