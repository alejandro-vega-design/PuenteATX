# Plan de consolidación de borradores

Fecha: 2 de septiembre de 2026

Este documento es un plan de revisión. No se modificó, archivó ni eliminó ningún registro en producción.

## Ejecución de la fase 1

La fase de archivos directos se ejecutó el 2 de septiembre de 2026 (hora de Austin):

- **11 borradores archivados**; ninguno fue eliminado permanentemente.
- La instantánea anterior tenía 404 publicados y 324 borradores.
- La instantánea posterior tiene 404 publicados, 313 borradores y 11 archivados.
- La comparación confirmó que solamente cambiaron los 11 IDs autorizados y, en ellos, únicamente `status`, `archived_at` y `updated_at`.
- La auditoría sobre recursos activos pasó de 139 a 123 pares candidatos y de 60 a 54 pares de prioridad alta. Estas cifras todavía incluyen programas y ubicaciones legítimamente distintos.
- Los seis casos que requerían fusión se completaron después de verificar y corregir sus registros canónicos.
- Después de ambas fases hay **404 publicados, 307 borradores y 17 archivados**.
- La auditoría de recursos activos quedó en **113 pares candidatos**, de los cuales **46** tienen prioridad alta. Estas señales todavía incluyen programas y ubicaciones legítimamente distintos.
- Gonzales Christian Assistance Ministry se consolidó en un recurso de alimentos y necesidades básicas; su duplicado se archivó después de retirar afirmaciones antiguas no confirmadas.
- Después de Gonzales hay **404 publicados, 306 borradores y 18 archivados**.
- Queda pendiente la revisión final de posibles duplicados publicados.

## Resultado propuesto para la primera fase

- **17 borradores candidatos a archivo**.
- **11 archivos directos**: el borrador no aporta información única y válida, es una clasificación incorrecta o contiene datos conflictivos que no deben copiarse.
- **6 archivos después de fusión o verificación**: primero deben trasladarse al registro canónico únicamente los campos compatibles y respaldados.
- **1 caso fuera de la fase automática**: Gonzales Christian Assistance Ministry requiere decidir si representa un recurso multiservicio o dos programas con procesos de acceso distintos.
- Los recursos publicados posiblemente duplicados no se consolidarán todavía. Primero se deben revisar referencias internas, favoritos y analytics para conservar el ID con uso real.

La lista ejecutable, con IDs y slugs, está en `draft-consolidation-plan.csv`.

## Correcciones editoriales obligatorias antes del archivo

### Emancipet

Conservar `464ffcb3-0fc6-46e9-8613-e581d1f31fa9` como recurso regional de clínica veterinaria móvil. Incorporar Travis y los demás condados respaldados, junto con el teléfono y proceso de acceso vigentes. Después, archivar `01b8f252-fb13-4e2e-89a0-1e19c232304a`. La página oficial confirma que la clínica móvil rota por ubicaciones y opera como un programa regional.

### Smithville Food Pantry

Conservar `03df7d5f-d3a9-4b7a-b646-a823f882ca6c`. Normalizar el título a `Despensa de alimentos`, usar la ubicación vigente en **301 Lee Street**, teléfono **512-237-2322**, correo **foodpantrysmithville@gmail.com** y distribución los miércoles de 9:00 a.m. a 11:30 a.m. No copiar la dirección 107 SW 2nd Avenue ni el teléfono 512-237-5197. Luego archivar los otros dos borradores.

### Travis County Family Support Services

Conservar `4d1f40fa-609d-4b0a-adc5-f718f1c0671c`, eliminar el salto de línea del nombre de organización y cambiar el título a `Asistencia económica de emergencia` / `Emergency financial assistance`. Fusionar requisitos, documentos y horarios respaldados de las otras tres versiones. `Beneficios del Seguro Social` no es aquí un programa independiente: el documento fuente menciona una tarjeta de Seguro Social como identificación requerida.

### Assurance Wireless

Conservar el recurso publicado. Antes de archivar el borrador, verificar en la fuente oficial la elegibilidad, cobertura y prestaciones actuales. No copiar cifras antiguas de minutos o datos sin confirmación.

### Catholic Charities of Central Texas

Conservar el recurso publicado de asistencia financiera. Fusionar solo horarios, requisitos y documentos vigentes del borrador. Mantener separados los programas de inmigración, consejería y apoyo a veteranos.

## Archivos directos propuestos

- Los dos borradores redundantes o desactualizados de Smithville Food Pantry, después de corregir el canónico.
- Lone Star Circle of Care — `Atención veterinaria`, por clasificación incorrecta.
- Los borradores genéricos recientes de The Caring Place, Round Rock Area Serving Center, Hill Country Community Ministries, Hutto Resource Center y Central Texas Food Bank.
- Lake Travis Crisis Ministries, sin copiar su dirección conflictiva.
- Hope Alliance, porque el recurso publicado ya representa el mismo servicio de apoyo a sobrevivientes.
- El borrador nuevo y genérico de Cedar Creek United Methodist Church.

The Caring Place, Round Rock Area Serving Center y Hill Country Community Ministries tienen además duplicados publicados. Archivar sus borradores recientes es seguro, pero seleccionar un único publicado canónico se deja para una fase posterior basada en uso y referencias.

## Caso de revisión manual

Gonzales Christian Assistance Ministry tiene dos borradores con la misma dirección y teléfono, pero las descripciones mezclan despensa, ropa, medicamentos, gasolina, renta y servicios públicos. No se debe archivar uno hasta confirmar si todo comparte el mismo proceso de solicitud. Si lo comparte, se consolidará en un recurso con un título como `Alimentos y asistencia económica`; si son programas operativamente distintos, se mantendrán dos recursos con títulos específicos.

## Orden seguro de ejecución

1. Resolver los IDs canónicos marcados como `TBD` o provisionales en el CSV mediante referencias y analytics.
2. Hacer una copia de seguridad de los registros afectados.
3. Aplicar y revisar las cinco fusiones editoriales.
4. Comparar nuevamente cada par para asegurar que no se pierde ningún dato válido.
5. Archivar los 17 borradores; no eliminarlos permanentemente.
6. Repetir la auditoría y exigir cero duplicados exactos en esta cohorte.
7. Revisar visualmente el directorio, el buscador basado en mapa y el panel administrativo.

## Fuentes oficiales consultadas

- Smithville Food Pantry: <https://smithvillefoodpantry.org/> y <https://smithvillefoodpantry.org/contact-us/>
- Emancipet Mobile Clinic: <https://emancipet.org/central-texas-low-cost-mobile-clinic/>
- Travis County Family Support Services: <https://www.traviscountytx.gov/health-human-services/divisions/family-support-services>
