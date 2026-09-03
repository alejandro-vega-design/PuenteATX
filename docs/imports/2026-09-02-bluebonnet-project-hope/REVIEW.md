# Reporte de importación piloto — Bluebonnet Project HOPE

Fecha: 2026-09-02

## Resultado

- Filas preparadas: 221 (111 despensas y 110 recursos o programas adicionales).
- Archivo enriquecido: `bluebonnet-project-hope-pilot-import.csv`.
- Validación: 45/45 encabezados, 221 acciones `create`, 0 errores y 0 warnings del importador.
- Excepción de partnership: se conservan las 221 filas aunque algunas requieran verificación posterior.
- Publicación: **no realizada**. El CSV queda listo para vista previa e importación administrativa.

## Enriquecimiento aplicado

- Las 221 filas tienen título, resumen, descripción y pasos de acceso en español e inglés.
- Se sustituyeron los títulos genéricos por nombres específicos del servicio. El nombre de la organización no se repite en el título porque la interfaz ya lo muestra en una línea separada.
- Se normalizaron categorías, categorías adicionales, palabras clave, teléfonos, métodos de servicio y URLs sin parámetros de rastreo.
- Se tradujeron y limpiaron los horarios disponibles; 123 filas contienen horario bilingüe.
- Se extrajo elegibilidad en 30 filas y documentos requeridos en 6, únicamente cuando el material fuente los respaldaba.
- 209 filas tienen método de servicio; 183 tienen teléfono, correo o sitio web; 200 tienen una fuente web.
- 70 filas conservan una fecha de verificación respaldada por el documento fuente o por una consulta oficial realizada durante este pase.
- Se consultaron fuentes oficiales para HHS, clínicas VA de Austin/Cedar Park/La Grange, Bluebonnet Trails OSAR, Goodwill Central Texas, Travis County Family Support Services, SAFE Alliance y The Salvation Army.
- Para despensas sin una página individual se añadió el localizador regional correspondiente como fuente de seguimiento, sin asignar una fecha nueva de verificación individual.
- No se infirieron idiomas por ubicación o población. Solo 3 filas declaran idiomas explícitamente.

## Cobertura geográfica

- Se añadieron Lee, Fayette, Gonzales y Guadalupe al modelo de condados y ZIPs; Burnet se conservó porque también aparece en los documentos.
- El dataset geográfico contiene 140 ZCTAs de Travis, Williamson, Bastrop, Hays, Caldwell, Burnet, Lee, Fayette, Gonzales y Guadalupe.
- Las 221 filas conservan al menos un área de servicio después de pasar por el normalizador real.
- Se enviaron 147 direcciones públicas al geocodificador oficial del Census Bureau: 110 coincidencias únicas recibieron coordenadas; 28 no tuvieron coincidencia y 9 fueron ambiguas y quedaron sin coordenadas.
- Las 221 filas pueden aparecer en la lista del buscador. Solo las 110 ubicaciones confirmadas tendrán marcador.
- El detalle reproducible está en `census-geocoding-audit.csv`.

## Alertas pendientes

El validador presenta 210 avisos editoriales, principalmente por falta de fecha de verificación individual o de un canal de contacto en los archivos suministrados. No son errores del importador y no se rellenaron con suposiciones.

Quedan 21 recursos sin una fuente web verificable:

- Switzer Senior Center
- Madella Hilliard Neighborhood Center
- Mortgage Relief Helpline
- Debt Relief Hotline
- Free Bankruptcy Advice
- National Sexual Assault Legal Hotline
- Experience Works: Work Force Solutions
- Discount Prescription Hotline
- Mortgage Relief Helpline: Care Connect USA
- Bastrop Women's Shelter
- Comprehensive Energy Assistance Program
- St. Vincent De Paul (Caldwell)
- Enrollment Department Call Center
- Gonzales Christian Assistance Ministry
- Stella's House (Refuge)
- Community Council of South Central Texas — Veterans Financial Assistance
- St. Vincent De Paul Church (Travis)
- All Saints Episcopal Church
- Baptist Community Center
- UpLift at University Presbyterian Church
- St. Matthews Episcopal Church

Antes de publicar, el equipo debe revisar las alertas de contacto y vigencia en la vista previa. Estos vacíos se conservaron deliberadamente para evitar inventar datos.
