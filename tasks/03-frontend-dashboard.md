# Task: Frontend - Dashboard UI

**Domain:** `[FRONTEND]`
**Assigned Agent:** Frontend Agent
**Status:** `pending`
**Created:** 2026-05-06
**Depends On:** `tasks/02-frontend-auth.md`, `tasks/01-project-setup.md`

## Context
Diseñar y construir el `Dashboard` principal para la aplicación: un layout limpio y profesional que muestre resumen de ventas/entregas, acceso rápido a pedidos, y el hero slider en la parte superior. Debe usar los colores y tokens ya definidos por el proyecto y componentes reutilizables.

## Requirements
- [ ] `Dashboard` page: layout con `Header`, `Sidebar` (opcional en móvil), `Hero` (slider ya existente), `Stats` (cards), `Orders` (tabla con filtros) y `Activity` (lista o timeline).
- [ ] Componentes reutilizables: `Header`, `Sidebar`, `StatsCard`, `OrdersTable`, `FiltersPanel`, `HeroSlider` (si no existe, refactorizar la implementación actual a `components/dashboard/HeroSlider.tsx`).
- [ ] Responsive: en móvil el sidebar debe colapsar y el contenido principal debe priorizarse.
- [ ] Usar los tokens de color/espaciado del proyecto (Tailwind) y mantener consistencia tipográfica.
- [ ] Conectar `OrdersTable` con el endpoint `GET /api/pedidos` (usar fetch/axios); si backend no está disponible, implementar mock-data utilizable en desarrollo.
- [ ] Accesibilidad: tablas con encabezados, botones con aria-labels, foco visible.

## Acceptance Criteria
- [ ] Dashboard se ve consistente con el resto del sitio y usa los colores del proyecto.
- [ ] Los componentes son reutilizables y están dentro de `frontend/src/components/dashboard/` o `frontend/src/components/ui/` según corresponda.
- [ ] OrdersTable muestra datos (mock o reales) y permite filtrar por fecha/cliente/producto.

## Files to Create or Modify
- `frontend/src/app/dashboard/page.tsx`
- `frontend/src/components/layouts/DashboardLayout.tsx`
- `frontend/src/components/dashboard/HeroSlider.tsx`
- `frontend/src/components/dashboard/StatsCard.tsx`
- `frontend/src/components/dashboard/OrdersTable.tsx`
- `frontend/src/components/dashboard/FiltersPanel.tsx`
- `frontend/src/components/ui/Table.tsx` (si no existe)

## Notes
- Colocar componentes en carpetas claras: `components/dashboard/`, `components/ui/`, `components/layouts/`.
- Mantener consistencia con `Auth` styles y `Hero` existente.
