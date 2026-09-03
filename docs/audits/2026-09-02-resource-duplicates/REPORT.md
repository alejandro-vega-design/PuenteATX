# Auditoría integral de duplicados de recursos

Fecha de la instantánea: 2026-09-02 (America/Chicago)

## Alcance y resultado

- Recursos inspeccionados directamente en Supabase: **728**.
- Publicados: **399**.
- Borradores: **329**.
- Archivados: **0**.
- Organizaciones que aparecen en más de un registro: **76**, con 223 registros en total. Esta cifra incluye programas y ubicaciones legítimamente distintos y no equivale por sí sola a 76 duplicados.
- Pares candidatos producidos por comparación de identidad, contenido y contacto: **139**.
- Pares marcados automáticamente con prioridad alta: **60**. Requieren decisión programática o humana porque compartir teléfono y dominio no siempre implica duplicación.
- Duplicados exactos por organización y ambos títulos: **4 grupos / 8 registros**.
- No se modificó, archivó ni eliminó ningún registro durante la auditoría.

El archivo `duplicate-candidates.csv` conserva los IDs, slugs, estados, fechas, señales coincidentes y columnas para registrar la decisión final.

## Incidente de los imports del 2 de septiembre

En UTC, los imports quedaron registrados el 3 de septiembre:

- Primer lote: **214 borradores** creados entre 00:13 y 00:14.
- Pases correctivos posteriores: **9 borradores adicionales** creados entre 03:08 y 03:17.
- Los 9 registros posteriores debían haber sido actualizaciones o consolidaciones, no altas nuevas.

Registros creados durante los pases correctivos:

1. The Caring Place — Despensa de alimentos.
2. Round Rock Area Serving Center — Despensa de alimentos.
3. Hill Country Community Ministries — Despensa de alimentos.
4. Hutto Resource Center — Despensa de alimentos.
5. Lake Travis Crisis Ministries — Despensa de alimentos.
6. Travis County Family Support Services — versión con el nombre de la organización repetido en el título.
7. Smithville Food Pantry — dos registros creados en el mismo segundo.
8. Travis County Family Support Services — otra versión del mismo registro.

## Causas confirmadas

1. El importador solo identifica un recurso existente mediante slug exacto o mediante organización más título exacto. No usa teléfono, sitio oficial ni dirección como comprobación secundaria.
2. Al corregirse los títulos, la segunda estrategia dejó de coincidir. Algunos slugs también eran inestables; por ejemplo, una variante de Travis County Family Support Services terminaba en un guion y no coincidía con el slug previamente guardado.
3. Cuando ambas estrategias fallan, el importador genera un slug con sufijos como `-2` o `-3` y crea un recurso nuevo sin presentar una alerta de duplicado probable.
4. El archivo Bluebonnet todavía contenía filas repetidas que debieron consolidarse antes del primer import.
5. La clasificación automática anterior utilizó coincidencias de palabras demasiado amplias. Esto produjo, entre otros casos, el borrador incorrecto `Atención veterinaria` para Lone Star Circle of Care.
6. Los pases anteriores no fueron realmente idempotentes: contenido generado en un pase podía influir en la clasificación del siguiente.

## Grupos confirmados o de máxima prioridad

### Duplicados exactos

- Emancipet — `Atención veterinaria`: 2 borradores con el mismo teléfono y sitio; las áreas de servicio fueron separadas artificialmente.
- Gonzales Christian Assistance Ministry — `Despensa de alimentos`: 2 borradores con el mismo teléfono y ubicación; el segundo registro contiene además asistencia económica y requiere consolidación editorial.
- Travis County Family Support Services (Palm Square Office) — `Beneficios del Seguro Social`: 2 borradores exactos dentro de un grupo de 4 versiones del mismo material.
- Smithville Food Pantry — `Despensa de alimentos`: 2 borradores del último pase; existe además un tercer borrador anterior. Las dos direcciones deben cotejarse antes de elegir el registro canónico.

