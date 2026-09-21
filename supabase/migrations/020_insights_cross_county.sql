-- Insights: where do people who searched in one county end up contacting resources?
-- Adds an admin-only aggregate that pairs the ZIP a session first searched
-- (analytics_events.area_code, now also stamped on interaction events) with the
-- county of the resource it contacted. Nothing is rewritten; no PII is stored.
--
-- Privacy: a (searched county -> resource county) pair is only returned when at
-- least min_sessions DISTINCT anonymous sessions produced it. Smaller pairs are
-- dropped and only counted, never summed or itemised, so a thin cell cannot be
-- recovered by subtracting from a total. Same spirit as the existing
-- area_visible threshold in get_insights_snapshot, stricter because a
-- two-dimensional cross-tab can single out one person in a small town.

create table if not exists public.zip_counties (
  zip text primary key check (zip ~ '^[0-9]{5}$'),
  county text not null
);

alter table public.zip_counties enable row level security;
-- No policies on purpose: only the security-definer function below reads it.

-- Mirrors src/config/centralTexasZipCentroids.js (the app's own ZIP -> county
-- source). Re-run this upsert whenever that file gains ZIP codes.
insert into public.zip_counties (zip, county) values
  ('76511', 'Williamson'),
  ('76527', 'Williamson'),
  ('76530', 'Williamson'),
  ('76537', 'Williamson'),
  ('76539', 'Burnet'),
  ('76549', 'Burnet'),
  ('76550', 'Burnet'),
  ('76573', 'Williamson'),
  ('76574', 'Williamson'),
  ('76577', 'Williamson'),
  ('76578', 'Williamson'),
  ('77853', 'Lee'),
  ('77954', 'Gonzales'),
  ('77984', 'Gonzales'),
  ('77994', 'Gonzales'),
  ('78108', 'Guadalupe'),
  ('78121', 'Guadalupe'),
  ('78122', 'Gonzales'),
  ('78123', 'Guadalupe'),
  ('78124', 'Guadalupe'),
  ('78130', 'Guadalupe'),
  ('78132', 'Guadalupe'),
  ('78140', 'Gonzales'),
  ('78154', 'Guadalupe'),
  ('78155', 'Guadalupe'),
  ('78159', 'Gonzales'),
  ('78602', 'Bastrop'),
  ('78605', 'Burnet'),
  ('78608', 'Burnet'),
  ('78610', 'Hays'),
  ('78611', 'Burnet'),
  ('78612', 'Bastrop'),
  ('78613', 'Williamson'),
  ('78614', 'Gonzales'),
  ('78615', 'Williamson'),
  ('78616', 'Caldwell'),
  ('78617', 'Travis'),
  ('78619', 'Hays'),
  ('78620', 'Hays'),
  ('78621', 'Bastrop'),
  ('78622', 'Caldwell'),
  ('78623', 'Hays'),
  ('78626', 'Williamson'),
  ('78628', 'Williamson'),
  ('78629', 'Gonzales'),
  ('78632', 'Gonzales'),
  ('78633', 'Williamson'),
  ('78634', 'Williamson'),
  ('78638', 'Guadalupe'),
  ('78639', 'Burnet'),
  ('78640', 'Hays'),
  ('78641', 'Travis'),
  ('78642', 'Williamson'),
  ('78644', 'Caldwell'),
  ('78645', 'Travis'),
  ('78648', 'Caldwell'),
  ('78650', 'Bastrop'),
  ('78652', 'Travis'),
  ('78653', 'Travis'),
  ('78654', 'Burnet'),
  ('78655', 'Caldwell'),
  ('78656', 'Caldwell'),
  ('78657', 'Burnet'),
  ('78658', 'Gonzales'),
  ('78659', 'Bastrop'),
  ('78660', 'Travis'),
  ('78661', 'Caldwell'),
  ('78662', 'Bastrop'),
  ('78663', 'Travis'),
  ('78664', 'Williamson'),
  ('78665', 'Williamson'),
  ('78666', 'Hays'),
  ('78669', 'Travis'),
  ('78670', 'Guadalupe'),
  ('78674', 'Williamson'),
  ('78676', 'Hays'),
  ('78677', 'Gonzales'),
  ('78681', 'Williamson'),
  ('78701', 'Travis'),
  ('78702', 'Travis'),
  ('78703', 'Travis'),
  ('78704', 'Travis'),
  ('78705', 'Travis'),
  ('78712', 'Travis'),
  ('78717', 'Williamson'),
  ('78719', 'Travis'),
  ('78721', 'Travis'),
  ('78722', 'Travis'),
  ('78723', 'Travis'),
  ('78724', 'Travis'),
  ('78725', 'Travis'),
  ('78726', 'Travis'),
  ('78727', 'Travis'),
  ('78728', 'Travis'),
  ('78729', 'Williamson'),
  ('78730', 'Travis'),
  ('78731', 'Travis'),
  ('78732', 'Travis'),
  ('78733', 'Travis'),
  ('78734', 'Travis'),
  ('78735', 'Travis'),
  ('78736', 'Travis'),
  ('78737', 'Hays'),
  ('78738', 'Travis'),
  ('78739', 'Travis'),
  ('78741', 'Travis'),
  ('78742', 'Travis'),
  ('78744', 'Travis'),
  ('78745', 'Travis'),
  ('78746', 'Travis'),
  ('78747', 'Travis'),
  ('78748', 'Travis'),
  ('78749', 'Travis'),
  ('78750', 'Travis'),
  ('78751', 'Travis'),
  ('78752', 'Travis'),
  ('78753', 'Travis'),
  ('78754', 'Travis'),
  ('78756', 'Travis'),
  ('78757', 'Travis'),
  ('78758', 'Travis'),
  ('78759', 'Travis'),
  ('78932', 'Fayette'),
  ('78938', 'Fayette'),
  ('78940', 'Fayette'),
  ('78941', 'Fayette'),
  ('78942', 'Lee'),
  ('78945', 'Fayette'),
  ('78946', 'Lee'),
  ('78947', 'Lee'),
  ('78948', 'Lee'),
  ('78949', 'Fayette'),
  ('78950', 'Fayette'),
  ('78953', 'Bastrop'),
  ('78954', 'Fayette'),
  ('78956', 'Fayette'),
  ('78957', 'Bastrop'),
  ('78959', 'Gonzales'),
  ('78962', 'Fayette'),
  ('78963', 'Fayette')
