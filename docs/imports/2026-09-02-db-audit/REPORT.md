# Auditoría de la base de datos de recursos — 2026-09-02

Fuente: export completo de `public.resources` (Supabase), `resources_rows.csv` →
`resource-lists-import/db-export-2026-09-02.csv`.
Script: [`scripts/audit-db-resources.mjs`](../../../scripts/audit-db-resources.mjs)
(solo lectura, valida contra `src/data/csvImport.js` y `src/data/categories.js`).

## Panorama

| | |
|---|--:|
| Recursos totales | **728** |
| Publicados | 404 |
| Borradores | 324 |
| Clusters de duplicados detectados | **46** (102 registros) |
| Familias de nombre de organización con variantes | **44** |
| Registros con problemas de formato | 343 incidencias / ~230 registros |
| Errores estructurales bloqueantes | 0 |

Archivos de detalle en esta carpeta:

- `duplicate-clusters.txt` — los 46 clusters, legible
- `likely-duplicate-pairs.csv` — 68 pares con score de similitud (título/resumen)
- `duplicates.json` — todo, incluidas las agrupaciones por teléfono/website/dirección
- `field-issues.csv` — una fila por incidencia de formato (`slug,status,org,code,detail`)

---

## 1. Duplicados y triplicados

### 1.1 El marcador más claro: slugs con sufijo numérico

El importador solo agrega `-2` / `-3` a un slug cuando **ya existía uno igual** —
es decir, creó un duplicado en lugar de actualizar. Hay **10**:

| slug | status |
|---|---|
| `integral-care-integral-care-2` | published |
| `catholic-charities-of-central-texas-catholic-charities-of-central-texas-2` | published |
| `greater-mt-zion-church-greater-mt-zion-church-2` | published |
| `travis-county-family-support-services-…-housing-and-financial-assistance-2` | draft |
| `travis-county-family-support-services-…-housing-and-financial-assistance-3` | draft |
| `smithville-food-pantry-bastrop-2` | draft |
| `halcyon-home-health-and-personal-support-austin-2` | draft |
| `williamson-county-regional-animal-shelter-community-support-williamson-2` | draft |
| `austin-energy-financial-support-plus-1` | published |
| `buscador-de-ayuda-comunitaria-findhelp-and-texas-2-1-1` | published *(el "-2-1-1" es parte del nombre, falso positivo)* |

### 1.2 Clusters de alta confianza (46 grupos, 102 registros)

Detectados por anclas fuertes compartidas (teléfono / website / dirección) +
títulos o resúmenes casi idénticos. Lista completa en `duplicate-clusters.txt`.
Los más graves:

**Fichas ES y EN cargadas como dos registros publicados distintos** — falló la
consolidación bilingüe:

| Cluster | Registros (ambos `published`) |
|---|---|
| Texas Baptist Children's Home | `hope-counseling-program-williamson-county` + `programa-de-consejeria-hope-texas-baptist-children-s-home` |
| CommUnityCare | `communitycare-primary-and-specialty-health-services` + `atencion-medica-primaria-y-especializada-communitycare-health-centers` |
| Any Baby Can | `any-baby-can-community-support-for-individuals-and-families` + `apoyo-integral-para-familias-con-ninos-any-baby-can` |
| Integral Care | `integral-care-integral-care-2` + `integral-care-mental-health-and-substance-use-services` |
| People's Community Clinic | `atencion-medica-familiar-de-bajo-costo-…` + `people-s-community-clinic-community-health-clinic` |

**Triplicados:**

