# Buscador de Recursos

## Purpose

`/buscador` is a public, mobile-first resource locator. A visitor supplies a supported five-digit ZIP code and an optional existing Puente ATX category. The page uses the ZIP centroid as an approximate search origin, calculates straight-line distance to published resources, and keeps a compact result list synchronized with the map.

The initial service region contains Travis, Williamson, Bastrop, Hays, and Caldwell counties. This is a discovery aid, not turn-by-turn routing, and the displayed distance is approximate.

## Architecture

- Route: `/buscador?zip=78626&categoria=comida`
- Page: `src/components/resource-finder/ResourceFinderPage.jsx`
- Form: `ResourceSearchForm.jsx`
- Results: `ResourceResultsPanel.jsx` and `CompactResourceCard.jsx`
- Map: `ResourceMap.jsx`
- Geographic calculations: `src/utils/geo.js`
- ZIP configuration: `src/config/serviceAreas.js`
- Official centroid dataset: `src/config/centralTexasZipCentroids.js`
- Finder settings: `src/config/resourceFinder.js`
- Repository operation: `getResourceFinderData`

`selectedResourceId` is the single selection source of truth. Selecting a marker reveals its card; selecting a card pans the map without an aggressive zoom.

## Map choice

The MVP uses MapLibre GL JS 3.x. It provides custom HTML markers, `fitBounds`, pan, zoom, keyboard-compatible controls, and responsive rendering without a paid Google Maps account. The default style is OpenFreeMap Liberty and can be replaced with `VITE_MAP_STYLE_URL`. No private map key is stored in the browser.

The map is supplemental. The list contains all essential resource information and remains usable when the map or style provider is unavailable.

## ZIP data and regional expansion

Centroids were generated from the [U.S. Census Bureau 2024 Gazetteer](https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.html) and the [2020 ZCTA-to-County Relationship File](https://www.census.gov/geographies/reference-files/time-series/geo/relationship-files.html). The generated configuration currently contains 100 ZCTAs associated with the five launch counties. ZIP centroids are approximate geographic origins; they are not visitor locations and do not imply that a resource serves the entire ZIP.

To expand the region:

1. Add the approved county FIPS to the generation workflow.
2. Regenerate `centralTexasZipCentroids.js` from the same official sources.
3. Review boundary ZIPs that overlap more than one county.
4. Add resources for the new county and geocode their physical service locations.
5. Test representative urban and rural ZIP searches.

## Resource coordinates

Public searches never geocode an address in real time. Each physical resource must be geocoded once, reviewed, and stored in the existing `resources.latitude` and `resources.longitude` columns. Migration `009_resource_geocoding_status.sql` adds:

- `geocoded_at timestamptz`: when the address was last geocoded;
- `geocode_status text`: `pending`, `success`, `failed`, `needs_review`, or `not_applicable`.

Recommended workflow:

1. Run migration 009 in Supabase.
2. Export resources whose status is `pending` or `needs_review`.
3. Confirm complete street address, city, state, and ZIP.
4. Geocode once using an approved batch workflow.
5. Review ambiguous matches before saving coordinates.
6. Set `geocoded_at` and `geocode_status = 'success'`.
7. Mark remote-only phone/online services as `not_applicable`.

Migration `010_seed_reviewed_resource_coordinates.sql` supplies the initial Census-geocoder matches for the currently published resources that already have complete physical addresses. It deliberately leaves directory-wide, remote, mobile, and incomplete-address resources unmapped until an appropriate public service location is confirmed.

Migration `016_seed_williamson_resource_coordinates.sql` adds the unique Census-geocoder matches for Williamson-area resources imported later. Addresses with no unique match remain unpositioned and are marked `needs_review`; the application does not substitute a ZIP centroid for a physical service location.

Changing a physical address should reset the status to `pending` until its coordinates are refreshed. Coordinates are administrative data; public repository reads only request latitude and longitude.

## Search behavior

- Initial radius: 15 miles
- First expansion: 30 miles
- Regional expansion: 50 miles
- Distance: Haversine straight-line miles
- Sort: nearest first
- Category values: loaded from the existing categories table
- Unsupported ZIP: inline validation message
- Resource without coordinates: excluded from mapped results and counted in a transparent location-review notice

The initial implementation loads the currently small published resource set through the repository and computes distance locally. Before the directory grows substantially, replace that read with a paginated PostGIS/RPC proximity query so the browser does not download the full directory.

## Analytics

The finder reuses `trackPuenteEvent()` and records:

- `search_submitted`
- `search_no_results`
- `resource_selected`
- `resource_viewed`

Payloads use the existing allowlist and include only approved resource/category identifiers, result count, and ZIP area code. No GPS, IP-derived location, address, phone, or user identity is recorded.

## Accessibility and responsive behavior

- Real labels and native form controls
- Keyboard-selectable cards and markers
- Visible focus and selection not communicated by color alone
- Reduced-motion fallback for the ZIP pulse
- Complete list alternative when the map fails
- Desktop split: 38% list / 62% map
- Mobile toggle: List / Map, with only one map instance mounted

## Environment

Optional public environment variable:

```text
VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

The value is a public map style URL, not a secret.

## Known launch dependency

The existing production resources must receive reviewed latitude/longitude values before useful map results appear. The interface intentionally does not invent coordinates or silently use organization ZIP centroids as resource locations.
