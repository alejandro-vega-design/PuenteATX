-- Puente ATX Insights — datos ficticios para explorar el dashboard.
--
-- IMPORTANTE:
-- - Inserta eventos solamente en el entorno "preview".
-- - No modifica recursos, categorías ni usuarios.
-- - No contiene información personal.
-- - Puede ejecutarse nuevamente: primero elimina únicamente este mismo seed.
-- - Para retirarlo, ejecuta supabase/demo/clear_insights_preview.sql.

begin;

delete from public.analytics_events
where environment = 'preview'
  and metadata ->> 'demo_seed' = 'puente-atx-insights-v1';

create temporary table demo_sessions (
  session_number integer primary key,
  session_id uuid not null,
  language text not null,
  device_type text not null
) on commit drop;

insert into demo_sessions (session_number, session_id, language, device_type)
select
  number,
  gen_random_uuid(),
  case when number % 4 = 0 then 'en' else 'es' end,
  case
    when number % 10 < 6 then 'mobile'
    when number % 10 < 8 then 'desktop'
    else 'tablet'
  end
from generate_series(1, 180) as number;

create temporary table demo_categories (
  slug text primary key,
  current_searches integer not null,
  previous_searches integer not null,
  search_term text not null
) on commit drop;

insert into demo_categories values
  ('vivienda', 132, 68, 'ayuda con la renta'),
  ('comida', 116, 78, 'despensa cerca de mí'),
  ('salud', 88, 58, 'clínica comunitaria'),
  ('ayuda-legal', 72, 46, 'orientación legal'),
  ('recursos-financieros', 62, 42, 'ayuda para pagar recibos'),
  ('educacion', 50, 34, 'clases de inglés'),
  ('transporte', 42, 30, 'transporte económico'),
  ('otros-recursos', 36, 24, 'apoyo comunitario');

-- Búsquedas actuales. Veinticinco ZIP principales, más cuatro áreas occidentales
-- de baja actividad añadidas debajo, superan los umbrales del mapa:
-- al menos 20 búsquedas y 10 sesiones distintas.
insert into public.analytics_events (
  event_name,
  occurred_at,
  anonymous_session_id,
  category_slug,
  area_code,
  search_term_normalized,
  search_result_count,
  language,
  device_type,
  page_path,
  environment,
  schema_version,
  metadata
)
select
  'search_submitted',
  now() - ((1 + (sequence_number % 27))::text || ' days')::interval
        - ((sequence_number % 19)::text || ' hours')::interval,
  session.session_id,
  category.slug,
  (array['78617', '78653', '78660', '78701', '78702', '78703', '78704', '78721', '78723', '78724', '78727', '78729', '78741', '78744', '78745', '78747', '78748', '78749', '78750', '78751', '78752', '78753', '78754', '78757', '78758'])[
    1 + ((sequence_number + category_index) % 25)
  ],
  category.search_term,
  3 + ((sequence_number + category_index) % 18),
  session.language,
  session.device_type,
  '/recursos',
  'preview',
  1,
  jsonb_build_object('demo_seed', 'puente-atx-insights-v1')
from (
  select
    row_number() over (order by slug)::integer as category_index,
    slug,
    current_searches,
    search_term
  from demo_categories
) category
cross join lateral generate_series(1, category.current_searches) as sequence_number
join demo_sessions session
  on session.session_number = 1 + (
    ((sequence_number * 7) + (category.category_index * 13)) % 180
  );

-- Cuatro áreas occidentales con actividad baja, distribuidas visualmente y
-- todavía por encima de los umbrales de privacidad del mapa.
insert into public.analytics_events (
  event_name,
  occurred_at,
  anonymous_session_id,
  category_slug,
  area_code,
  search_term_normalized,
  search_result_count,
  language,
  device_type,
  page_path,
  environment,
  schema_version,
  metadata
)
select
  'search_submitted',
  now() - ((1 + ((sequence_number + area.area_index) % 27))::text || ' days')::interval
        - ((sequence_number % 11)::text || ' hours')::interval,
  session.session_id,
  'otros-recursos',
  area.area_code,
  'apoyo comunitario',
  4 + (sequence_number % 7),
  session.language,
  session.device_type,
  '/recursos',
  'preview',
  1,
  jsonb_build_object('demo_seed', 'puente-atx-insights-v1')
