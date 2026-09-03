# Reporte de importación piloto — Bluebonnet Project HOPE

Fecha: 2026-09-02

## Resultado

- Filas preparadas: 221
- Registros de despensas: 111
- Registros de otros recursos/programas: 110
- Duplicados exactos entre hojas: consolidados por organización, servicio y ubicación.
- Archivo piloto: `bluebonnet-project-hope-pilot-import.csv`.
- Validación: 45/45 encabezados, 221 acciones `create`, 0 errores y 0 warnings del importador.
- Excepción de partnership: las 221 filas se incluyen en el archivo piloto aunque 287 avisos de calidad permanezcan visibles.
- Publicación: **no realizada**. El CSV queda para vista previa e importación administrativa.

## Cobertura geográfica

- Se añadieron Lee, Fayette, Gonzales y Guadalupe al modelo de condados y ZIPs.
- Se conservó Burnet porque también contiene recursos suministrados en los documentos.
- El dataset geográfico ahora contiene 140 ZCTAs distribuidos entre Travis, Williamson, Bastrop, Hays, Caldwell, Burnet, Lee, Fayette, Gonzales y Guadalupe.
- Después de pasar por el normalizador real, las 221 filas conservan al menos un área de servicio; ninguna queda con el área vacía.
- Fuentes: U.S. Census Bureau 2024 Gazetteer y 2020 ZCTA-to-County Relationship File.
- Se enviaron 147 direcciones públicas al geocodificador oficial del Census Bureau: 110 coincidencias únicas recibieron coordenadas; 28 no tuvieron coincidencia y 9 devolvieron resultados ambiguos que se dejaron sin coordenadas.
- Las 221 filas podrán aparecer en la lista del buscador. Solo las 110 ubicaciones confirmadas tendrán marcador; las demás se mostrarán como atención remota o ubicación pendiente, sin inventar puntos en el mapa.
- El detalle reproducible de la geocodificación está en `census-geocoding-audit.csv`.

## Decisiones y límites

- Los encabezados de sección se excluyeron.
- Las repeticiones del mismo programa en varias hojas se consolidaron y sus condados se combinaron.
- Variantes con servicios materialmente distintos se conservaron como recursos separados.
- Solo se colocaron direcciones que parecen ubicaciones físicas; frases como “contact via phone” o áreas de servicio no se convirtieron en direcciones.
- No se inventaron horarios, costos, elegibilidad ni documentos.
- Las descripciones en español resumen prudentemente el tipo de servicio; el detalle original se conserva en inglés para revisión.
- Los teléfonos y correos se extrajeron del material fuente.
- Una fecha de verificación solo se incluyó cuando venía expresamente en el archivo de despensas.
- Los condados de todas las hojas suministradas ya son reconocidos por el normalizador y el selector público.
- Los avisos siguientes no excluyen filas de este piloto; se conservan para que el equipo pueda completar la verificación posteriormente.

## Elementos que requieren revisión humana