- **Smithville Food Pantry** (3, todos draft): `despensa-de-alimentos-de-smithville-smithville-food-pantry`, `smithville-food-pantry-bastrop`, `smithville-food-pantry-bastrop-2`
- **Lone Star Circle of Care** (3, published): `-georgetown`, `-cedar-park`, `-aw-grimes` — misma ficha "Clínica comunitaria de {ciudad}", contenido casi idéntico
- **Community Action of Central Texas** (3, draft): `-williamson`, `-bastrop`, `comprehensive-energy-assistance-program-…-caldwell` — "Asistencia con servicios públicos" repetida por condado
- **El Buen Samaritano** (3, published): `community-support-services`, `community-support-for-individuals-and-families`, `despensa-de-alimentos-y-distribucion-de-panales-…`
- **AGE of Central Texas** (3): `age-of-central-texas-age-of-central-texas`, `h-e-l-p-programa-de-prestamo-de-equipo-medico-…`, `age-of-central-texas-servicios-para-cuidadores-…`
- **Feed the Need** (4, draft): Stony Point, Bastrop North, Bastrop South, Smithville — misma organización y teléfono, título "Despensa de alimentos" en las 4

**Pares published + draft (el borrador es re-alta del recurso ya publicado):**

- Volunteer Legal Services of Central Texas
- Opportunities for Williamson & Burnet Counties
- Greater Mt. Zion Church
- Catholic Charities of Central Texas
- Bastrop County — Oficina de Servicios para Veteranos
- Round Rock Area Serving Center
- Shepherd's Heart / Taylor
- Central Texas Food Bank — "Distribución de alimentos" (pub) + "Despensa de alimentos" (draft)

**Falsos positivos conocidos** (mismo teléfono/website pero servicios/ubicaciones
realmente distintos — NO fusionar, pero sí revisar por títulos calcados):
centros vecinales de Austin Public Health (4), clínicas de vacunación APH (2),
clínicas VA LaGrange/Cedar Park, salud conductual LSCC Round Rock/Georgetown,
divisiones del Travis County Clerk, salud mental vs uso de sustancias de
Bluebonnet Trails, rutas de CapMetro.

### 1.3 Causa raíz

1. **`organization_name` no es la entidad oficial.** 44 familias de variantes.
   El importador normaliza el nombre y lo usa como llave; cualquier variante crea
   entidad nueva:

   - `Drive a Senior Network` · `Drive a Senior Central Texas` · `Drive a Senior Central Texas (antes "Senior Access")` · `Drive a Senior` · `Drive a Senior (antes "Chariot")`
   - `Capital Area Rural Transportation System (CARTS)` · `Capital Area Rural Transportation System` · `Capital Area Rutal Transportation Systems (CARTS)` *(typo "Rutal")* · `CARTS`
   - `Central Texas Food Bank` · `Central Texas Food Bank (programa Golden Harvest)`
   - `The SAFE Alliance` · `The SAFE Alliance (SAFE)` · `SAFE Alliance`
   - `Community Action of Central Texas` · `Community Action for Central Texas` *(of/for)*
   - `Texas RioGrande Legal Aid` · `Texas Rio Grande Legal Aid`
   - `Combined Community Action, Inc.` · `Combined Community Action, Inc` *(punto final)*
   - `Bastrop County` · `Bastrop County Government`
   - `Travis County Family Support Services\n(Palm Square Office)` — **con salto de línea dentro del nombre**
   - lista completa (44) en `duplicates.json` → `organizationNameVariants`

2. **El programa/condado/sede se metió en el título** en vez del nombre del
   programa. Por eso hay 4 fichas "Despensa de alimentos" de Feed the Need, o
   "Atención médica" ×2 para VA. El importador no puede distinguirlas salvo por
   el slug del condado.

3. **La ficha ES y la ficha EN se cargaron por separado** en al menos 5 casos
   publicados. La consolidación bilingüe (paso 4-6 del skill) no se aplicó.

4. **`slug` vacío en el origen** → el importador genera uno nuevo cada vez en
   lugar de reconocer el recurso existente.

---

## 2. Formato no respetado

343 incidencias. `field-issues.csv` tiene el detalle fila por fila.

