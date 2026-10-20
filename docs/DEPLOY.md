# Despliegue (IG-16)

## Decisión

| Pieza | Dónde | Por qué |
|---|---|---|
| Frontend Next.js 16 | Render, Web Service con Docker (`frontend/Dockerfile`, salida `standalone`) | Mismo proveedor que la API y la BD: un solo panel, una sola factura y red privada entre servicios. |
| Backend NestJS 11 | Render, Web Service con Docker (`backend/Dockerfile`) | Proceso Node de larga duración (GraphQL + generación de PDFs) con disco persistente para los certificados. |
| PostgreSQL 16 | Render Postgres gestionado | Backups diarios y conexión por `DATABASE_URL` sin administrar servidores. |
| PDFs de certificados | Disco persistente de Render montado en `/var/data` (`CERTIFICADOS_DIR=/var/data/certificados`) | Sobreviven a los redeploys y no se versionan en git (IG-13). |

Región `virginia` (la más cercana a Colombia entre las de Render).

Las imágenes Docker no dependen de Render. Si más adelante se cambia de proveedor (Railway, Fly.io, AWS, etc.), se reutilizan tal cual: solo hay que replicar las variables de entorno de abajo.

## Ambientes

| Ambiente | Blueprint | Rama | Servicios |
|---|---|---|---|
| Producción | `render.yaml` | `main` | `invergrasas-api`, `invergrasas-web`, `invergrasas-db` |
| Staging | `render.staging.yaml` | `staging` | los mismos, con sufijo `-staging` y BD propia |

Flujo: PR → CI verde (`.github/workflows/ci.yml`) → merge a `staging` → se despliega staging y se valida → merge de `staging` a `main` → se despliega producción.

## Variables de entorno y secretos

| Variable | Servicio | Valor |
|---|---|---|
| `DATABASE_URL` | API | Lo inyecta Render desde la BD (`fromDatabase`). |
| `JWT_SECRET` | API | Lo genera Render (`generateValue`). En producción la API **no arranca** sin él. |
| `FRONTEND_URL` | API | URL pública del frontend. En producción es el único origen permitido por CORS. |
| `CERTIFICADOS_DIR` | API | `/var/data/certificados` (disco persistente). |
| `PAGINATION_MAX_LIMIT` | API | Opcional; por defecto 100. |
| `NEXT_PUBLIC_API_URL` | Web | URL pública de la API. Se incrusta **en el build**, así que hay que redeployar el frontend si cambia. |

Los secretos viven solo en Render; ninguno se guarda en el repositorio (`.env` está en `.gitignore`).

## Migraciones

El contenedor de la API ejecuta `npx prisma migrate deploy` antes de `node dist/main`, así que cada deploy aplica las migraciones pendientes antes de recibir tráfico. Si una migración falla, el deploy falla y Render mantiene la versión anterior.

Antes de producción, toda migración pasa por staging.

## Primer despliegue (pasos manuales)

1. En Render: **New → Blueprint**, conectar el repo y elegir `render.yaml`. Repetir con `render.staging.yaml` después de crear la rama `staging`.
2. Completar las variables `sync: false`:
   - `FRONTEND_URL` en la API = URL del servicio web.
   - `NEXT_PUBLIC_API_URL` en el web = URL del servicio API.

   Con las URLs `*.onrender.com` basta para empezar.
3. Redeployar el web después de definir `NEXT_PUBLIC_API_URL`, porque se usa en el build.
4. Crear el primer usuario admin. El registro público solo crea empleados, así que:
   - registrarse en `/register`;
   - en el shell de la BD de Render, ejecutar `UPDATE users SET rol = 'admin' WHERE email = '...';`.

   Desde ahí, ese admin asigna roles con la mutation `updateUserRol`.

## Dominio

Pendiente de decisión del negocio. Propuesta:

- `invergrasas.com` → landing y dashboard (servicio web);
- `api.invergrasas.com` → API.

Se configuran en *Settings → Custom Domains* de cada servicio en Render, que emite el certificado TLS automáticamente. Al definirlos, actualizar `FRONTEND_URL` y `NEXT_PUBLIC_API_URL` y redeployar ambos servicios.

## Verificación local de las imágenes

```bash
docker build -t invergrasas-api backend
docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000 -t invergrasas-web frontend
docker run -p 4000:4000 -e DATABASE_URL=... -e JWT_SECRET=... -e FRONTEND_URL=http://localhost:3000 invergrasas-api
docker run -p 3000:3000 invergrasas-web
```
