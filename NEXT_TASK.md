# Próxima tarea

Fases 1 a 4 mergeadas (usuarios y roles, certificados de análisis, datos maestros, entregas y recolecciones). **IG-42 (dashboard con métricas reales)** implementado, en revisión (DEC-012). Estado de cada tarea en `memory/progress.md`.

Siguiente, solo si el negocio la confirma: **IG-41 (liquidación)**.

## Despliegue

**IG-16: poner la plataforma en una URL pública.** La configuración está lista (`render.yaml`, `render.staging.yaml`, Dockerfiles). Falta:

1. Crear la cuenta / Blueprints en Render.
2. Definir `FRONTEND_URL` y `NEXT_PUBLIC_API_URL`.
3. Elegir el dominio.

Pasos en `docs/DEPLOY.md`.

Después del deploy:

- Crear el usuario de Adriana con su firma real y asignarla como firmante de certificados (`docs/PERMISOS.md`).
- Subir la firma de cada conductor (rol entrega) en Usuarios.
- Cargar el saldo inicial de envases en los clientes (Inventario → Ajustar saldo).
- Completar NIT, ciudad y dirección de los clientes migrados, y crear a Invergrasas como Transportador y Destino con sus vehículos.

## Pendiente con el negocio

- IG-20: revisar los PDFs de oleína y RBD junto a un Word real con quien firma: día con o sin cero (`abril 05` / `abril 5`), tamaño del logo, fuente (Times) y bordes de la tabla.
- IG-22: confirmar que anular + reemitir (en vez de editar) es lo que quiere el negocio.
- IG-28: visto bueno del formato del PDF y del texto certificador de cada tipo (el super admin lo edita en Entregas → Textos del certificado).
- IG-25: validar la matriz de `docs/PERMISOS.md` y decidir qué pasa con el rol `empleado` y el registro público.
- IG-42: si los kg entregados deben incluir la oleína registrada en galones, definir la densidad de conversión por producto.

## Después (sin tarea de Jira todavía)

- Decidir si se limpia el historial de git de PDFs con datos de clientes.
