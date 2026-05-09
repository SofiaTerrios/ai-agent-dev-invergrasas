# Task: UI para Generación de Certificados de Análisis

**Domain:** `[FRONTEND]`
**Assigned Agent:** Frontend Agent
**Status:** `pending`
**Created:** 2026-05-07
**Depends On:** `task-backend-certificados.md`

---

## Context

Invergrasas SAS necesita una pantalla dentro de su sistema web interno para que el equipo comercial pueda generar certificados de análisis fisicoquímico en PDF de forma ágil, sin necesidad de editar un Word manualmente.

El flujo es guiado paso a paso:
1. El usuario elige el tipo de certificado (Oleína o RBD)
2. Ingresa los datos del cliente destinatario
3. Ingresa el lote y, si aplica, el peso
4. Ingresa los valores de las especificaciones fisicoquímicas
5. Ingresa la fecha de vencimiento
6. Genera el PDF y lo descarga o previsualiza

---

## UI Flow — Paso a paso

### Paso 1 — Tipo de certificado
Mostrar dos tarjetas o botones grandes de selección:

```
┌─────────────────┐   ┌─────────────────┐
│  🟡 Oleína      │   │  🟠 RBD         │
│  de Palma       │   │  Refinado       │
└─────────────────┘   └─────────────────┘
```

- Al seleccionar uno, resaltarlo visualmente y habilitar el botón "Continuar"
- El tipo seleccionado determina qué campos de parámetros se muestran más adelante

---

### Paso 2 — Datos del cliente
Campos:
- `empresa_cliente` — input texto, label: "Nombre de la empresa" — **requerido**
- `nit_cliente` — input texto, label: "NIT" — opcional

---

### Paso 3 — Datos del lote
Campos:
- `lote` — input texto, label: "Número de lote" (ej: `19-0426`) — **requerido**
- `peso_kg` — input número, label: "Peso (kg)" — solo visible si `tipo === 'rbd'`, opcional

---

### Paso 4 — Especificaciones fisicoquímicas

Mostrar un formulario con los campos que correspondan al tipo seleccionado:

**Si tipo === 'oleina'** — mostrar estos campos en orden:
| Label en UI | Campo API | Ejemplo |
|---|---|---|
| Acidez (%) | `acidez` | 0,07 |
| Humedad (%) | `humedad` | 0,06 |
| Índice de Yodo (g I₂/100g) | `indice_yodo` | 61,458 |
| Peróxido (meq O₂ Kg) | `peroxido` | 0,30 |
| Punto de Nube (°C) | `punto_nube` | 5,9 |
| Color Celda 5¼" – Amarillo | `color_amarillo` | 40,0 |
| Color Celda 5¼" – Rojo | `color_rojo` | 3,0 |

**Si tipo === 'rbd'** — mostrar estos campos en orden (sin `punto_nube`):
| Label en UI | Campo API | Ejemplo |
|---|---|---|
| Acidez (%) | `acidez` | 0,04 |
| Humedad (%) | `humedad` | 0,06 |
| Índice de Yodo (g I₂/100g) | `indice_yodo` | 53,654 |
| Peróxido (meq O₂ Kg) | `peroxido` | 0,20 |
| Color Celda 5¼" – Amarillo | `color_amarillo` | 40,0 |
| Color Celda 5¼" – Rojo | `color_rojo` | 3,0 |

> Todos los campos de parámetros son **requeridos**.
> Aceptar tanto punto como coma como separador decimal (normalizar antes de enviar).

---

### Paso 5 — Fecha de vencimiento
- `fecha_vencimiento` — date picker, label: "Fecha de vencimiento del producto"
- Debe ser una fecha futura — mostrar error si es pasada
- **requerido**

> La fecha de emisión (la del documento) NO se pide al usuario. La genera el backend automáticamente.

---

### Paso 6 — Confirmación y generación
Mostrar un resumen de los datos antes de generar:
- Tipo de certificado
- Empresa cliente + NIT
- Lote (y peso si aplica)
- Tabla con parámetros ingresados
- Fecha de vencimiento

Botón principal: **"Generar Certificado PDF"**

Al hacer clic:
- Mostrar estado de carga (spinner / skeleton)
- Llamar a `POST /api/certificados/analisis`
- Si exitoso: mostrar botón "Descargar PDF" que abra `archivo_url` en nueva pestaña
- Si error: mostrar mensaje de error descriptivo en español

---

## Comportamiento esperado

- El formulario es multi-step (puede ser wizard con stepper visual o scroll guiado)
- Cada paso valida antes de avanzar al siguiente
- El usuario puede regresar a pasos anteriores para editar
- Si cambia el tipo de certificado en el paso 1, los campos de parámetros del paso 4 se resetean
- Los valores de parámetros deben aceptar coma (`,`) o punto (`.`) como separador decimal; normalizar a coma al mostrar y a punto al enviar al API

---

## Componentes a crear

```
src/app/(dashboard)/certificados/
  ├── page.tsx                          ← página principal
  ├── components/
  │   ├── StepTipoCertificado.tsx       ← paso 1: tarjetas Oleína / RBD
  │   ├── StepDatosCliente.tsx          ← paso 2: empresa y NIT
  │   ├── StepDatosLote.tsx             ← paso 3: lote y peso
  │   ├── StepParametros.tsx            ← paso 4: formulario dinámico según tipo
  │   ├── StepFechaVencimiento.tsx      ← paso 5: date picker
  │   ├── StepResumen.tsx               ← paso 6: resumen + botón generar
  │   └── CertificadoStepper.tsx        ← stepper visual de navegación
  └── hooks/
      └── useCertificadoForm.ts         ← estado global del wizard
```

---

## Contrato con el API

### Request
```typescript
interface CreateCertificadoDto {
  tipo: 'oleina' | 'rbd';
  empresa_cliente: string;
  nit_cliente?: string;
  lote: string;
  peso_kg?: number | null;
  fecha_vencimiento: string; // formato ISO: "2027-04-21"
  parametros: {
    acidez: string;
    humedad: string;
    indice_yodo: string;
    peroxido: string;
    punto_nube?: string; // solo oleina
    color_amarillo: string;
    color_rojo: string;
  };
}
```

### Response exitosa
```typescript
interface CertificadoResponse {
  id: string;
  archivo_url: string;
  fecha_emision: string;
  mensaje: string;
}
```

### Response de error
```typescript
interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
```

---

## Acceptance Criteria

- [ ] Paso 1 muestra claramente las dos opciones y solo avanza al seleccionar una
- [ ] Paso 4 muestra `Punto de Nube` solo si el tipo es Oleína
- [ ] Paso 3 muestra `Peso (kg)` solo si el tipo es RBD
- [ ] Todos los campos requeridos tienen validación en el cliente antes de enviar
- [ ] La fecha de vencimiento no puede ser pasada
- [ ] Al generar exitosamente, el PDF se puede descargar sin recargar la página
- [ ] Si el API retorna error, se muestra el mensaje al usuario de forma legible
- [ ] El estado de carga bloquea el botón de generar para evitar doble submit
- [ ] Si el usuario cambia el tipo de certificado, los parámetros del paso 4 se limpian
- [ ] El formulario es usable en pantallas de escritorio (mínimo 1280px) — es sistema interno