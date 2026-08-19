-- Puente ATX Insights: anonymous product events and admin-only aggregates.
-- This migration is additive. It does not alter or remove existing resource data.

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null check (event_name in (
    'search_submitted', 'search_no_results', 'category_selected', 'area_selected',
    'resource_viewed', 'resource_saved', 'resource_removed', 'call_clicked',
    'whatsapp_clicked', 'website_clicked', 'directions_clicked', 'list_shared',
    'list_printed', 'resource_printed', 'conversation_requested', 'shared_list_opened'
  )),
  occurred_at timestamptz not null default now(),
  anonymous_session_id uuid not null,
  resource_id uuid references public.resources(id) on delete set null,
  category_slug text check (category_slug is null or category_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  area_code text check (area_code is null or area_code ~ '^[0-9]{5}$'),
  search_term_normalized text check (search_term_normalized is null or char_length(search_term_normalized) <= 80),
  search_result_count integer check (search_result_count is null or search_result_count between 0 and 100000),
  language text not null check (language in ('es', 'en')),
  device_type text not null check (device_type in ('mobile', 'tablet', 'desktop', 'unknown')),
  page_path text check (page_path is null or (left(page_path, 1) = '/' and char_length(page_path) <= 200)),
  environment text not null check (environment in ('production', 'preview', 'development')),
  schema_version integer not null default 1 check (schema_version between 1 and 20),
  metadata jsonb check (
    metadata is null
    or (
      jsonb_typeof(metadata) = 'object'
      and octet_length(metadata::text) <= 2048
    )
  )
);

create index analytics_events_occurred_at_idx on public.analytics_events (occurred_at desc);
create index analytics_events_name_occurred_idx on public.analytics_events (event_name, occurred_at desc);
create index analytics_events_resource_occurred_idx on public.analytics_events (resource_id, occurred_at desc) where resource_id is not null;
create index analytics_events_category_occurred_idx on public.analytics_events (category_slug, occurred_at desc) where category_slug is not null;
create index analytics_events_area_occurred_idx on public.analytics_events (area_code, occurred_at desc) where area_code is not null;
create index analytics_events_language_occurred_idx on public.analytics_events (language, occurred_at desc);
create index analytics_events_device_occurred_idx on public.analytics_events (device_type, occurred_at desc);
create index analytics_events_environment_occurred_idx on public.analytics_events (environment, occurred_at desc);
create index analytics_events_session_occurred_idx on public.analytics_events (anonymous_session_id, occurred_at desc);

alter table public.analytics_events enable row level security;
alter table public.analytics_events force row level security;

revoke all on public.analytics_events from public, anon, authenticated;

create or replace function public.can_view_insights()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_admin_role() = 'admin', false);
$$;

revoke all on function public.can_view_insights() from public;
grant execute on function public.can_view_insights() to authenticated;

