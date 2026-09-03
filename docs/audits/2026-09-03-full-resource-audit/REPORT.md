# Auditoría completa de recursos — 3 de septiembre de 2026

## Alcance

- Exportación fresca y read-only de producción: 728 registros.
- Estados: 391 publicados, 301 borradores y 36 archivados.
- Revisión principal: los 692 registros activos (publicados y borradores).
- No se modificó, archivó, publicó ni eliminó ningún recurso.
- Se revisaron estructura, requisitos de publicación, títulos, bilingüismo, prosa, categorías, contacto, fuentes, fechas, ubicación, horarios, áreas de servicio y duplicados.

## Resultado ejecutivo

La base no tiene slugs duplicados y ningún recurso publicado incumple actualmente los requisitos técnicos mínimos que bloquean la publicación. Sin embargo, la auditoría encontró problemas editoriales y de procedencia que deben corregirse por etapas:

1. **87 URLs inválidas**: 85 en publicados y 2 en borradores. La gran mayoría tienen `source_url` guardado como `PuenteATX` o `Puente ATX`, que es una firma pero no una URL verificable. Debe convertirse en una URL real, por ejemplo `https://puenteatx.org`, únicamente cuando Puente ATX haya realizado la verificación.
2. **99 problemas de títulos activos**:
   - 50 publicados cuyo título duplica la organización;
   - 17 publicados y 31 borradores cuyo título contiene redundantemente la organización;
   - 1 borrador con el título ambiguo `Apoyo integral para sobrevivientes asiáticos`, que no identifica el contexto de violencia o abuso respaldado por el contenido.
3. **Duplicados activos**:
   - un par exacto y de alta certeza: American Gateways aparece publicado y como borrador con el mismo servicio de inmigración;
   - otros grupos probables requieren consolidación manual porque comparten identidad, contacto y contenido, pero no deben archivarse automáticamente.
4. **38 borradores** presentan señales de prosa concatenada mecánicamente; son 100 hallazgos distribuidos entre resúmenes y descripciones.
5. **19 problemas de horario bilingüe**: 18 tienen horario en un solo idioma (5 publicados y 13 borradores) y 1 publicado contiene la misma prosa en ambos idiomas.
6. **Acceso y ubicación**:
   - 118 activos indican atención presencial sin dirección (108 publicados y 10 borradores);
   - 27 activos tienen dirección, pero no incluyen el método presencial (20 publicados y 7 borradores).
   Estos son conflictos que requieren confirmar si la dirección es un lugar real de servicio; no deben corregirse automáticamente.
7. **Procedencia y completitud de borradores**:
   - 18 borradores carecen de `source_url`;
   - 1 borrador carece de `last_verified_at`;
   - 34 borradores no tienen método de contacto público ni sitio web.
8. **Otros problemas concretos**:
   - 24 teléfonos activos no usan el formato `###-###-####`;
   - 5 URLs publicadas conservan parámetros de tracking;
   - 1 fecha publicada está en el futuro: Elgin ISD / `Familias en Transición`, con `2026-09-28`;
   - 1 resumen y 3 descripciones publicadas contienen exactamente la misma prosa en español e inglés;
   - 47 publicados no tienen descripción en ningún idioma. Esto no bloquea publicación, pero reduce la utilidad de la ficha.

## Duplicados que requieren decisión

### Confirmado

- **American Gateways — Servicios legales de inmigración**: un publicado y un borrador con el mismo título bilingüe, organización, teléfono, website y dirección. Conservar el publicado como canónico, incorporar únicamente información complementaria verificada y archivar el borrador.

### Probables

- **Opportunities for Williamson & Burnet Counties — Meals on Wheels**: publicado y borrador representan el mismo programa; el borrador contiene cobertura adicional de Burnet que debe verificarse antes de consolidar.
- **Opportunities for Williamson & Burnet Counties — asistencia energética/servicios públicos**: publicado y borrador parecen el mismo programa con distinta cobertura declarada.
- **Volunteer Legal Services of Central Texas**: publicado y borrador parecen el mismo servicio legal civil; revisar la dirección antes de consolidar.
- **Integral Care**: tres publicados describen de forma ampliamente solapada salud mental, uso de sustancias y crisis. El recurso de vivienda parece distinto y debe conservarse separado.
- **Any Baby Can**: tres publicados describen apoyo familiar general con fuerte solapamiento; confirmar si alguno corresponde a un programa específico antes de consolidar.
- **AGE of Central Texas**: dos publicados son institucionales y ampliamente solapados. El borrador de servicios para cuidadores puede representar un programa específico y no debe fusionarse sin verificarlo.

