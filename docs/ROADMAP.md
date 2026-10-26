# Roadmap — Invergrasas

Plataforma interna de Invergrasas para gestionar empresas, clientes, pedidos/entregas y certificados de análisis de calidad de sus productos (oleína de palma, RBD y aceites refinados), más una landing pública.

Seguimiento en Jira: proyecto **IG** (https://motoapp.atlassian.net). Épicas: IG-1 (reglas de arquitectura del backend), IG-2 (módulo de Pedidos en el frontend), IG-3 (repositorio, documentación y DevOps).

Estado: ✅ hecho · 🟡 en curso / parcial · ⬜ pendiente

## Fase 1 — Base del proyecto ✅
- ✅ Estructura frontend (Next.js) + backend (NestJS + Prisma/PostgreSQL) — `tasks/01-project-setup.md`
- ✅ Landing pública — `tasks/01-fronted-landing-page.md`

## Fase 2 — Autenticación y roles ✅
- ✅ Registro y login con JWT — `tasks/02-authentication.md`, `03-user-registration.md`, `04-user-login.md`
- ✅ Pantallas de login / registro — `tasks/02-frontend-auth.md`
- ✅ RBAC por módulo: admin, comercial, calidad, empleado — IG-7

## Fase 3 — Empresas y clientes ✅
- ✅ CRUD de empresas y asociación usuario–empresa — tareas 05 a 08
- ✅ CRUD de clientes por empresa — tareas 09 a 12
- ✅ Multi-tenancy por empresa — IG-5
- ✅ Borrado lógico (`deleted_at`) — IG-4
- ✅ Paginación por cursor en todos los listados — IG-6

## Fase 4 — Pedidos / entregas ✅
- ✅ API de pedidos: crear, listar con filtros, editar — tareas 13 a 15
- ✅ Pantalla de pedidos con filtros y empresa activa — IG-10
- ✅ Crear y editar pedidos desde el dashboard — IG-11, IG-12
- ⬜ N.º de recibo y unidades por pedido (requiere campos nuevos en `Pedido`)

## Fase 5 — Certificados de análisis ✅
- ✅ Generación de certificados en PDF (oleína y RBD) — `tasks/16-backend-certificado.md`
- ✅ Asistente de creación en el dashboard — `tasks/04-fronted-certificado.md`
- ✅ Certificados por empresa y descarga autenticada — IG-5
- ⬜ Listado / historial de certificados en el frontend (la API ya existe)

## Fase 6 — Calidad del código ✅
- ✅ Cero `any` y lint sin errores — IG-8
- ✅ Retiro de TypeORM y dependencias sobrantes — IG-9
- ✅ Tests unitarios y e2e contra PostgreSQL

## Fase 7 — DevOps 🟡
- ✅ PDFs generados y archivos de build fuera de git — IG-13
- ✅ CI en GitHub Actions — IG-15
- 🟡 Despliegue en Render con staging y producción (configuración lista; falta crear los servicios y el dominio) — IG-16, ver `docs/DEPLOY.md`
- ⬜ Limpiar del historial de git los PDFs con datos de clientes (decisión pendiente)

## Pendientes conocidos
- Error de hidratación de React (#418) en `DashboardLayout`.
- `clientesByEmpresa` no valida que el usuario pertenezca a la empresa.
- El sidebar muestra Empresas/Clientes solo al admin, aunque `comercial` ya puede gestionar clientes.
- Tests automatizados del frontend.
