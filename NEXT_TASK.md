# Próxima tarea

Las tareas de `tasks/` (01–16) y las de Jira IG-4 a IG-15 están completas; ver `memory/progress.md`.

**Fase 1 (usuarios y roles)** mergeada. **Fase 2 (certificados: IG-18, IG-19, IG-21, IG-22)** implementada, en revisión.

Pendiente con el negocio:

- IG-20: revisar los PDFs de oleína y RBD junto a un Word real con quien firma. Puntos que el código no puede decidir solo: día con o sin cero (`abril 05` / `abril 5`), tamaño del logo, fuente (Times) y bordes de la tabla.
- IG-21: crear el usuario de Adriana con su firma real y asignarla como firmante (`docs/PERMISOS.md`).
- IG-22: confirmar que anular + reemitir (en vez de editar) es lo que quiere el negocio.
- Validar la matriz de `docs/PERMISOS.md` y decidir qué pasa con el rol `empleado` y el registro público.

**Fases 1 a 3** mergeadas. **Fase 4 (entregas y recolecciones: IG-39, IG-27, IG-28, IG-30, IG-31, IG-32, IG-33)** implementada, en revisión. Los pedidos se migraron a movimientos ENTREGA (DEC-011).

Después del deploy:

- Subir la firma de cada conductor (rol entrega) en Usuarios.
- Cargar el saldo inicial de envases en los clientes (Inventario → Ajustar saldo).
- Completar NIT, ciudad y dirección de los clientes migrados, y crear a Invergrasas como Transportador y Destino con sus vehículos.

Pendiente con el negocio:

- IG-28: visto bueno del formato del PDF y del texto certificador de cada tipo (el super admin lo edita en Entregas → Textos del certificado).
- IG-20: formato del certificado de análisis.
- Qué pasa con el rol `empleado` y el registro público.

Siguiente fase: cierre (IG-42 dashboard con métricas reales; IG-41 liquidación, solo si el negocio la confirma).

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