### Señales revisadas que no bastan para declarar duplicado

- Clínicas distintas de Lone Star Circle of Care.
- Clínicas de vacunación distintas de Austin Public Health.
- CARTS Now Bastrop y CARTS Now Elgin.
- Despensas móviles de Cedar Creek y Elgin.
- Oficinas de beneficios de HHSC en Bastrop y Elgin.
- Divisiones distintas de Travis County Clerk.
- OSAR y el programa amplio de tratamiento de sustancias de Bluebonnet Trails.
- Recursos que comparten teléfono o dominio institucional, pero representan programas o ubicaciones distintas.

## Títulos repetidos legítimos

Los títulos compartidos no deben hacerse artificialmente únicos añadiendo la organización o el condado. La auditoría encontró 11 grupos en publicados y 11 en borradores. La mayoría son etiquetas legítimas para servicios equivalentes, incluidos:

- 90 borradores `Despensa de alimentos`;
- 4 borradores `Comidas calientes gratuitas`;
- 4 borradores `Empleo y capacitación laboral`;
- 3 borradores `Orientación para encontrar cuidado de adultos mayores`;
- 3 borradores `Atención médica en el hogar`;
- 25 publicados `Programas de desarrollo y recreación juvenil`.

Los grupos publicados con títulos excesivamente genéricos —especialmente `Apoyo comunitario para personas y familias`, `Servicios de salud mental y bienestar` y `Programas educativos y apoyo al aprendizaje`— no son necesariamente duplicados, pero merecen una segunda revisión editorial para confirmar que cada título identifica suficientemente el servicio.

## Ubicación, ZIP y condado

La auditoría produjo 16 señales de incompatibilidad ZIP/condado y 6 ZIP no incluidos en la configuración regional. No se consideran errores confirmados porque algunos ZIP atraviesan límites de condado, algunos recursos tienen cobertura distinta a su dirección física y el normalizador actual devuelve una sola coincidencia. Deben revisarse con evidencia geográfica antes de cambiar datos. Esta pasada también encontró 33 áreas de servicio expresadas con ciudades en lugar de condados.

## Categorías

La búsqueda heurística produjo 90 señales de posible clasificación. No se consideran errores confirmados: muchos textos mencionan transporte, educación o servicios legales de manera incidental. Debe usarse siempre el documento original o la fuente oficial, no la prosa generada, antes de cambiar una categoría. Los hallazgos permanecen en `editorial-findings.csv` con nivel de confianza para revisión.

## Archivos de trabajo

- `editorial-findings.csv`: hallazgos editoriales, bilingües, geográficos y de procedencia por recurso.
- `duplicate-candidates.csv`: pares candidatos con señales y similitud.
- `duplicates.json`: agrupaciones y anclas compartidas completas.
- `likely-duplicate-pairs.csv`: pares detectados por similitud alta.
- `published-title-audit.csv` y `draft-title-audit.csv`: auditoría de títulos por estado.
- `field-issues.csv`: inconsistencias estructurales y de formato.
- `field-gaps.csv`: matriz completa de campos vacíos por recurso; incluye campos opcionales y no debe interpretarse como 728 recursos defectuosos.
- `summary.json`: resumen automático inicial.

## Orden recomendado de corrección

1. Corregir la fecha futura y las URLs inválidas o con tracking.
2. Resolver el duplicado confirmado de American Gateways y revisar los seis grupos probables.
3. Corregir títulos que duplican o contienen la organización y el título ambiguo de sobrevivientes.
4. Reparar horarios y prosa bilingüe.
5. Revisar los 38 borradores con prosa concatenada antes de publicarlos.
6. Confirmar conflictos entre método presencial y dirección.
7. Completar fuente, verificación y contacto faltantes en borradores.
8. Revisar descripciones, áreas de servicio, teléfonos y señales geográficas en lotes controlados.