from (values
  (1, '78730'),
  (2, '78733'),
  (3, '78735'),
  (4, '78736')
) as area(area_index, area_code)
cross join generate_series(1, 20) as sequence_number
join demo_sessions session
  on session.session_number = 1 + (
    ((sequence_number * 7) + (area.area_index * 19)) % 180
  );

-- Búsquedas del periodo anterior para que las tendencias sean visibles.
insert into public.analytics_events (
  event_name,
  occurred_at,
  anonymous_session_id,
  category_slug,
  area_code,
  search_term_normalized,
  search_result_count,
  language,
  device_type,
  page_path,
  environment,
  schema_version,
  metadata
)
select
  'search_submitted',
  now() - ((31 + (sequence_number % 27))::text || ' days')::interval
        - ((sequence_number % 17)::text || ' hours')::interval,
  session.session_id,
  category.slug,
  (array['78617', '78653', '78660', '78701', '78702', '78703', '78704', '78721', '78723', '78724', '78727', '78729', '78741', '78744', '78745', '78747', '78748', '78749', '78750', '78751', '78752', '78753', '78754', '78757', '78758'])[
    1 + ((sequence_number + category_index) % 25)
  ],
  category.search_term,
  2 + ((sequence_number + category_index) % 15),
  session.language,
  session.device_type,
  '/recursos',
  'preview',
  1,
  jsonb_build_object('demo_seed', 'puente-atx-insights-v1')
from (
  select
    row_number() over (order by slug)::integer as category_index,
    slug,
    previous_searches,
    search_term
  from demo_categories
) category
cross join lateral generate_series(1, category.previous_searches) as sequence_number
join demo_sessions session
  on session.session_number = 1 + (
    ((sequence_number * 11) + (category.category_index * 17)) % 180
  );

-- Sesiones adicionales exclusivas del periodo anterior. Permiten visualizar
-- una disminución en el primer KPI sin alterar ninguna sesión real.
insert into public.analytics_events (
  event_name,
  occurred_at,
  anonymous_session_id,
  category_slug,
  language,
  device_type,
  page_path,
  environment,
  schema_version,
  metadata
)
select
  'category_selected',
  now() - ((31 + (sequence_number % 27))::text || ' days')::interval,
  gen_random_uuid(),
  (array['comida', 'vivienda', 'salud', 'transporte'])[
    1 + (sequence_number % 4)
  ],
  case when sequence_number % 4 = 0 then 'en' else 'es' end,
  case when sequence_number % 3 = 0 then 'desktop' else 'mobile' end,
  '/recursos',
  'preview',
  1,
  jsonb_build_object('demo_seed', 'puente-atx-insights-v1')
from generate_series(1, 140) as sequence_number;

-- Búsquedas sin resultados del periodo anterior. El volumen mayor hace que
-- el último KPI muestre una disminución roja en el periodo actual.
insert into public.analytics_events (
  event_name,
  occurred_at,
  anonymous_session_id,
  search_term_normalized,
  search_result_count,
  language,
  device_type,
  page_path,
  environment,
  schema_version,
  metadata
)
select
  event_name,
  now() - ((31 + (sequence_number % 27))::text || ' days')::interval,
  session.session_id,
  'apoyo no encontrado',
  0,
  session.language,
  session.device_type,
  '/recursos',
  'preview',
  1,
  jsonb_build_object('demo_seed', 'puente-atx-insights-v1')
from generate_series(1, 1200) as sequence_number
cross join lateral (
  values ('search_submitted'), ('search_no_results')
) as events(event_name)
join demo_sessions session
  on session.session_number = 1 + ((sequence_number * 41) % 180);

