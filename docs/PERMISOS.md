# Roles y permisos (IG-24, IG-25)

La matriz vive en `backend/src/auth/roles.ts` (`PERMISOS`) y se aplica con `@Permiso('modulo', 'accion')` + `RolesGuard`. El frontend tiene una copia en `frontend/src/lib/permisos.ts`, solo para ocultar menús y botones: quien decide es la API. **Si cambia la matriz, hay que cambiar los dos archivos y esta tabla.**

## Roles

| Rol | Para quién |
|---|---|
| `super_admin` | Dueño del sistema. Puede todo, en todas las empresas. Es el único que gestiona usuarios, roles y empresas asignadas. |
| `admin` | Administración. Ve todas las empresas, edita empresas, clientes y pedidos, y genera certificados. |
| `comercial` | Clientes y pedidos de sus empresas; ve y descarga certificados. |
| `calidad` | Genera y ve certificados de sus empresas. |
| `entrega` | Trabajadores que entregan el producto y recogen envases. Hoy ve clientes; creará entregas/recolecciones con IG-39. |
| `empleado` | Rol anterior; se mantiene hasta que los pedidos pasen a entregas (IG-39). Es el rol del registro público. |

`super_admin` no aparece en la matriz: `puede()` lo deja pasar siempre, también en los filtros por empresa.

## Matriz implementada

| Módulo · acción | super_admin | admin | comercial | calidad | entrega | empleado |
|---|---|---|---|---|---|---|
| usuarios · gestionar (usuarios, roles, empresas asignadas) | ✔ | | | | | |
| empresas · leer (sus empresas, p. ej. para elegir la activa) | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| empresas · accesoTotal (todas, sin vínculo) | ✔ | ✔ | | | | |
| empresas · crear | ✔ | | | | | |
| empresas · editar | ✔ | ✔ | | | | |
| clientes · leer | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| clientes · leerTodos (de todas las empresas) | ✔ | ✔ | | | | |
| clientes · escribir | ✔ | ✔ | ✔ | | | |
| pedidos · leer | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| pedidos · escribir | ✔ | ✔ | ✔ | | | ✔ |
| certificados · leer | ✔ | ✔ | ✔ | ✔ | | |
| certificados · escribir | ✔ | ✔ | | ✔ | | |
| certificados · anular | ✔ | ✔ | | ✔ | | |
| certificados · configurarFirmante | ✔ | | | | | |

Además de la matriz, los datos de una empresa solo se ven si el usuario está vinculado a ella (`UserEmpresa`), salvo los roles con `empresas · accesoTotal`.

## Propuesta de IG-25 pendiente de validar con el negocio

| Módulo | super_admin | admin | calidad | comercial | entrega |
|---|---|---|---|---|---|
| Usuarios y roles | Todo | — | — | — | — |
| Empresas | Todo | Ver/editar | Ver | Ver | — |
| Clientes | Todo | Todo | Ver | Todo | Ver |
| Productos y empaques | Todo | Todo | Ver | Ver | Ver |
| Certificados de análisis | Todo | Generar/ver | Generar/ver | Ver/descargar | — |
| Entregas y recolecciones | Todo + anular | Ver | — | Ver | Crear/ver las suyas |
| Inventario de envases | Todo | Ver | — | Ver | Ver |
| Informes Excel | Todo | Sí | — | Sí | — |

Diferencias con lo implementado y por qué:

- **Empresas "—" para entrega:** se interpreta como "no entra al módulo Empresas". Igual puede listar *sus* empresas (`empresas · leer`), porque el resto de pantallas las necesita para elegir la empresa activa.
- **Productos, entregas, inventario e informes:** los módulos aún no existen. Se agregan a `PERMISOS` cuando se construyan (IG-26, IG-39, IG-31, IG-33).
- **Pedidos:** no están en la propuesta porque IG-39 los reemplaza por entregas. Mientras tanto mantienen los permisos que tenían.
- **`empleado`:** no está en la propuesta. Falta decidir si los empleados existentes pasan a `entrega` u otro rol y si se elimina.

## Gestión de usuarios (IG-29)

- Módulo `/dashboard/usuarios`, solo para `super_admin`.
- Crear, editar (datos, rol, empresas asignadas, firma), desactivar/reactivar y restablecer contraseña.
- Desactivar es borrado lógico: el usuario no puede iniciar sesión y su token deja de valer en la siguiente petición.
- Los usuarios creados por el super admin (y los de contraseña restablecida) deben cambiarla en el siguiente ingreso.
- No se puede desactivar ni degradar al último `super_admin` activo, ni desactivarse a uno mismo.
- Los cambios de rol, altas, bajas y restablecimientos de contraseña quedan en `audit_logs`.

## Firmante de los certificados (IG-21)

Todos los certificados de análisis los firma una sola persona (hoy, Adriana Rodríguez Urrea). Es un usuario del sistema con imagen de firma:

1. En **Usuarios**, crear (o editar) su usuario y subir la imagen de la firma.
2. En **Certificados**, el super admin pulsa **Asignar** / **Cambiar** en «Firmante de los certificados».

Mientras no haya firmante, no se pueden generar certificados. Cada certificado guarda quién lo firmó (`firmante_id` y el nombre en `firmado_por`), así que cambiar la firmante o sus datos no altera los ya emitidos.

## Primer Super Administrador

Con las credenciales en variables de entorno (nunca en el código):

```bash
# backend/, con DATABASE_URL apuntando a la BD
SUPER_ADMIN_EMAIL=... SUPER_ADMIN_PASSWORD=... npm run super-admin       # build (dist/)
SUPER_ADMIN_EMAIL=... SUPER_ADMIN_PASSWORD=... npm run super-admin:dev   # desarrollo
```

Si el correo ya existe, lo promueve a `super_admin` y lo reactiva sin cambiar su contraseña. Si no, lo crea y le pide cambiar la contraseña al ingresar.