on conflict (zip) do update set county = excluded.county;

create or replace function public.get_insights_cross_county(
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_environment text default 'production',
  p_language text default null,
  p_device_type text default null,
  p_page_path text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_min_sessions constant integer := 10;
  v_supported constant text[] := array['Travis', 'Williamson', 'Bastrop', 'Hays', 'Caldwell', 'Burnet', 'Lee', 'Fayette', 'Gonzales', 'Guadalupe'];
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
    or (p_page_path is not null and p_page_path not in ('/recursos', '/buscador', '/mi-lista'))
  then
    raise exception 'invalid_filters' using errcode = '22023';
  end if;

  with
  contacts as (
    select e.anonymous_session_id, e.area_code, e.resource_id
    from public.analytics_events e
    where e.occurred_at >= p_start_date
      and e.occurred_at < p_end_date
      and e.environment = p_environment
      and (p_language is null or e.language = p_language)
      and (p_device_type is null or e.device_type = p_device_type)
      and (p_page_path is null or e.page_path = p_page_path)
      and e.event_name in ('call_clicked', 'whatsapp_clicked', 'website_clicked', 'directions_clicked')
      and e.area_code is not null
      and e.resource_id is not null
  ),
  resolved as (
    select
      c.anonymous_session_id,
      oz.county as origin_county,
      -- resources.county is free text ("Travis", "Travis County", ...);
      -- fall back to the resource's ZIP when it is blank.
      coalesce(
        (select s from unnest(v_supported) s where lower(s) = lower(nullif(btrim(regexp_replace(coalesce(r.county, ''), '(^condado de\s+|\s+county$)', '', 'i')), ''))),
        rz.county
      ) as resource_county
    from contacts c
    join public.zip_counties oz on oz.zip = c.area_code
    join public.resources r on r.id = c.resource_id
    left join public.zip_counties rz on rz.zip = r.postal_code
  ),
  pairs as (
    select
      origin_county,
      resource_county,
      count(distinct anonymous_session_id)::integer as sessions
    from resolved
    where resource_county is not null
      and resource_county = any(v_supported)
      and origin_county <> resource_county
    group by origin_county, resource_county
  )
  select jsonb_build_object(
    'min_sessions', v_min_sessions,
    'pairs', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'origin_county', origin_county,
        'resource_county', resource_county,
        'sessions', sessions
      ) order by sessions desc, origin_county, resource_county), '[]'::jsonb)
      from pairs
      where sessions >= v_min_sessions
    ),
    'suppressed_pair_count', (select count(*) from pairs where sessions < v_min_sessions)
  )
  into v_result;

  return v_result;
end;
$$;

revoke all on function public.get_insights_cross_county(timestamptz, timestamptz, text, text, text, text) from public, anon;
grant execute on function public.get_insights_cross_county(timestamptz, timestamptz, text, text, text, text) to authenticated;