-- Búsquedas sin resultados actuales: cada término visible supera el mínimo de 5.
with terms(term, occurrences) as (
  values
    ('ayuda para reparar techo', 12),
    ('guardería nocturna', 10),
    ('dentista gratis fin de semana', 8),
    ('clases de computación', 7),
    ('comida para mascotas', 6)
)
insert into public.analytics_events (
  event_name,
  occurred_at,
  anonymous_session_id,
  search_term_normalized,
  search_result_count,
  language,
  device_type,
  page_path,
  environment,
  schema_version,
  metadata
)
select
  event_name,
  now() - ((1 + (sequence_number % 25))::text || ' days')::interval,
  session.session_id,
  terms.term,
  0,
  session.language,
  session.device_type,
  '/recursos',
  'preview',
  1,
  jsonb_build_object('demo_seed', 'puente-atx-insights-v1')
from terms
cross join lateral generate_series(1, terms.occurrences) as sequence_number
cross join lateral (
  values ('search_submitted'), ('search_no_results')
) as events(event_name)
join demo_sessions session
  on session.session_number = 1 + (
    (sequence_number * 19 + char_length(terms.term)) % 180
  );

-- Términos de bajo volumen: el dashboard los agrupa y no los revela.
with terms(term) as (
  values
    ('apoyo temporal uno'),
    ('apoyo temporal dos'),
    ('apoyo temporal tres')
)
insert into public.analytics_events (
  event_name,
  occurred_at,
  anonymous_session_id,
  search_term_normalized,
  search_result_count,
  language,
  device_type,
  page_path,
  environment,
  schema_version,
  metadata
)
select
  'search_no_results',
  now() - ((2 + sequence_number)::text || ' days')::interval,
  session.session_id,
  terms.term,
  0,
  session.language,
  session.device_type,
  '/recursos',
  'preview',
  1,
  jsonb_build_object('demo_seed', 'puente-atx-insights-v1')
from terms
cross join generate_series(1, 3) as sequence_number
join demo_sessions session
  on session.session_number = 1 + (
    (sequence_number * 23 + char_length(terms.term)) % 180
  );

-- Series controladas para comprobar los tres estados de la gráfica en Preview.
-- Se crean para cada combinación de idioma y dispositivo:
-- - resource_saved: creciente;
-- - acciones de contacto: estables y distribuidas entre los cuatro canales;
-- - search_no_results: decreciente, junto con su search_submitted.
-- Cada serie reutiliza una sesión técnica por combinación para no convertir el
-- volumen de eventos ficticios en un crecimiento artificial de sesiones.
insert into public.analytics_events (
  event_name,
  occurred_at,
  anonymous_session_id,
  search_result_count,
  language,
  device_type,
  page_path,
  environment,
  schema_version,
  metadata
)
select
  plan.event_name,
  date_trunc('day', now()) - (day_ago::text || ' days')::interval
    + interval '1 minute'
    + (sequence_number::text || ' seconds')::interval,
  md5('preview-controlled-' || plan.series_name || '-' || variant.language || '-' || variant.device_type)::uuid,
  case when plan.series_name = 'no-results' then 0 else null end,
  variant.language,
  variant.device_type,
  case
    when plan.event_name = 'list_shared' then '/mi-lista'
    when plan.event_name = 'conversation_requested' then '/conversacion'
    else '/recursos'
  end,
  'preview',
  1,
  jsonb_build_object(
    'demo_seed', 'puente-atx-insights-v1',
    'demo_series', plan.series_name
  )
from (values
  ('es', 'mobile'),
  ('es', 'tablet'),
  ('es', 'desktop'),
  ('en', 'mobile'),
  ('en', 'tablet'),
  ('en', 'desktop')
) as variant(language, device_type)
cross join generate_series(0, 29) as day_ago
cross join lateral (values
  ('resource-saves', 'resource_saved', greatest(1, 16 - floor(day_ago / 2.0)::integer)),
  ('contact-actions-call', 'call_clicked', 3),
  ('contact-actions-whatsapp', 'whatsapp_clicked', 2),
  ('contact-actions-website', 'website_clicked', 4),
  ('contact-actions-directions', 'directions_clicked', 1),
  ('supplemental-resource-prints', 'resource_printed', case when day_ago % 2 = 0 then 1 else 0 end),
  ('supplemental-list-shares', 'list_shared', case when day_ago % 3 = 0 then 1 else 0 end),
  ('supplemental-conversations', 'conversation_requested', case when day_ago % 5 = 0 then 1 else 0 end),
  ('no-results', 'search_no_results', greatest(1, 1 + floor(day_ago / 2.0)::integer)),
  ('no-results-search', 'search_submitted', greatest(1, 1 + floor(day_ago / 2.0)::integer))
) as plan(series_name, event_name, event_count)
cross join lateral generate_series(1, plan.event_count) as sequence_number;