Toda corrección debe realizarse por IDs explícitos, con exportación previa y posterior, sin eliminación permanente y conservando actividad y slug del registro canónico.

## Estado de remediación — etapa 1

La primera etapa se aplicó y verificó el 3 de septiembre de 2026:

- 124 recursos actualizados y 219 campos corregidos.
- 87 firmas `PuenteATX` / `Puente ATX` convertidas a `https://puenteatx.org`; se preservaron las notas existentes y se añadió la firma de verificación interna cuando faltaba.
- 5 URLs limpiadas de parámetros de tracking.
- 22 teléfonos normalizados; dos teléfonos ya tenían el número correctamente separado y solo incluían extensiones válidas, por lo que se conservaron.
- 16 traducciones de horario añadidas y 1 horario en español corregido.
- Fecha futura de Elgin ISD corregida a `2026-09-03`, coherente con la verificación y publicación registradas ese día.
- Dos horarios publicados que mezclan instrucciones, documentos, email y URL quedaron pendientes para edición humana.
- Exportación posterior: 728 recursos, exactamente los mismos que antes.
- Verificación de cambios: 124 IDs esperados, 124 modificados, 0 campos inesperados, 0 registros faltantes, 0 valores divergentes y 0 archivados.

Después de esta etapa, los hallazgos automáticos activos bajaron de 574 a 464. Quedaron en cero las URLs activas inválidas, los parámetros de tracking y las fechas futuras. Los resultados posteriores están en `post-stage-1/`.

## Estado de remediación — etapa 2

La consolidación de duplicados se aplicó y verificó el 3 de septiembre de 2026:

- 7 recursos canónicos actualizados.
- 9 duplicados archivados; ninguno tenía actividad registrada.
- 0 eliminaciones permanentes.
- American Gateways: se conservó el publicado, se enriqueció con información oficial y se archivó el borrador duplicado.
- OWBC Meals on Wheels: se conservó el publicado, se añadió la cobertura verificada de Williamson y Burnet y se archivó el borrador.
- OWBC CEAP: se conservó el publicado, se incorporó cobertura, elegibilidad, documentos y contacto verificados y se archivó el borrador.
- Volunteer Legal Services: se conservó el publicado y se archivó el borrador duplicado.
- Integral Care: se consolidaron tres publicados generales en un solo recurso de salud mental, uso de sustancias y crisis. El recurso específico de vivienda quedó separado.
- Any Baby Can: se consolidaron tres publicados generales en un solo recurso, con cobertura y contenido tomados de sus fuentes oficiales.
- AGE of Central Texas: se archivó el publicado institucional redundante y se conservó el recurso canónico. El borrador específico de Pathways quedó separado para revisión porque puede representar un programa independiente.
- Se mantuvieron como recursos distintos Bluebonnet OSAR y su programa amplio de tratamiento, las diferentes clínicas, sedes, oficinas y divisiones administrativas.

La normalización de la dirección de American Gateways activó el trigger de geocodificación y limpió temporalmente coordenadas que ya estaban verificadas. Se restauraron exactamente `30.32862, -97.711788` junto con su estado de geocodificación previo.

Verificación final:

- 728 registros totales: 386 publicados, 297 borradores y 45 archivados.
- 16 IDs modificados exactamente: 7 canónicos y 9 archivados.
- 0 cambios inesperados, 0 valores divergentes y 0 registros faltantes.
- 0 grupos activos con la misma combinación exacta de organización y títulos bilingües.
- Los hallazgos editoriales activos bajaron de 464 a 457.

Los resultados posteriores están en `post-stage-2/` y las operaciones aprobadas están documentadas en `stage-2-operations.json`.

## Estado de remediación — etapa 3

La corrección editorial de títulos se aplicó y verificó el 3 de septiembre de 2026:

- 95 recursos activos recibieron títulos bilingües específicos del servicio: 65 publicados y 30 borradores.
- Se corrigieron 49 títulos publicados que duplicaban exactamente la organización y 45 títulos activos que la contenían redundantemente.
- `Apoyo integral para sobrevivientes asiáticos` se cambió a `Apoyo para sobrevivientes de violencia doméstica y agresión sexual`, incorporando el contexto respaldado por la ficha.
- Los títulos compartidos legítimos, como `Despensa de alimentos`, se conservaron; no se añadieron organizaciones ni condados únicamente para forzar unicidad.
- La corrección reveló dos pares que los títulos anteriores ocultaban: Round Rock Housing Authority y Meals on Wheels Central Texas. Ambos pares se confirmaron como duplicados y ninguno tenía actividad ni referidos.
- Se conservaron los dos recursos publicados canónicos, se incorporó la información complementaria verificada y se archivaron las dos copias. No hubo eliminaciones permanentes.
- La dirección de Meals on Wheels se confirmó como sede institucional y se retiró del recurso para evitar presentarla como punto de atención presencial o ubicación del servicio.

Verificación final:

- 728 registros totales: 385 publicados, 296 borradores y 47 archivados.
- 681 recursos activos.
- 0 títulos activos que duplican o contienen redundantemente `organization_name`.
- 0 títulos ambiguos de sobrevivientes.
- 0 grupos activos con la misma combinación exacta de organización y títulos bilingües.
- 0 slugs duplicados.
- Las 95 ediciones iniciales coincidieron exactamente con el lote previsto y no modificaron otros campos.
- Las dos consolidaciones posteriores modificaron únicamente los cuatro IDs documentados; las copias se archivaron y los canónicos conservaron sus slugs.
- Los hallazgos editoriales activos bajaron de 457 a 357. Los 357 restantes pertenecen a otras clases de revisión —principalmente prosa concatenada, método presencial sin dirección y señales heurísticas de categoría o geografía— y no son problemas de título.

Los resultados finales están en `post-stage-3/`. Los lotes y precondiciones están documentados en `stage-3-title-operations.json`, `stage-3-exposed-duplicates.json` y `stage-3-location-correction.json`.

## Estado de remediación — etapa 4

La limpieza de prosa concatenada y contaminada se aplicó y verificó el 3 de septiembre de 2026:

- Se revisaron individualmente los 38 borradores que producían 100 alertas de `mechanically_concatenated_prose`.
- Se reescribieron 152 campos: resumen y descripción en español e inglés para cada recurso, manteniendo el alcance respaldado por su contenido y fuente.
- Se eliminaron mezclas semánticas ajenas al servicio, entre ellas referencias incorrectas a cuidado infantil, vivienda, sobrevivientes, Seguro Social y beneficios que habían sido añadidas por clasificación mecánica.
- Se corrigieron casos especialmente visibles como Airtalk Wireless, Austin Humane Society, APICON Home Health, los servicios de VA, recursos de asistencia financiera, cuidado de adultos mayores y servicios para animales.
- No se modificaron títulos, organizaciones, slugs, categorías, contacto, ubicación, estado ni relaciones de categoría.
- No se archivó ni eliminó ningún recurso.

Verificación final de la etapa:

- 38 IDs esperados y 152 valores esperados aplicados correctamente.
- 0 valores divergentes, 0 campos inesperados y 0 registros faltantes.
- 0 alertas restantes de prosa concatenada.
- Los hallazgos editoriales activos bajaron de 357 a 255; además de las 100 alertas objetivo, desaparecieron dos señales heurísticas de categoría causadas por el texto contaminado.
- La base conserva 728 registros: 385 publicados, 296 borradores y 47 archivados.

Los resultados posteriores están en `post-stage-4/` y el lote aplicado está documentado en `stage-4-prose-operations.json`.

## Estado de remediación — etapa 5

La corrección bilingüe y actualización de fuentes concretas se aplicó y verificó el 3 de septiembre de 2026:

- Se revisaron cinco recursos publicados con fuentes oficiales actuales: Consulado General de México en Austin, Lincoln-Goldfinch Law, Open Door de University United Methodist Church, Loaves & Fishes de All Saints y UPLift.
- Se corrigieron seis inconsistencias activas: tres descripciones idénticas entre idiomas, un resumen idéntico y dos horarios presentes solo en español.
- Lincoln-Goldfinch recibió resúmenes y descripciones bilingües útiles en lugar de `Sitio web`, además de horario y fuente oficial del área de práctica.
- El Consulado recibió una descripción bilingüe, horario, correo corregido, idioma respaldado y fuente oficial de servicios para personas mexicanas.
- Open Door recibió descripción natural, horario oficial actualizado a sábados de 8:00 a 9:30 a.m. y su ubicación real de servicio.
- Loaves & Fishes recibió contenido conciso y horario oficial actualizado: martes de 9:00 a 11:00 a.m., con atención a visitantes desde las 9:30 a.m.
- UPLift se ajustó al programa vigente de asistencia Plus 1 para facturas residenciales de Austin Energy. Se retiraron el evento presencial y la dirección corrupta que provenían de información antigua, y se añadieron requisitos y pasos respaldados por la fuente oficial.
- Los cinco teléfonos señalados como `phone_not_dashed` se conservaron porque ya tienen formato correcto y únicamente incluyen extensiones válidas.

Verificación final de la etapa:

- 5 IDs actualizados mediante 72 valores aprobados.
- 0 campos inesperados y 0 registros faltantes.
- El trigger de geocodificación asignó `needs_review` a UPLift al retirar su dirección. La base no permite `null` en ese campo; la dirección y las coordenadas permanecen vacías, por lo que no se presenta una ubicación falsa.
- 0 inconsistencias bilingües activas en resúmenes, descripciones u horarios.
- Los hallazgos editoriales activos bajaron de 255 a 248; también desapareció una señal heurística de categoría causada por el contenido antiguo de UPLift.
- La base conserva 728 registros: 385 publicados, 296 borradores y 47 archivados.

Los resultados posteriores están en `post-stage-5/` y el lote aplicado está documentado en `stage-5-bilingual-and-source-operations.json`.

## Estado de remediación — etapa 6

La revisión de procedencia, contacto y vigencia de borradores se aplicó y verificó el 3 de septiembre de 2026:

- Se completó un sitio o método de contacto público para 30 borradores que ya tenían un localizador oficial verificado; no se usó el documento privado de origen como contacto público.
- Se investigaron individualmente los 18 borradores que carecían de fuente. Se actualizaron 12 recursos vigentes con fuentes oficiales, contacto y contenido corregido cuando la fuente demostraba que el registro importado estaba desactualizado o mal identificado.
- Se consolidaron tres registros de Family Crisis Center en uno canónico, sin publicar la ubicación confidencial del refugio. El canónico ahora identifica claramente el servicio para sobrevivientes de violencia y su cobertura de Bastrop, Colorado, Fayette y Lee.
- Se archivaron los borradores duplicados de All Saints Episcopal Church y UPLift porque sus equivalentes publicados ya estaban verificados.
- Se archivaron cuatro borradores sin actividad ni referidos que ya no representaban servicios verificables: Switzer Senior Center, Experience Works, Stella's House y el programa cerrado Texas Utility Help.
- St. Matthew's Episcopal Church se conservó y corrigió al vigente Good Faith Fund; la fuente oficial confirma asistencia para facturas de servicios públicos a residentes de Austin.
- También se verificaron y corrigieron los registros de CareConnect USA, Madella Hilliard Neighborhood Center, Community Action CEAP, St. Vincent de Paul en Lockhart y Sacred Heart, VA Health Care Enrollment, CCSCT Veterans Financial Assistance y Baptist Community Center Mission.
- La herramienta de consolidación ahora admite operaciones de archivo cuyo recurso canónico no necesita cambios de campos, evitando que un parche vacío interrumpa futuros lotes.

Verificación final de la etapa:

- 42 borradores enriquecidos: 30 en el lote de contacto y 12 en el lote de investigación individual.
- 8 borradores archivados y 0 eliminaciones permanentes.
- 0 cambios fuera de los IDs autorizados y 0 valores divergentes; cuatro diferencias aparentes en `archived_at` fueron únicamente representaciones ISO equivalentes (`Z` y `+00:00`).
- Los borradores activos quedaron con 0 fuentes faltantes, 0 fechas de verificación faltantes y 0 recursos sin método de contacto público.
- Los hallazgos editoriales activos bajaron de 248 a 247.
- La base conserva 728 registros: 385 publicados, 288 borradores y 55 archivados.

Los resultados posteriores están en `post-stage-6/`. Los lotes y su recuperación idempotente están documentados en `stage-6-public-contact-operations.json`, `stage-6-verified-resource-operations.json` y `stage-6b-pending-operations.json`.