create or replace function public.get_insights_snapshot(
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_environment text default 'production',
  p_language text default null,
  p_device_type text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_duration interval;
  v_result jsonb;
begin
  if not public.can_view_insights() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if p_start_date is null
    or p_end_date is null
    or p_start_date >= p_end_date
    or p_start_date < timestamptz '2020-01-01 00:00:00+00'
    or p_end_date > now() + interval '1 day'
    or p_environment not in ('production', 'preview', 'development')
    or (p_language is not null and p_language not in ('es', 'en'))
    or (p_device_type is not null and p_device_type not in ('mobile', 'tablet', 'desktop'))
  then
    raise exception 'invalid_filters' using errcode = '22023';
  end if;

  v_duration := p_end_date - p_start_date;

  with
  current_events as (
    select *
    from public.analytics_events
    where occurred_at >= p_start_date
      and occurred_at < p_end_date
      and environment = p_environment
      and (p_language is null or language = p_language)
      and (p_device_type is null or device_type = p_device_type)
  ),
  previous_events as (
    select *
    from public.analytics_events
    where occurred_at >= p_start_date - v_duration
      and occurred_at < p_start_date
      and environment = p_environment
      and (p_language is null or language = p_language)
      and (p_device_type is null or device_type = p_device_type)
  ),
  current_metrics as (
    select
      count(distinct anonymous_session_id)::integer as active_sessions,
      count(*) filter (where event_name = 'search_submitted')::integer as searches,
      count(*) filter (where event_name = 'resource_viewed')::integer as resource_views,
      count(*) filter (where event_name = 'resource_saved')::integer as resource_saves,
      count(*) filter (where event_name in ('call_clicked', 'whatsapp_clicked', 'website_clicked', 'directions_clicked'))::integer as contact_actions,
      count(*) filter (where event_name = 'search_no_results')::integer as no_results,
      count(*) filter (where event_name = 'list_shared')::integer as lists_shared,
      count(*) filter (where event_name = 'list_printed')::integer as lists_printed
    from current_events
  ),
  previous_metrics as (
    select
      count(distinct anonymous_session_id)::integer as active_sessions,
      count(*) filter (where event_name = 'search_submitted')::integer as searches,
      count(*) filter (where event_name = 'resource_viewed')::integer as resource_views,
      count(*) filter (where event_name = 'resource_saved')::integer as resource_saves,
      count(*) filter (where event_name in ('call_clicked', 'whatsapp_clicked', 'website_clicked', 'directions_clicked'))::integer as contact_actions,
      count(*) filter (where event_name = 'search_no_results')::integer as no_results,
      count(*) filter (where event_name = 'list_shared')::integer as lists_shared,
      count(*) filter (where event_name = 'list_printed')::integer as lists_printed
    from previous_events
  ),
  category_current as (
    select category_slug, count(*)::integer as searches
    from current_events
    where event_name = 'search_submitted' and category_slug is not null
    group by category_slug
  ),
  category_previous as (
    select category_slug, count(*)::integer as searches
    from previous_events
    where event_name = 'search_submitted' and category_slug is not null
    group by category_slug
  ),
  category_data as (
    select
      c.slug,
      c.label_es,
      c.label_en,
      coalesce(cc.searches, 0)::integer as current_count,
      coalesce(cp.searches, 0)::integer as previous_count
    from public.categories c
    left join category_current cc on cc.category_slug = c.slug
    left join category_previous cp on cp.category_slug = c.slug
    where c.is_active
    order by coalesce(cc.searches, 0) desc, c.sort_order
  ),
  area_raw as (
    select
      area_code,
      count(*)::integer as event_count,
      count(distinct anonymous_session_id)::integer as session_count
    from current_events
    where event_name = 'search_submitted' and area_code is not null
    group by area_code
  ),
  area_visible as (
    select area_code, event_count, session_count
    from area_raw
    where event_count >= 20 and session_count >= 10
  ),
  no_result_raw as (
    select
      search_term_normalized,
      count(*)::integer as occurrences,
      max(occurred_at) as last_occurred_at
    from current_events
    where event_name = 'search_no_results' and search_term_normalized is not null
    group by search_term_normalized
  ),
  no_result_visible as (
    select search_term_normalized, occurrences, last_occurred_at
    from no_result_raw
    where occurrences >= 5
    order by occurrences desc, last_occurred_at desc
    limit 20
  ),
  resource_actions as (
    select
      resource_id,
      count(*) filter (where event_name = 'resource_viewed')::integer as views,
      count(*) filter (where event_name = 'resource_saved')::integer as saves,
      count(*) filter (where event_name = 'call_clicked')::integer as calls,
      count(*) filter (where event_name = 'whatsapp_clicked')::integer as whatsapp,
      count(*) filter (where event_name = 'website_clicked')::integer as website,
      count(*) filter (where event_name = 'directions_clicked')::integer as directions
    from current_events
    where resource_id is not null
    group by resource_id
  ),
  resource_performance as (
    select
      r.id,
      r.slug,
      r.status::text,
      r.organization_name,
      r.title_es,
      r.title_en,
      r.primary_category_id,
      r.last_verified_at,
      coalesce(a.views, 0)::integer as views,
      coalesce(a.saves, 0)::integer as saves,
      coalesce(a.calls, 0)::integer as calls,
      coalesce(a.whatsapp, 0)::integer as whatsapp,
      coalesce(a.website, 0)::integer as website,
      coalesce(a.directions, 0)::integer as directions,
      (coalesce(a.calls, 0) + coalesce(a.whatsapp, 0) + coalesce(a.website, 0) + coalesce(a.directions, 0))::integer as contact_actions
    from resource_actions a
    join public.resources r on r.id = a.resource_id
    order by
      (coalesce(a.views, 0) + coalesce(a.saves, 0) + coalesce(a.calls, 0) + coalesce(a.whatsapp, 0) + coalesce(a.website, 0) + coalesce(a.directions, 0)) desc,
      r.organization_name
    limit 50
  ),
  quality as (
    select
      count(*) filter (where status = 'published')::integer as published,
      count(*) filter (where status = 'draft')::integer as drafts,
      count(*) filter (where status = 'archived')::integer as archived,
      count(*) filter (where last_verified_at is null)::integer as unverified,
      count(*) filter (where last_verified_at is not null and last_verified_at < current_date - 180)::integer as needs_review,
      count(*) filter (where btrim(coalesce(title_en, '')) = '' or btrim(coalesce(summary_en, '')) = '' or btrim(coalesce(description_en, '')) = '')::integer as incomplete_translation,
      count(*) filter (where nullif(btrim(coalesce(source_url, '')), '') is null)::integer as missing_source,
      count(*) filter (
        where nullif(btrim(coalesce(phone, '')), '') is null
          and nullif(btrim(coalesce(sms_phone, '')), '') is null
          and nullif(btrim(coalesce(whatsapp_phone, '')), '') is null
          and nullif(btrim(coalesce(email, '')), '') is null
          and nullif(btrim(coalesce(website_url, '')), '') is null
          and nullif(btrim(coalesce(address_line_1, '')), '') is null
      )::integer as missing_contact,
      count(*) filter (where primary_category_id is null)::integer as missing_category
    from public.resources
  )
  select jsonb_build_object(
    'generated_at', now(),
    'filters', jsonb_build_object(
      'start_date', p_start_date,
      'end_date', p_end_date,
      'environment', p_environment,
      'language', p_language,
      'device_type', p_device_type
    ),
    'overview', jsonb_build_object(
      'current', to_jsonb(cm),
      'previous', to_jsonb(pm),
      'no_result_rate', case when cm.searches = 0 then 0 else round((cm.no_results::numeric / cm.searches::numeric) * 100, 1) end,
      'previous_no_result_rate', case when pm.searches = 0 then 0 else round((pm.no_results::numeric / pm.searches::numeric) * 100, 1) end
    ),
    'categories', (select coalesce(jsonb_agg(to_jsonb(category_data)), '[]'::jsonb) from category_data),
    'areas', jsonb_build_object(
      'visible', (select coalesce(jsonb_agg(to_jsonb(area_visible) order by event_count desc), '[]'::jsonb) from area_visible),
      'visible_total', (select coalesce(sum(event_count), 0) from area_visible),
      'suppressed_area_count', (select count(*) from area_raw where event_count < 20 or session_count < 10)
    ),
    'no_results', jsonb_build_object(
      'terms', (select coalesce(jsonb_agg(to_jsonb(no_result_visible)), '[]'::jsonb) from no_result_visible),
      'low_volume_occurrences', (select coalesce(sum(occurrences), 0) from no_result_raw where occurrences < 5)
    ),
    'resources', (select coalesce(jsonb_agg(to_jsonb(resource_performance)), '[]'::jsonb) from resource_performance),
    'quality', (select to_jsonb(quality) from quality)
  )
  into v_result
  from current_metrics cm
  cross join previous_metrics pm;

  return v_result;
end;
$$;

revoke all on function public.get_insights_snapshot(timestamptz, timestamptz, text, text, text) from public, anon;
grant execute on function public.get_insights_snapshot(timestamptz, timestamptz, text, text, text) to authenticated;

comment on table public.analytics_events is
  'Anonymous Puente ATX product actions. Contains no names, phones, addresses, GPS, IP addresses, full user agents, or conversation content.';
comment on function public.get_insights_snapshot(timestamptz, timestamptz, text, text, text) is
  'Returns admin-only aggregate Insights data. ZIP counts below 20 events or 10 sessions and no-result terms below 5 occurrences are suppressed before leaving PostgreSQL.';
