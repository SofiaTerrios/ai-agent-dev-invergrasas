# Invergrasas — Frontend

Next.js 16 (App Router) con TailwindCSS 4: landing pública y dashboard interno.

```bash
npm ci
NEXT_PUBLIC_API_URL=http://localhost:4000 npm run dev   # http://localhost:3000
npm run lint
npx tsc --noEmit
npm run build                                           # salida standalone (Docker)
```

| Ruta | Contenido |
|---|---|
| `/` | Landing pública |
| `/login`, `/register` | Autenticación |
| `/dashboard` | Resumen y pedidos recientes |
| `/dashboard/pedidos` | Pedidos: listado, filtros, crear y editar |
| `/dashboard/certificados` | Asistente de certificados de análisis |
| `/dashboard/empresas`, `/dashboard/clientes` | Administración (admin) |

`NEXT_PUBLIC_API_URL` se incrusta en el build: si cambia, hay que volver a construir.

Arquitectura general en `../docs/ARCHITECTURE.md`.
