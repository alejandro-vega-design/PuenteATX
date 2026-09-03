# Auditoría de recursos — 2026-09-02

Ejecutada con el skill `prepare-puente-resources` (validador vivo contra
`src/data/csvImport.js`).

## Alcance y límite importante

**Lo que se auditó:** los 8 archivos en formato importador dentro de
`resource-lists-import/` — es decir, las **fuentes de importación**, no la base
de datos. 479 filas en total.

**Lo que NO se pudo auditar:** la tabla `resources` viva en Supabase. Este
entorno no tiene `.env` con credenciales y el skill prohíbe conectarse a
producción. Para auditar el estado real de la base de datos hace falta un
export (ver §5).

Aun así, esta auditoría de fuentes explica **por qué** aparecen duplicados y
triplicados, y da la lista concreta de casos a revisar.

---

## 1. Causa raíz de los duplicados

El importador ([src/data/csvImport.js:96](../../src/data/csvImport.js#L96)
`findExistingResource`) reconoce un recurso existente **solo** por:

1. `slug` idéntico, o
2. `organization_name` normalizado **+** `title_es` **o** `title_en` idénticos.

Si ninguno coincide, **crea un registro nuevo**. No hay coincidencia difusa.

Dos patrones en las fuentes rompen esto de forma sistemática:

### a) `slug` vacío en casi todas las filas

| Archivo | filas | `slug` vacío |
|---|--:|--:|
| avey-healthcare-catalog | 17 | 11 |
| bastrop-travis-no-austin-consolidated | 116 | 116 |
| counseling-resources-austin | 6 | 3 |
| veteranos-adultos-mayores | 45 | 45 |
| williamson-county-recursos-import-ready | 39 | (varias) |

Sin `slug`, cualquier reimportación depende de que el nombre de organización y
el título coincidan **carácter por carácter** (tras normalizar acentos y
espacios). Basta un cambio de redacción para duplicar.

### b) El mismo servicio con nombre de organización distinto en cada lista

Ejemplos reales encontrados (misma organización, mismo teléfono/website,
`organization_name` distinto → el importador los trata como entidades
diferentes):

| Servicio | Variantes de `organization_name` encontradas |
|---|---|
| CARTS (transporte rural) | `Capital Area Rural Transportation System (CARTS)` · `CARTS` · `CARTS, en contrato con la Ciudad de Smithville` · `CARTS, en coordinación con Capital Metro` |
| Drive a Senior | `Drive a Senior Central Texas` · `Drive a Senior Central Texas (antes "Senior Access")` · `Senior Access` |
| Lone Star Circle of Care | `Lone Star Circle of Care` · `Lone Star Circle of Care (LSCC)` |
| Central Texas Food Bank | `Central Texas Food Bank` · `Central Texas Food Bank (programa Golden Harvest)` · `Central Texas Food Bank and SNAP Assistance` · `Central Texas Food Bank / Del Valle ISD` |
| SAFE Alliance | `The SAFE Alliance` · `Safe Alliance` |
| Housing Authority of Travis County | `Housing Authority of Travis County` · `Housing Authority for Travis County (HATC)` |
| Bastrop Community Senior Center | `Bastrop Community Senior Center` (título ES: `…de Adultos Mayores…` vs `…de Ancianos…`) |
| VA Central Texas | `U.S. Department of Veterans Affairs (VHA)` · `U.S. Department of Veterans Affairs (VA Central Texas)` |

**El formato sugerido dice:** organización oficial en `organization_name`, el
nombre del programa va en los títulos. Eso no se respetó — se metió el programa,
la sede, o el convenio dentro de `organization_name`.

---

## 2. Duplicados y triplicados detectados en las fuentes

### 2.1 Mismo teléfono, registro distinto (44 grupos) — triplicados marcados ⚠️

| Teléfono | Organizaciones / apariciones |
|---|---|
| 877-800-5722 | Lone Star Circle of Care — **8 filas** en 5 archivos ⚠️ |
| 512-478-7433 | CARTS — **7 filas**, 4 variantes de nombre ⚠️ |
| 512-282-2111 | Central Texas Food Bank — **5 filas**, 3 variantes ⚠️ |
| 844-309-6385 | Bluebonnet Trails Community Services — **5 filas** ⚠️ |
| 512-763-1400 | Opportunities for Williamson & Burnet Counties — **5 filas** ⚠️ |
| 512-259-0360 | Hill Country Community Ministries — 4 filas |
| 512-651-6100 | Catholic Charities of Central Texas — 4 filas |
| 512-474-1200 | CapMetro — 3 filas |
| 512-493-4288 | Austin Voices for Education and Youth — 3 filas (2 variantes de nombre) |
| 737-717-4000 | Foundation Communities — 3 filas |
| 512-978-9015 | CommUnityCare / Central Health / "CommUnityCare" — 3 filas, 3 nombres ⚠️ |
| 512-478-4939 | People's Community Clinic — 3 filas |
| 512-476-5550 | Volunteer Legal Services of Central Texas — 3 filas |
| 512-451-2242 | Austin Child Guidance Center — 3 filas |
| 512-643-2327 | Integral Care — 3 filas |
| 512-310-1060 | Drive a Senior / Senior Access — 3 filas, 3 nombres ⚠️ |
| … 28 grupos más de 2 filas | (lista completa en el JSON de auditoría) |

### 2.2 Mismo website, título distinto (41 grupos)

Casos donde una sola URL oficial se repartió en varias fichas con títulos
diferentes — algunos son legítimos (programas distintos), otros son la misma
ficha reescrita:

- `austintexas.gov/services/get-help-neighborhood-centers` → 4 centros vecinales distintos (probablemente legítimo, pero comparten página)
- `ridecarts.com` → 4 fichas de CARTS con 4 nombres de organización
- `vlsoct.org` → 3 fichas (`Servicios Legales Voluntarios…`, `Volunteer Legal Services…`, `…– Williamson County`)
- `lonestarcares.org` → `Servicios comunitarios de salud` vs `…Salud Conductual de Round Rock` vs `…de Georgetown`
- `hccm.org` → `Hill Country Community Ministries (HCCM)` vs `Alimentos y asistencia para necesidades básicas` vs `Hill Country Community Ministries`
- `elbuen.org` → `Apoyo comunitario para personas y familias` vs `Servicios de apoyo comunitario` (misma ficha, dos redacciones)
- `driveasenior.org` → 3 variantes
- lista completa (41) en el JSON

### 2.3 Coincidencia exacta org+título entre archivos (18 pares)

Estos **no** producen duplicado si se importan sin slug (el segundo hace match
con el primero y actualiza), pero indican trabajo repetido y riesgo si el
título se edita luego:

- Central Texas Food Bank / `Public benefits application assistance` — avey:4 + williamson-county-resources:3
- Central Health / `Medical Access Program (MAP)` — avey:5 + eviction:61
- Lone Star Circle of Care / `Community health services` — avey:11 + cmm:7
- Half Helen Foundation / `Community eye exams` — avey:15 + cmm:64
- Samaritan Center / `Mental health and wellness services` — complete-family:21 + counseling:4
- Capital Area Counseling / `Affordable counseling services` — counseling:3 + cmm:19
- Austin Child Guidance Center / `Child and family therapy` — counseling:7 + cmm:22
- Austin Public Library / `Enhanced library card` — eviction:72 + cmm:42
- Volunteer Legal Services / `…(VLSoCT)` — bastrop:52 + veteranos:32
- Bastrop Community Senior Center — bastrop:60 + veteranos:40

### 2.4 Duplicados dentro de un mismo archivo

- `bastrop-travis-no-austin-consolidated`: filas 2 y 44 (Bastrop County Emergency Food Pantry), 5 y 90 (Community Cupboard / Elgin Community Cupboard), 6 y 45 (Sacred Heart Elgin), 11-12-13 (Central Texas Food Bank móvil ×3), 29-33 + 98 (CARTS ×6), 99-101 (CapMetro ×3), 110-111 (St. Elizabeth)
- `resource-list-cmm-updated`: filas 9 y 10 (People's Community Clinic), 11 y 12 (clínicas de vacunación APH), 54 y 55 (Prosper Centers)
- `veteranos-adultos-mayores`: 22 y 36 (OWBC), 30 y 44 (Drive a Senior), 5 y 7 (VA)

### 2.5 Dos generaciones de la misma lista en el repo

`williamson-county-resources.csv` y
`williamson-county-recursos-puenteatx-import-ready.csv` son dos versiones del
mismo inventario de Williamson. Si ambas se importaron, todo Williamson está
duplicado. Comparten teléfonos en ~15 organizaciones.

---

## 3. Formato no respetado (consistencia de campos)

Conteo sobre las 479 filas. Se distingue lo que el importador corrige solo de
lo que queda mal en la base.

### El importador corrige al importar (no es defecto en la base)

| Observación en la fuente | filas | Nota |
|---|--:|---|
| `service_area` nombra ciudades, no condados | 316 | `normalizeServiceArea` convierte ciudad→condado automáticamente |
| `last_verified_at` vacío | 411 | Se rellena a la fecha de import si el toggle está activo |
| `slug` vacío | 175 | Esperado para altas nuevas — pero ver §1a |

### Queda mal en la base (defecto real)

| Problema | filas | Dónde se concentra |
|---|--:|---|
| Contacto (teléfono/email/URL) dentro de `summary_es`/`summary_en` | **47** | eviction-solidarity (39), cmm (7), complete-family (1) — el importador **avisa** pero importó igual |
| `hours_es` **o** `hours_en` en un solo idioma | **113** | bastrop (79), veteranos (31) — mejora del skill que no se aplicó |
| `source_url` vacío | 27 | eviction (13), cmm (9), williamson-ready (4) — bloquea publicación |
| Sin ningún método de contacto | 5 | eviction-solidarity |
| Parámetros de tracking (`utm_`, etc.) en URL | 4 | cmm |
| Teléfono sin formato `###-###-####` | 7 | varios |
| `cost_type = free` sin respaldo textual | 59 | williamson-resources (25), williamson-ready (16), avey (9) — revisar caso por caso |
| Dirección presente sin `in_person` en `service_methods` | 30 | bastrop (24) |
| `in_person` sin dirección de servicio | 116 | complete-family (76) — muchos son referral/hotline, pero hay que confirmar |
| `languages` incluye `es` sin evidencia de servicio en español | 217 | heurística amplia — confirmar, no asumir defecto |

### Advertencias vivas del importador al re-simular

- `eviction-solidarity-network-consolidated`: **39** filas con warning
- `resource-list-cmm-updated`: **7** filas con warning
- `complete-family-resource-guide`: **1** fila con warning
- Errores estructurales bloqueantes: **0** en todos los archivos

---

## 4. Recomendaciones

1. **Normalizar `organization_name` a la entidad oficial** en todas las
   fuentes y en la base. El programa/sede/convenio va en el título, nunca en
   `organization_name`. Esto solo elimina la mayor fuente de triplicados.
2. **Asignar `slug` estable** a cada recurso existente y exigirlo en toda
   reimportación de esos recursos (el skill ya lo pide; hay que cumplirlo).
3. **Consolidar Williamson**: decidir cuál de las dos listas es la buena,
   archivar la otra fuera de `resource-lists-import/`.
4. **Sacar el contacto de los `summary`** en las 47 filas señaladas
   (empezar por eviction-solidarity).
5. **Completar `hours_en`/`hours_es`** en las 113 filas con horario en un solo
   idioma.
6. Correr `scripts/validate-puente-csv.mjs --existing <export.json>` **antes**
   de cada import y no importar mientras haya filas que resuelvan a `create`
   cuando deberían ser `update`.

---

## 5. Para la auditoría de la base de datos viva

Necesito un export de la tabla `resources`. Cualquiera de estas opciones:

**Opción A — Supabase (recomendada, trae los 45+ campos):**
Supabase → *Table editor* → tabla `resources` → *Export* → CSV o JSON.
O en el *SQL editor*: `select * from resources;` y exportar como JSON.

**Opción B — Panel admin (solo 7 columnas, sirve para detectar duplicados por
nombre+título, no para auditar formato de campos):**
Admin → Recursos → seleccionar todo → *Exportar*
([AdminResources.jsx:190](../../src/components/admin/AdminResources.jsx#L190)).

Deja el archivo en el repo (p. ej. `resource-lists-import/db-export-2026-09-02.json`)
y con eso corro:

```bash
node .claude/skills/prepare-puente-resources/scripts/audit-resource-gaps.mjs \
  --project . --existing resource-lists-import/db-export-2026-09-02.json \
  --out docs/imports/2026-09-02-db-gap-report.csv
```

más el cruce de duplicados reales (slug, org+título, teléfono, website,
dirección) sobre el contenido efectivo de la base.
