# Insights map methodology

## What the map represents

“Necesidades por área” displays aggregate counts of `search_submitted` events where a visitor voluntarily selected an allowed five-digit area ZIP. It describes observable search activity.

It does not represent individual people, home addresses, GPS locations, IP geolocation, resource locations, confirmed demand, service delivery or social impact.

## Area collection

The public resource filters offer an optional “Area or ZIP code” selection. Allowed values are centralized in `src/config/serviceAreas.js`. “Toda el área” and “Prefiero no indicarlo” produce no stored ZIP. No address or free-form geographic text is accepted.

## Geographic file

File: `public/maps/austin-travis-zip-codes.geojson`.

The file contains 63 Census ZIP Code Tabulation Area polygons intersecting Travis County. The embedded metadata identifies:

- U.S. Census Bureau ZCTA5 2010 geometry;
- Travis County FIPS 48453 selection boundary;
- WGS84 coordinates;
- `zip_code` as the join property;
- the limitation that ZCTA boundaries approximate USPS ZIP service areas.

The map has no third-party basemap, tiles, API key, streets, businesses or points.

## Suppression

An area is visible only when it has both:

- at least 20 search events; and
- at least 10 distinct anonymous sessions.

The PostgreSQL aggregate applies both thresholds before returning data. A suppressed ZIP returns no exact event or session count. It appears neutrally as “Datos insuficientes.”

CSV export includes only areas meeting both thresholds.

## Updating the GeoJSON

1. Obtain an approved public geographic source.
2. Preserve five-digit strings under `properties.zip_code`.
3. Use Polygon or MultiPolygon geometry in EPSG:4326.
4. Update the top-level provenance metadata.
5. Validate all configured active ZIP codes against the features.
6. Run map join, invalid-file, privacy-threshold and accessible-table tests.
7. Review visual rendering without adding external tiles.