## Estado de remediación — etapa 7

La primera revisión de coherencia entre dirección y método presencial se aplicó y verificó el 3 de septiembre de 2026:

- Se revisaron individualmente los 26 recursos activos que tenían una dirección pero no declaraban atención presencial.
- En 9 recursos la dirección sí corresponde a un lugar donde ocurre el servicio —clínicas, consejería, acceso a computadoras, servicios de SAFE, Manos de Cristo y paradas de transporte— y se añadió `in_person` conservando los demás métodos.
- En 17 recursos la dirección correspondía a una sede administrativa, distrito, iglesia u oficina que no estaba respaldada como punto de acceso al servicio. Se retiraron dirección, ciudad, estado, ZIP, condado y coordenadas para evitar enviarlos a una ubicación engañosa.
- Entre las direcciones retiradas están sedes administrativas asociadas a servicios por teléfono o internet, programas de reparación en el hogar, referidos legales, registros en línea y conferencias de St. Vincent de Paul cuyo acceso documentado es por teléfono o visita domiciliaria.
- No se cambió el área de cobertura: retirar una sede no elimina los condados donde el programa presta servicio.
- No se archivó ni eliminó ningún recurso.

Verificación final de la etapa:

- 26 IDs esperados actualizados y 0 cambios fuera del lote.
- 0 valores divergentes y 0 registros faltantes.
- 0 recursos activos con dirección física pero sin `in_person`; el único aviso automático restante pertenece a un recurso archivado.
- Las señales editoriales activas bajaron de 247 a 218.
- Las señales de dirección compartida bajaron de 26 a 24.
- Quedan 117 recursos activos con `in_person` pero sin dirección. No se corrigieron en bloque porque incluyen transporte, servicios móviles, múltiples sedes, atención en escuelas y ubicaciones confidenciales; requieren clasificación antes de añadir una dirección o retirar el método.
- La base conserva 728 registros: 385 publicados, 288 borradores y 55 archivados.

Los resultados posteriores están en `post-stage-7/` y el lote aplicado está documentado en `stage-7-address-method-operations.json`.

## Estado de remediación — etapa 8

La clasificación de servicios presenciales sin una única dirección pública se aplicó y verificó el 3 de septiembre de 2026:

- Se revisaron y documentaron 36 excepciones legítimas: 35 servicios con ubicación variable o múltiples sedes y 1 refugio con ubicación confidencial.
- Las excepciones incluyen 12 servicios de transporte, localizadores y clínicas móviles, WIC y Head Start con múltiples sedes, redes de clínicas y centros, programas prestados en distintas escuelas, Meals on Wheels y otros servicios cuya naturaleza no admite una sola dirección representativa.
- Se conservó `in_person` porque el servicio sí ocurre presencialmente; no se añadió una sede administrativa, una dirección arbitraria ni un punto central falso.
- Cada excepción quedó identificada en `verification_notes` con una marca interna de revisión de ubicación. La auditoría ahora reconoce únicamente esas marcas explícitas; no omite automáticamente cualquier registro sin dirección.
- Las mismas reglas se añadieron al skill del importador y a su paquete de instrucciones para ChatGPT.
- No se modificaron títulos, contenido público, métodos, direcciones, coordenadas, estados ni relaciones de categoría.
- No se archivó ni eliminó ningún recurso.

Verificación final de la etapa:

- 36 IDs esperados actualizados y 0 cambios fuera del lote.
- 0 valores divergentes y 0 registros faltantes.
- El generador es idempotente: una segunda ejecución produjo 0 operaciones.
- Los casos activos `in_person` sin dirección pendientes de revisión bajaron de 117 a 81.
- Los 10 borradores que estaban en esta clase quedaron clasificados; los 81 restantes son recursos publicados que requieren una dirección confirmada o una corrección real del método.
- Las señales editoriales activas bajaron de 218 a 182.
- La base conserva 728 registros: 385 publicados, 288 borradores y 55 archivados.

Los resultados posteriores están en `post-stage-8/` y el lote aplicado está documentado en `stage-8-variable-location-operations.json`.

## Estado de remediación — etapa 9