| Código | Total | pub / draft | Qué es |
|---|--:|---|---|
| `in_person_without_address` | 121 | 112 / 9 | `service_methods` incluye `in_person` pero no hay `address_line_1`. Muchos son referral/hotline mal clasificados como presenciales; otros faltan dirección real. |
| `no_description_either_language` | 54 | 54 / 0 | Publicado sin `description_es` ni `description_en`. No bloquea publicación (desde migración 005) pero el estándar de preparación pide descripción bilingüe. |
| `no_contact_method` | 38 | 0 / 38 | Sin teléfono, SMS, WhatsApp, email ni website. Bloquea publicación. |
| `service_area_names_city` | 32 | 32 / 0 | `service_area_es/en` nombra ciudades (Austin, Round Rock…) en lugar de condados, y quedó así en la base (el normalizador no lo alcanzó). |
| `address_without_in_person` | 28 | 20 / 8 | Hay dirección/coordenadas pero `service_methods` no incluye `in_person`. |
| `phone_not_dashed` | 23 | 16 / 7 | Teléfono sin formato `###-###-####`. |
| `draft_missing_source_url` | 22 | 0 / 22 | Borrador sin `source_url`. Hay que completarlo antes de publicar. |
| `hours_one_language_only` | 19 | 6 / 13 | Horario en un solo idioma (mejora del skill que no se aplicó). |
| `tracking_params_in_url` | 5 | 5 / 0 | `utm_`, `si=`, etc. en `website_url` / `source_url`. |
| `hours_identical_prose` | 1 | 1 / 0 | `hours_es` = `hours_en` con prosa (probable falta de traducción). |

Además: **62 recursos** tienen slug de la forma `x-x` (p. ej.
`casa-marianella-casa-marianella`, `integral-care-integral-care`). No es un
duplicado en sí, es la huella de haber puesto el nombre de la organización como
título — el título no aporta información al usuario.

Un caso con contacto embebido en el título:
`central-presbyterian-church-central-presbyterian-church` →
título `"Central Mission – Alimentos y Necesidades Básicashttps://…"` (URL pegada
sin espacio).

---

## 3. Recomendaciones

**Corto plazo — limpiar lo que ya está:**

1. Resolver los **46 clusters** de `duplicate-clusters.txt`. Prioridad:
   los 5 pares ES/EN publicados y los triplicados (Smithville, LSCC, Community
   Action, El Buen Samaritano, Feed the Need).
2. Para cada cluster: elegir un registro "keeper" (preferir el `published` con
   más campos completos), fusionar datos faltantes, archivar los demás
   (no borrar hasta confirmar que no hay `saved_resources` o referidos apuntando).
3. Completar `source_url` en los 22 borradores y contacto en los 38 sin canal.
4. Sacar contacto de títulos/resúmenes (los casos de `field-issues.csv`).

**Estructural — que no vuelva a pasar:**

5. Normalizar `organization_name` a la entidad legal oficial en toda la base y
   en las plantillas. El programa va en el título; la sede/condado va en
   `service_area` y dirección, nunca en el nombre.
6. Asignar `slug` estable a cada recurso y **exigirlo** en toda reimportación de
   recursos existentes. Correr `node scripts/audit-db-resources.mjs` sobre un
   export fresco antes y después de cada import.
7. En el importador, considerar subir el umbral de match: hoy solo compara
   `organization_name` normalizado + título exacto. Un match por
   website/teléfono + título aproximado evitaría gran parte de estos duplicados.
8. Consolidar ES/EN en un solo registro bilingüe en el flujo de preparación
   (el skill ya lo pide en los pasos 4-6; no se está cumpliendo).

---

## 4. Siguiente paso sugerido

Puedo generar un **plan de fusión** en CSV: una fila por cluster con el keeper
propuesto, los slugs a archivar, y el diff de campos a copiar al keeper — listo
para que un humano lo apruebe y se aplique como updates + archivado. Avísame si
lo hago.
