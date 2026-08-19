-- Initial one-time coordinates for published resources with complete addresses.
-- Source: U.S. Census Bureau Geocoder, Public_AR_Current / Current_Current.
-- Generated 2026-08-07 and matched against each stored street/city/state/ZIP.
-- These rows remain reviewable in the admin resource form.

with geocoded(slug, latitude, longitude) as (values
  ('servicios-legales-de-inmigracion-american-gateways', 30.328620303098, -97.711788000064),
  ('apoyo-integral-para-familias-con-ninos-any-baby-can', 30.320783191944, -97.700966117456),
  ('comidas-calientes-y-duchas-en-angel-house-austin-baptist-chapel', 30.260916608741, -97.735384901884),
  ('tarifas-reducidas-equifare-capmetro', 30.279809865130, -97.742194637845),
  ('clases-de-ingles-y-alfabetizacion-digital-el-buen-samaritano', 30.198758749054, -97.801212687165),
  ('despensa-de-alimentos-y-distribucion-de-panales-el-buen-samaritano', 30.198758749054, -97.801212687165),
  ('asesoria-financiera-y-apoyo-con-beneficios-foundation-communities', 30.381008351149, -97.685002867729),
  ('vivienda-publica-y-subsidiada-housing-authority-of-the-city-of-austin', 30.247403279827, -97.735685596448),
  ('clinica-de-salud-ben-white-lone-star-circle-of-care', 30.227322029935, -97.778467421065),
  ('atencion-medica-familiar-de-bajo-costo-people-s-community-clinic', 30.324875579805, -97.700194597664),
  ('asistencia-legal-civil-gratuita-texas-riogrande-legal-aid', 26.148888224367, -97.913507560885),
  ('ayuda-legal-civil-con-abogados-voluntarios-volunteer-legal-services-of-central-texas', 30.336355470187, -97.677208891999)
)
update public.resources as resource
set latitude = geocoded.latitude,
    longitude = geocoded.longitude,
    geocoded_at = now(),
    geocode_status = 'success'
from geocoded
where resource.slug = geocoded.slug
  and resource.address_line_1 is not null
  and btrim(resource.address_line_1) <> '';
