# Revisión — oficinas públicas

- Archivo fuente: `/Users/alejandro_vega/Desktop/puente-public-offices-recursos-import.csv`
- Recursos candidatos: 38
- Errores del importador: 0
- Slugs duplicados internos: 0
- Recursos sin fuente oficial: 13
- Recursos sin fecha de verificación: 38

## Cambios aplicados

- Se normalizaron categorías, métodos, idiomas, costos y listas al esquema vivo del importador.
- Se normalizaron las áreas a condados; los servicios estatales o federales quedaron como "Todos los condados de Texas".
- Se eliminaron teléfonos de siete resúmenes; los teléfonos principales permanecen en el campo `phone`.
- Se reemplazó una nota interna sobre una fotografía fuente en Travis County Law Library.
- Se completaron traducciones puntuales que permanecían únicamente en inglés.
- No se inventaron fuentes, fechas de verificación ni coordenadas.

## Revisión antes de publicar

Este archivo puede importarse como borrador. Antes de publicar, verifica las 13 filas sin `source_url` y registra `last_verified_at` después de confirmar cada recurso con una fuente oficial.

### Sin fuente oficial

- Fila 3: Austin Energy Facilities (`austin-energy-facilities`)
- Fila 4: One Texas Center (`one-texas-center`)
- Fila 5: Austin Water – Principal / Waller Creek Center (`austin-water-main-waller-creek-center`)
- Fila 6: Austin Water – Servicio al Cliente / TAPS (`austin-water-customer-service-taps`)
- Fila 7: Austin Water – Protección del Agua, Residuos Industriales y Pozos (`austin-water-water-protection-industrial-waste-control-water-wells`)
- Fila 8: Austin Water – Permisos e Inspecciones de Sistemas Sépticos (`austin-water-septic-tank-permits-inspections-service-requests`)
- Fila 9: Austin Water – Quejas por Descargas de Aguas Residuales (`austin-water-open-sewage-complaints`)
- Fila 31: Williamson County Clerk – Registros (`williamson-county-clerk-records`)
- Fila 32: Hays County Clerk (`hays-county-clerk`)
- Fila 33: Bastrop County Clerk (`bastrop-county-clerk`)
- Fila 34: Bexar County Clerk (`bexar-county-clerk`)
- Fila 35: Blanco County Clerk (`blanco-county-clerk`)
- Fila 36: Harris County Clerk (`harris-county-clerk`)