La primera revisión de recursos publicados con atención presencial y sin una dirección pública se aplicó y verificó el 3 de septiembre de 2026:

- Se investigaron individualmente 21 recursos usando fuentes oficiales actuales.
- Se añadieron 13 ubicaciones operativas confirmadas, entre ellas Sacred Heart Community Clinic, Operation Liberty Hill, Cross Creek Hospital, Boys & Girls Club de Georgetown, Candlelight Ranch, Rowing Dock, Westcave Preserve, Zilker Botanical Garden, Austin Creative Reuse, Austin Clubhouse, The Christi Center, Helping Hand Home y Austin Child Guidance Center.
- En 7 recursos se confirmó que el servicio ocurre en múltiples lugares o en ubicaciones variables; se conservó `in_person` y se documentó la excepción sin inventar una sede única. Esto incluye Center for Child Protection, LifeWorks, Crux, Explore Austin, capacitación de Williamson County Children's Advocacy Center y dos programas de asistencia de servicios públicos.
- Dress for Success Austin se consolidó en un recurso canónico con contenido bilingüe limpio, fuente oficial y ubicación de citas corregida. Se archivó la copia genérica; ninguno de los dos registros tenía actividad ni referidos.
- Los dos recursos de Williamson County Children's Advocacy Center se conservaron porque representan servicios distintos: capacitación preventiva y atención directa a menores víctimas de abuso.
- No se asignó automáticamente un condado a Operation Liberty Hill: el ZIP 78641 cruza límites administrativos y la fuente consultada no respaldaba una inferencia precisa para ese punto.
- No hubo eliminaciones permanentes.

Verificación final de la etapa:

- 21 operaciones aplicadas sobre 22 IDs: 21 canónicos y 1 duplicado archivado.
- 0 cambios fuera del lote, 0 valores divergentes y 0 registros faltantes.
- El generador es idempotente: la segunda ejecución produjo 0 operaciones.
- Los casos publicados pendientes de `in_person` sin dirección bajaron de 81 a 60.
- Las señales editoriales activas bajaron de 182 a 160.
- La base conserva 728 registros: 384 publicados, 288 borradores y 56 archivados.

Los resultados posteriores están en `post-stage-9/` y el lote aplicado está documentado en `stage-9-published-location-operations.json`.

## Estado de remediación — etapa 10

La segunda revisión de recursos publicados con atención presencial y sin una dirección pública se aplicó y verificó el 3 de septiembre de 2026:

- Se investigaron y actualizaron 11 recursos publicados usando páginas oficiales actuales.
- Family Recovery Court recibió su dirección física y teléfono oficiales en Georgetown.
- Diez servicios quedaron clasificados como atención en ubicaciones variables o múltiples: Williamson County Indigent Defense, Con Mi MADRE, CARY, Live Like Cati, Foster Village, USCIS, LASSA, Texas Parks and Wildlife, Girl Scouts of Central Texas y Breakthrough Central Texas.
- En esos casos se preservó `in_person` porque la atención sí puede ocurrir presencialmente, pero depende del tribunal, escuela, campamento, centro de recursos, organización aliada, cita o sede asignada. No se usó una oficina administrativa como ubicación representativa.
- Se reemplazaron siete títulos genéricos o institucionalmente redundantes por títulos bilingües específicos del servicio.
- Se reescribieron resúmenes y descripciones importados que estaban truncados, excesivamente largos o no identificaban claramente la ayuda ofrecida.
- LASSA quedó documentado con acceso telefónico y atención coordinada en refugios y centros de crisis; USCIS conserva el localizador oficial porque su oficina depende del trámite y la cita.
- No se archivó ni eliminó ningún recurso.

Verificación final de la etapa:

- 11 IDs esperados actualizados y 0 cambios fuera del lote.
- 0 valores divergentes y 0 registros faltantes.
- El generador es idempotente: la segunda ejecución produjo 0 operaciones.
- Los casos publicados pendientes de `in_person` sin dirección bajaron de 60 a 49.
- Las señales editoriales activas bajaron de 160 a 149.
- La base conserva 728 registros: 384 publicados, 288 borradores y 56 archivados.

Los resultados posteriores están en `post-stage-10/` y el lote aplicado está documentado en `stage-10-published-location-operations.json`.