-- Base comparable del periodo anterior. Mantiene los porcentajes de los KPI
-- dentro de rangos legibles para Preview, sin cambiar la fórmula del dashboard:
-- recursos guardados cerca de +35% y acciones de contacto cerca de +20%.
insert into public.analytics_events (
  event_name,
  occurred_at,
  anonymous_session_id,
  language,
  device_type,
  page_path,
  environment,
  schema_version,
  metadata
)
select
  plan.event_name,
  date_trunc('day', now()) - ((31 + day_ago)::text || ' days')::interval
    + interval '1 minute'
    + (sequence_number::text || ' seconds')::interval,
  md5('preview-previous-' || plan.series_name || '-' || variant.language || '-' || variant.device_type)::uuid,
  variant.language,
  variant.device_type,
  '/recursos',
  'preview',
  1,
  jsonb_build_object(
    'demo_seed', 'puente-atx-insights-v1',
    'demo_series', plan.series_name
  )
from (values
  ('es', 'mobile'),
  ('es', 'tablet'),
  ('es', 'desktop'),
  ('en', 'mobile'),
  ('en', 'tablet'),
  ('en', 'desktop')
) as variant(language, device_type)
cross join generate_series(0, 29) as day_ago
cross join lateral (values
  ('previous-resource-saves', 'resource_saved', case when day_ago % 10 < 7 then 7 else 6 end),
  ('previous-contact-calls', 'call_clicked', 3),
  ('previous-contact-whatsapp', 'whatsapp_clicked', 2),
  ('previous-contact-website', 'website_clicked', 3),
  ('previous-contact-directions', 'directions_clicked', case when day_ago % 3 = 0 then 1 else 0 end)
) as plan(series_name, event_name, event_count)
cross join lateral generate_series(1, plan.event_count) as sequence_number;

-- Acciones sobre recursos publicados reales, para poblar la tabla de desempeño.
create temporary table demo_resources on commit drop as
select
  r.id,
  r.slug,
  c.slug as category_slug,
  row_number() over (order by r.updated_at desc, r.id)::integer as resource_number
from public.resources r
left join public.categories c on c.id = r.primary_category_id
where r.status = 'published'
order by r.updated_at desc, r.id
limit 10;

with event_plan(event_name, base_count) as (
  values
    ('resource_viewed', 54),
    ('resource_saved', 22),
    ('call_clicked', 10),
    ('whatsapp_clicked', 8),
    ('website_clicked', 13),
    ('directions_clicked', 7),
    ('resource_printed', 5)
)
insert into public.analytics_events (
  event_name,
  occurred_at,
  anonymous_session_id,
  resource_id,
  category_slug,
  language,
  device_type,
  page_path,
  environment,
  schema_version,
  metadata
)
select
  plan.event_name,
  now() - ((1 + ((sequence_number + resource.resource_number) % 28))::text || ' days')::interval,
  session.session_id,
  resource.id,
  resource.category_slug,
  session.language,
  session.device_type,
  '/recursos',
  'preview',
  1,
  jsonb_build_object('demo_seed', 'puente-atx-insights-v1')
from demo_resources resource
cross join event_plan plan
cross join lateral generate_series(
  1,
  greatest(2, plan.base_count - resource.resource_number * 3)
) as sequence_number
join demo_sessions session
  on session.session_number = 1 + (
    (sequence_number * 29 + resource.resource_number * 11) % 180
  );

