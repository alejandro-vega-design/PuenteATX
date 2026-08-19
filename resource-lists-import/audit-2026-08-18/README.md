# Auditoría exhaustiva — puente-atx-recursos-2026-08-19.csv

Fecha de auditoría: 18 de agosto de 2026  
Archivo original preservado como: `source.csv`

## Veredicto

El archivo recibido **no puede importarse directamente**. Es una exportación resumida del dashboard, no el template del importador.

- Filas inventariadas: 64
- Encabezados presentes: 7
- Encabezados requeridos por el importador: 45
- Filas duplicadas exactas dentro del inventario: 0
- Registros recuperados desde un CSV previo del proyecto: 40
- Registros reconstruidos y verificados con fuentes oficiales: 15
- Entradas que se recomienda excluir: 9
- Registros recuperados que todavía requieren verificación individual: 40

Los 40 registros recuperados **no se declaran listos para publicar**. El archivo anterior permite recuperar sus campos, pero muchas filas carecen de fecha de verificación, contacto suficiente, dirección presencial o confirmación actual del alcance.

## Archivos generados

- `row-by-row-audit.csv`: decisión y riesgo para cada una de las 64 filas.
- `approved-subset.csv`: 15 registros reconstruidos con los 45 encabezados exactos del importador.
- `validation.json`: resultado reproducible de la validación.
- `recovered-records.json`: 40 registros detallados recuperados de un CSV anterior.
- `unrecovered-inventory.json`: 24 entradas que solo existían como inventario del dashboard.

## Exclusiones recomendadas

Estas entradas no representan por sí solas un servicio comunitario accionable:

1. Travis County Sheriff's Office — institución demasiado amplia.
2. Thurman-Blackwell Criminal Justice Center — edificio, no servicio.
3. Transportation & Natural Resources — departamento genérico.
4. Travis County District Clerk – Main — duplica divisiones específicas.
5. Austin Water – Water Protection, Industrial Waste Control & Water Wells — mezcla tres programas distintos, principalmente regulatorios.
6. Austin Water – Main / Waller Creek Center — instalación genérica y duplicada.
7. One Texas Center — edificio municipal.
8. Austin Energy Facilities — agrupación de instalaciones.
9. City of Austin — entidad demasiado amplia.

## Fuentes oficiales contrastadas

- Travis County District Clerk: https://www.traviscountytx.gov/district-clerk/contact
- Travis County Clerk divisions: https://countyclerk.traviscountytx.gov/departments/
- Travis County Domestic Relations: https://www.traviscountytx.gov/dro/contact-us
- Travis County Law Library: https://lawlibrary.traviscountytx.gov/contact-us
- Family Law Case Review: https://lawlibrary.traviscountytx.gov/family-law-case-review
- Travis County Tax Office: https://tax-office.traviscountytx.gov/properties/taxes/payment-methods/in-person
- Bastrop County Clerk: https://www.bastropcounty.gov/page/co.county_clerk
- TCAD homestead exemptions: https://traviscad.org/homesteadexemptions
- City of Austin Vital Records: https://www.austintexas.gov/services/get-birth-or-death-certificate
- Austin Water contact: https://www.austintexas.gov/water/contact
- City of Austin permit types: https://www.austintexas.gov/development-services/types-permits
- Austin 3-1-1 service descriptions: https://www.austintexas.gov/sites/default/files/files/311/Department%20and%20SR%20Descriptions_FY25_November.pdf

## Decisiones editoriales

- Los textos español/inglés son contenido bilingüe del directorio; `languages` solo declara idiomas de servicio confirmados.
- Las áreas de servicio usan únicamente condados.
- No se añadieron coordenadas sin un proceso aprobado de geocodificación.
- No se mostró una dirección cuando el canal útil es únicamente teléfono/online.
- Las tarifas se marcaron como `paid` cuando la fuente confirma cargos por certificados o copias; de lo contrario se usa `unknown`.
- Se conservaron organización y títulos originales en `approved-subset.csv` para facilitar el match con registros existentes y reducir el riesgo de duplicados.

## Advertencia antes de importar

`approved-subset.csv` pasa el validador local del importador, pero el entorno local no pudo consultar los borradores protegidos de Supabase. Por eso no se pudo simular el resultado exacto contra la base de datos viva.

Antes de confirmar la importación:

1. Usa el modo que actualiza registros existentes y revisa el preview de acciones.
2. Confirma que las 15 filas aparezcan como **actualización**, no como creación.
3. Si una fila aparece como creación, cancela y compara organización y título con el registro existente.
4. Importa primero como borrador.
5. Publica únicamente después de una revisión humana de las 15 filas.

## Validación técnica

Resultado del validador vivo:

- Encabezados: 45/45
- Filas aprobadas: 15
- Errores del importador: 0
- Advertencias del importador: 0
- Advertencias de calidad: 0

La validación comprueba formato y reglas del importador; no sustituye la comprobación humana de elegibilidad, disponibilidad o cambios operacionales futuros.