### Publicados con evidencia fuerte de duplicación

- Texas Baptist Children's Home — `Hope Counseling Program` / `Programa de Consejería Hope`: mismo título inglés, teléfono, dirección y servicio.
- Central Presbyterian Church — `Desayuno y apoyo para necesidades básicas` / `Central Mission – Alimentos y Necesidades Básicas…`: mismo teléfono, sitio y dirección; uno de los títulos contiene una URL pegada por error.
- El Buen Samaritano — `Apoyo comunitario para personas y familias` / `Servicios de apoyo comunitario`: mismo teléfono y sitio, con alcance genérico superpuesto.
- Bluebonnet Trails Community Services: dos pares requieren consolidación por separado: salud mental y OSAR/consumo de sustancias. No deben fusionarse salud mental y sustancias entre sí sin revisar el programa oficial.
- Texas RioGrande Legal Aid: tres listados publicados parecen representar el mismo acceso general a ayuda legal con variantes de título o cobertura.
- Volunteer Legal Services of Central Texas: tres publicados y un borrador contienen listados generales superpuestos.
- Round Rock Area Serving Center: dos publicados superpuestos y un nuevo borrador de despensa.
- The Caring Place: dos publicados superpuestos y un nuevo borrador de despensa.
- Hill Country Community Ministries: tres publicados superpuestos y un nuevo borrador de despensa.

### Borradores recientes que no deben publicarse todavía

- Lone Star Circle of Care — `Atención veterinaria`: clasificación incorrecta.
- Hope Alliance — `Refugio y vivienda temporal`: probable duplicado del recurso publicado para sobrevivientes.
- Assurance Wireless — `Servicio telefónico Lifeline`: probable duplicado del programa móvil publicado.
- Cedar Creek United Methodist Church — dos borradores de la misma despensa.
- Lake Travis Crisis Ministries — borrador de despensa superpuesto con el recurso publicado de alimentos y ayuda financiera.
- Catholic Charities of Central Texas — asistencia con servicios públicos: probable superposición con el recurso publicado de asistencia financiera; no debe confundirse con inmigración o consejería, que son programas distintos.
- Central Texas Food Bank — borrador genérico de despensa superpuesto con distribución de alimentos; sus programas para adultos mayores y despensas móviles pueden ser recursos distintos.

## Casos que no deben fusionarse automáticamente

- Clínicas distintas de Lone Star Circle of Care.
- Clínicas de vacunación y centros vecinales distintos de Austin Public Health.
- Oficinas o servicios a demanda de CARTS en ciudades diferentes.
- Programas diferentes de Catholic Charities, Integral Care, AGE of Central Texas y Opportunities for Williamson & Burnet Counties.
- Oficinas de HHSC, clínicas o centros con direcciones operativas diferentes.
- Programas diferentes de una misma organización aunque compartan teléfono central y dominio web.

## Recomendación operativa

1. No publicar los 223 borradores del lote Bluebonnet hasta terminar la consolidación.
2. Resolver primero los duplicados exactos y los 9 registros creados por los pases correctivos.
3. Elegir un registro canónico por servicio; conservar el registro más completo y estable, combinando únicamente datos compatibles y respaldados.
4. Archivar primero los duplicados en vez de eliminarlos permanentemente. La eliminación definitiva debe ocurrir solo después de revisar referencias, favoritos y analytics.
5. Corregir el importador antes del próximo lote para advertir coincidencias fuertes por organización, teléfono, dominio y dirección, y para bloquear creaciones con slugs sufijados cuando exista un candidato probable.
6. Después de la limpieza, repetir esta auditoría y exigir cero duplicados exactos antes de publicar.

## Límites

Esta fase identifica duplicados y posibles solapamientos. No decide automáticamente entre ubicaciones o programas distintos cuando comparten contactos institucionales. Las 79 coincidencias de revisión del CSV deben examinarse con ese criterio antes de cualquier acción destructiva.