-- Acciones del periodo anterior para mostrar comparaciones en los KPI.
with event_plan(event_name, base_count) as (
  values
    ('resource_viewed', 40),
    ('resource_saved', 14),
    ('call_clicked', 6),
    ('whatsapp_clicked', 5),
    ('website_clicked', 8),
    ('directions_clicked', 4)
)
insert into public.analytics_events (
  event_name,
  occurred_at,
  anonymous_session_id,
  resource_id,
  category_slug,
  language,
  device_type,
  page_path,
  environment,
  schema_version,
  metadata
)
select
  plan.event_name,
  now() - ((31 + ((sequence_number + resource.resource_number) % 27))::text || ' days')::interval,
  session.session_id,
  resource.id,
  resource.category_slug,
  session.language,
  session.device_type,
  '/recursos',
  'preview',
  1,
  jsonb_build_object('demo_seed', 'puente-atx-insights-v1')
from demo_resources resource
cross join event_plan plan
cross join lateral generate_series(
  1,
  greatest(2, plan.base_count - resource.resource_number * 2)
) as sequence_number
join demo_sessions session
  on session.session_number = 1 + (
    (sequence_number * 37 + resource.resource_number * 7) % 180
  );

-- Acciones generales para completar las métricas del overview.
with event_plan(event_name, event_count) as (
  values
    ('list_shared', 24),
    ('list_printed', 15),
    ('conversation_requested', 12),
    ('shared_list_opened', 18),
    ('resource_removed', 14)
)
insert into public.analytics_events (
  event_name,
  occurred_at,
  anonymous_session_id,
  language,
  device_type,
  page_path,
  environment,
  schema_version,
  metadata
)
select
  plan.event_name,
  now() - ((1 + (sequence_number % 26))::text || ' days')::interval,
  session.session_id,
  session.language,
  session.device_type,
  case
    when plan.event_name in ('list_shared', 'list_printed', 'shared_list_opened') then '/mi-lista'
    when plan.event_name = 'conversation_requested' then '/conversacion'
    else '/recursos'
  end,
  'preview',
  1,
  jsonb_build_object('demo_seed', 'puente-atx-insights-v1')
from event_plan plan
cross join lateral generate_series(1, plan.event_count) as sequence_number
join demo_sessions session
  on session.session_number = 1 + (
    (sequence_number * 31 + char_length(plan.event_name)) % 180
  );

commit;

-- Confirmación visual de las tendencias almacenadas durante los últimos 30 días.
-- Debe incluir al menos una tendencia creciente, una estable y una decreciente.
with days as (
  select
    day::date,
    row_number() over (order by day)::integer as day_number
  from generate_series(
    current_date - interval '29 days',
    current_date,
    interval '1 day'
  ) as day
),
daily as (
  select
    days.day,
    days.day_number,
    count(distinct events.anonymous_session_id)::integer as active_sessions,
    count(*) filter (where events.event_name = 'search_submitted')::integer as searches,
    count(*) filter (where events.event_name = 'resource_saved')::integer as resource_saves,
    count(*) filter (where events.event_name in ('call_clicked', 'whatsapp_clicked', 'website_clicked', 'directions_clicked'))::integer as contact_actions,
    count(*) filter (where events.event_name = 'search_no_results')::integer as no_results
  from days
  left join public.analytics_events events
    on events.occurred_at >= days.day
    and events.occurred_at < days.day + interval '1 day'
    and events.environment = 'preview'
  group by days.day, days.day_number
),
series as (
  select daily.day_number, metric.metric, metric.value
  from daily
  cross join lateral (values
    ('active_sessions', daily.active_sessions),
    ('searches', daily.searches),
    ('resource_saves', daily.resource_saves),
    ('contact_actions', daily.contact_actions),
    ('no_results', daily.no_results)
  ) as metric(metric, value)
),
slopes as (
  select
    metric,
    regr_slope(value, day_number) * 29 as projected_change,
    greatest(0.5, max(value) * 0.03) as threshold
  from series
  group by metric
)
select
  metric,
  round(projected_change::numeric, 2) as projected_change,
  case
    when projected_change > threshold then 'creciente — verde'
    when projected_change < -threshold then 'decreciente — rojo'
    else 'estable — coral'
  end as expected_result
from slopes
order by metric;
