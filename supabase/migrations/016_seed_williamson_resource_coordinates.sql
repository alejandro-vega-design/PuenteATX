-- One-time coordinates for Williamson-area resources imported after migration 010.
-- Source: U.S. Census Bureau Geocoder, Public_AR_Current.
-- Generated 2026-08-10 from the exact public addresses stored in resources.
-- Only unique address matches are included. Existing reviewed coordinates are preserved.

with geocoded(slug, latitude, longitude) as (values
  ('lone-star-circle-of-care-georgetown', 30.659831397609, -97.689146455982),
  ('growing-heart-liberty-hill', 30.663166257521, -97.889515773751),
  ('programa-de-consejeria-hope-texas-baptist-children-s-home', 30.518300445659, -97.683005353582),
  ('williamson-county-outpatient-services', 30.647464152189, -97.677128984218),
  ('bluebonnet-trails-mental-health', 30.515828749185, -97.671186841644),
  ('lone-star-circle-of-care-georgetown-behavioral-health', 30.659831397609, -97.689146455982),
  ('starry-williamson-county', 30.626375517074, -97.687611090441),
  ('hill-country-community-ministries', 30.565518895963, -97.849243821789),
  ('taylor-housing-authority', 30.573805430759, -97.406870697997),
  ('opportunities-williamson-burnet-counties', 30.619334151063, -97.670418401313),
  ('hope-counseling-program-williamson-county', 30.518300445659, -97.683005353582),
  ('hutto-resource-center', 30.546322121743, -97.544703927664),
  ('round-rock-area-serving-center', 30.511317710596, -97.668121952471),
  ('lone-star-circle-of-care-round-rock-behavioral-health', 30.530718925033, -97.689160526106),
  ('community-medical-services-cedar-park', 30.530885636596, -97.801359616303),
  ('oakvine-recovery-center', 30.496244539091, -97.646820142632),
  ('yellow-house-foundation', 30.568262989792, -97.845504168474),
  ('central-texas-treatment-center', 30.722133980553, -97.434429275538),
  ('bluebonnet-trails-substance-use-services', 30.515828749185, -97.671186841644),
  ('williamson-county-community-resource-center-liberty-hill', 30.670986867323, -97.930633084285),
  ('the-caring-place', 30.626922320429, -97.684634871524),
  ('carts-williamson-county', 30.666007335468, -97.907318608582),
  ('texas-legal-services-center-williamson-county', 30.242017119414, -97.728283299534),
  ('liberty-hill-isd-family-student-support', 30.666136732219, -97.921707873869),
  ('round-rock-housing-authority', 30.514553190461, -97.663106587226),
  ('georgetown-housing-authority', 30.627664056665, -97.678042043380)
)
update public.resources as resource
set latitude = geocoded.latitude,
    longitude = geocoded.longitude,
    geocoded_at = now(),
    geocode_status = 'success'
from geocoded
where resource.slug = geocoded.slug
  and coalesce(btrim(resource.address_line_1), '') <> ''
  and (resource.latitude is null or resource.longitude is null);

-- These locations need a manual address review before a point can be shown.
update public.resources
set geocode_status = 'needs_review',
    geocoded_at = null
where slug in (
  'starry-carver-center-for-families',
  'rock-ride-on-center-georgetown',
  'williamson-county-juvenile-services-mental-health-family-support',
  'georgetown-project-nest-empowerment-center',
  'catholic-charities-immigration-legal-services-georgetown'
)
  and (latitude is null or longitude is null);