- Sin fuente web: San Gabriel Unitarian Universalist Fellowship (Williamson)
- Sin fuente web: Manna Food Pantry (Williamson)
- Sin fuente web: City Reach Church (Williamson)
- Sin fuente web: Live Oak Unitarian Universalist Church (Williamson)
- Sin fuente web: Rockbridge Church (Williamson)
- Sin fuente web: Hill Country Community Ministries (Williamson)
- Sin fuente web: Zion Chapel Missionary Baptist Church (Williamson)
- Sin fuente web: Jarrell ISD Cafeteria (Williamson)
- Sin fuente web: Knights of Columbus Hall (Williamson)
- Sin fuente web: Florence High School (Williamson)
- Sin fuente web: Helping Hands of Georgetown (Williamson)
- Sin fuente web: Helping Hands with coordination of various churches (Williamson)
- Sin fuente web: Kat Kares (Williamson)
- Sin fuente web: Shoreline - North Austin Mobile Pantry (Travis)
- Sin fuente web: Foundation Communities - Cardinal Point (Travis)
- Sin fuente web: St. Vincent De Paul - Diocesan Council of Asutin (Travis)
- Sin fuente web: St. Stephens Missionary Baptist Church drive thru pantry (Travis)
- Sin fuente web: Bethany United Methodist Church (Travis)
- Sin fuente web: South Austin Church of the Nazarene (Travis)
- Sin fuente web: Pflugerville Mobile Food Pantry (Travis)
- Sin fuente web: FBC Pflugerville (Travis)
- Sin fuente web: St. Elizabeth Catholic Church Society of St. Vincent De Paul (Travis)
- Sin fuente web: First United Methodist Church - Paula's Food Pantry and Clothes Closet (Travis)
- Sin fuente web: Travis Co. Jonestown Community Center (Travis)
- Sin fuente web: UT School of Nursing: Social Resource Center (Travis)
- Sin fuente web: The Charlie Center (located in Mosaic Church) (Travis)
- Sin fuente web: Austin Baptist Chapel - Angel House Soup Kitchen (Travis)
- Sin fuente web: Feed the Need - Stony Point (Travis)
- Sin fuente web: Community Cupboard (Elgin) (Bastrop)
- Sin fuente web: First Baptist Church of Elgin (Bastrop)
- Sin fuente web: First Baptist Church of Bastrop (Bastrop)
- Sin fuente web: Grace Baptist Church of Red Rock (Bastrop)
- Sin fuente web: Seventh Day Adventist Food Pantry (Bastrop)
- Sin fuente web: McDade Food Pantry (Bastrop)
- Sin fuente web: Apostolic Christian Church of Bastrop (Bastrop)
- Sin fuente web: Cedar Creek United Methodist Church (Bastrop)
- Sin fuente web: Sacred Heart Catholic Church (Elgin)- Society of St. Vincent De Paul (Bastrop)
- Sin fuente web: Feed the Need - Bastrop North (Bastrop)
- Sin fuente web: Feed the Need - Bastrop South (Bastrop)
- Sin fuente web: Feed the Need - Smithville (Bastrop)
- Sin fuente web: Caldwell County Chrstian Ministries Food Pantry (Caldwell)
- Sin fuente web: Luling Mobile Food Pantry (Caldwell)
- Sin fuente web: Delivering Hope Resource Center (Caldwell)
- Sin fuente web: The Bread Basket Ministry of First Baptist Church (Caldwell)
- Sin fuente web: Fayette County Community Action Food Pantry (Fayette)
- Sin fuente web: Schulenberg Area Food Pantry (Fayette)
- Sin fuente web: Gonzales Christian Assistance Ministry (Gonzales)
- Sin fuente web: San Antonio Food Bank Partner Network (Gonzales)
- Sin fuente web: San Antonio Food Bank (Guadalupe)
- Sin fuente web: Burnet County Hunger Alliance (Burnet)
- Sin fuente web: Helping Center of Marble Falls (Burnet)
- Sin fuente verificable: Switzer Senior Center (Williamson)
- Sin fuente verificable: Madella Hilliard Neighborhood Center (Williamson)
- Sin fuente verificable: Mortgage Relief Helpline (Williamson)
- Sin fuente verificable: Debt Relief Hotline (Williamson, Bastrop, Caldwell, Fayette, Gonzales, Guadalupe, Lee, Burnet, Travis)
- Sin fuente verificable: Free Bankruptcy Advice (Williamson, Bastrop, Caldwell, Fayette, Gonzales, Guadalupe, Lee, Burnet, Travis)
- Sin fuente verificable: Department of Health and Human Services (Williamson, Bastrop, Caldwell, Fayette, Gonzales, Guadalupe, Lee, Burnet, Travis)
- Revisar ubicaciones múltiples: Social Security Administration — 8 variantes.
- Revisar ubicaciones múltiples: VA Mental Health Residential Program — 2 variantes.
- Sin fuente verificable: Cedar Park VA Clinic (Williamson)
- Sin fuente verificable: National Sexual Assault Legal Hotline (Williamson, Bastrop, Caldwell, Fayette, Gonzales, Guadalupe, Lee, Burnet, Travis)
- Revisar ubicaciones múltiples: Texas Workforce Solutions — 5 variantes.
- Sin fuente verificable: Experience Works: Work Force Solutions (Williamson)
- Sin fuente verificable: GoodWill Industries of CT : Round Rock Job Center (Williamson)
- Sin fuente verificable: GoodWill Industries of CT : Georgetown Job Center (Williamson)
- Revisar ubicaciones múltiples: Lone Star Circle of Care — 2 variantes.
- Sin fuente verificable: Discount Prescription Hotline (Williamson, Bastrop, Caldwell, Fayette, Gonzales, Guadalupe, Lee, Burnet, Travis)
- Sin fuente verificable: Bluebonnet Trails (OSAR) Outreach, Screening, Assessment, and Referral (Williamson)
- Revisar ubicaciones múltiples: The Kind Clinic — 2 variantes.
- Sin fuente verificable: Mortgage Relief Helpline: Care Connect USA (Bastrop, Caldwell, Fayette, Gonzales, Guadalupe, Lee, Burnet, Travis)
- Sin fuente verificable: GoodWill Industries: Bastrop Job Help Center (Bastrop)
- Sin fuente verificable: OSAR (Bastrop, Caldwell, Fayette, Gonzales, Guadalupe, Lee, Burnet, Travis)
- Sin fuente verificable: Bastrop Women's Shelter (Bastrop, Fayette, Lee)
- Revisar ubicaciones múltiples: Family Crisis Center — 3 variantes.
- Sin fuente verificable: Comprehensive Energy Assistance Program (Caldwell)
- Sin fuente verificable: St. Vincent De Paul (Caldwell)
- Sin fuente verificable: Enrollment Department Call Center (Fayette)
- Sin fuente verificable: LaGrange VA Clinic (Fayette)
- Sin fuente verificable: Gonzales Christian Assistance Ministry (Gonzales)
- Sin fuente verificable: Stella's House (Refuge) (Gonzales)
- Sin fuente verificable: Community Council of South Central Texas - Veterans Financial Assistance (Guadalupe)
- Sin fuente verificable: St. Vincent De Paul Church (Travis)
- Sin fuente verificable: All Saints Episcopal Church (Travis)
- Sin fuente verificable: Baptist Community Center (Travis)
- Sin fuente verificable: Travis County Family Support Services
(Palm Square Office) (Travis)
- Sin fuente verificable: UpLift at University Presbyterian Church (Travis)
- Sin fuente verificable: St. Matthews Episcopal Church (Travis)
- Sin fuente verificable: Austin VA Clinic (Travis)
- Sin fuente verificable: Travis County Family Support Services
(Palm Square Office) (Travis)
- Sin fuente verificable: Salvation Army (Travis)
- Sin fuente verificable: SAFE Alliance (Travis)
