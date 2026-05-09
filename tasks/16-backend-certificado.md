# Task: Generación de Certificados de Análisis en PDF

**Domain:** `[BACKEND]`
**Assigned Agent:** Backend Agent
**Status:** `pending`
**Created:** 2026-05-07
**Depends On:** —

---

## Context

Invergrasas SAS emite certificados de análisis fisicoquímico para sus dos productos principales: **Oleína de Palma** y **RBD** (Refinado, Blanqueado y Desodorizado). Actualmente estos documentos se generan manualmente en Word. El objetivo es automatizar la generación del PDF desde una API, dado un conjunto de parámetros que el usuario ingresa.

Cada tipo de producto tiene una estructura de parámetros diferente:

**Oleína de Palma:**
- Acidez (%)
- Humedad (%)
- Índice de Yodo (g I₂/100g)
- Peróxido (meq O₂ Kg)
- Punto de Nube (°C)  ← exclusivo de Oleína
- Color Celda 5¼" – Amarillo
- Color Celda 5¼" – Rojo

**RBD:**
- Acidez (%)
- Humedad (%)
- Índice de Yodo (g I₂/100g)
- Peróxido (meq O₂ Kg)
- Color Celda 5¼" – Amarillo
- Color Celda 5¼" – Rojo

El PDF generado debe replicar el formato del documento oficial de Invergrasas (encabezado con logo, tabla de especificaciones, firma de Adriana Rodriguez Urrea, pie de página con datos de contacto).

---

## Requirements

### Modelo `CertificadoAnalisis`
- `id` — uuid
- `tipo` — enum: `'oleina' | 'rbd'`
- `empresa_cliente` — string (nombre de la empresa destinataria)
- `nit_cliente` — string (opcional)
- `lote` — string (ej: `"19-0426"`)
- `peso_kg` — number | null (solo aplica para RBD, puede ser null en Oleína)
- `fecha_emision` — date (se asigna automáticamente con `new Date()` al momento de crear)
- `fecha_vencimiento` — date (recibida en el request)
- `firmado_por` — string (default: `"ADRIANA RODRIGUEZ URREA"`)
- `archivo_url` — string | null (ruta o URL del PDF generado)
- `created_at` — timestamp

### Modelo `ParametroAnalisis`
- `id` — uuid
- `certificado_id` — FK → CertificadoAnalisis
- `nombre` — string (ej: `"Acidez (%)"`)
- `valor` — string (se guarda como string para soportar decimales con coma y rangos)
- `orden` — number (para mantener el orden de filas en la tabla)

---

## Endpoint

### `POST /api/certificados/analisis`

**Body esperado:**
```json
{
  "tipo": "oleina" | "rbd",
  "empresa_cliente": "YOKO SNACKS",
  "nit_cliente": "901.486.714",
  "lote": "19-0426",
  "peso_kg": null,
  "fecha_vencimiento": "2027-04-21",
  "parametros": {
    "acidez": "0,07",
    "humedad": "0,06",
    "indice_yodo": "61,458",
    "peroxido": "0,30",
    "punto_nube": "5,9",
    "color_amarillo": "40,0",
    "color_rojo": "3,0"
  }
}
```

> Para RBD, `punto_nube` no se incluye. `peso_kg` sí se incluye.

**Response exitosa `201`:**
```json
{
  "id": "uuid",
  "archivo_url": "/static/certificados/cert-uuid.pdf",
  "fecha_emision": "2026-05-07",
  "mensaje": "Certificado generado correctamente"
}
```

---

## Lógica de generación del PDF

El PDF debe respetar el layout del documento oficial:

1. **Encabezado izquierdo:**
   - Ciudad y fecha de emisión (formato: `Bogotá D.C, [mes] [día] de [año]`) — generada automáticamente
   - Bloque destinatario: `Señores:`, nombre empresa en negrita, NIT, `Ciudad`

2. **Asunto:**
   - `CERTIFICADO ANÁLISIS - OLEINA DE PALMA` o `CERTIFICADO ANÁLISIS - RBD`

3. **Datos del lote:**
   - `Lote: [valor]`
   - `Peso: [valor] kilos` — solo si `tipo === 'rbd'` y `peso_kg` tiene valor

4. **Tabla de especificaciones fisicoquímicas:**
   - Dos columnas: `CARACTERÍSTICAS` | `RESULTADO`
   - Filas según `tipo`:
     - Oleína: Acidez, Humedad, Índice de Yodo, Peróxido, Punto de Nube, Color Amarillo, Color Rojo
     - RBD: Acidez, Humedad, Índice de Yodo, Peróxido, Color Amarillo, Color Rojo

5. **Fecha de vencimiento:** recibida en request, formato `DD-MM-YYYY`

6. **Cierre:**
   - `Cordialmente,`
   - Imagen de firma (asset estático)
   - `ADRIANA RODRIGUEZ URREA`
   - `INVERGRASAS SAS`

7. **Pie de página:**
   - INVERGRASAS SAS · NIT. 901.684.306-1 · CRA 78 # 41B – 20 SUR · invergrasas@gmail.com · CEL. 3124325472

8. **Logo:** esquina superior derecha (asset estático del logo Invergrasas)

Usar la librería `pdfmake` o `puppeteer` con una plantilla HTML. Se recomienda **puppeteer** para respetar fielmente el layout con estilos CSS.

---

## Validaciones

- `tipo` debe ser `'oleina'` o `'rbd'` — error 400 si no es válido
- `empresa_cliente` es obligatorio
- `lote` es obligatorio
- `fecha_vencimiento` es obligatorio y debe ser una fecha futura
- Para `tipo === 'oleina'`: `punto_nube` es obligatorio
- Para `tipo === 'rbd'`: `punto_nube` debe estar ausente o ser ignorado
- Todos los valores de parámetros deben ser strings numéricos válidos (aceptar coma como separador decimal)

---

## Acceptance Criteria

- [ ] El PDF generado es visualmente equivalente al documento Word original
- [ ] La fecha de emisión se genera automáticamente en el backend (no la envía el frontend)
- [ ] `punto_nube` solo aparece en la tabla cuando `tipo === 'oleina'`
- [ ] `Peso:` solo aparece cuando `tipo === 'rbd'` y `peso_kg` tiene valor
- [ ] El PDF se guarda en disco o storage y se retorna la URL
- [ ] Los parámetros se persisten en base de datos vinculados al certificado
- [ ] Validaciones retornan mensajes claros en español
- [ ] No se puede generar un certificado sin parámetros completos según el tipo

---

## Files to Create or Modify

```
backend/src/certificados/
  ├── certificado-analisis.entity.ts
  ├── parametro-analisis.entity.ts
  ├── certificados.module.ts
  ├── certificados.service.ts
  ├── certificados.controller.ts
  ├── dto/create-certificado.dto.ts
  └── dto/parametros-oleina.dto.ts
  └── dto/parametros-rbd.dto.ts

backend/src/utils/pdf/
  ├── analisis.template.html     ← plantilla puppeteer
  ├── analisis-pdf.service.ts
  └── assets/
      ├── logo-invergrasas.png
      └── firma-adriana.png

backend/test/certificados/
  └── certificados.service.spec.ts
```