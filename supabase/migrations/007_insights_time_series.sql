-- Puente ATX Insights: admin-only aggregate time series.
-- This migration is additive and never exposes individual analytics events.

create or replace function public.get_insights_time_series(
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
  v_granularity text;
  v_step interval;
  v_first_bucket timestamptz;
  v_last_bucket timestamptz;
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

  if p_end_date - p_start_date <= interval '31 days' then
    v_granularity := 'day';
    v_step := interval '1 day';
  elsif p_end_date - p_start_date <= interval '100 days' then
    v_granularity := 'week';
    v_step := interval '1 week';
  else
    v_granularity := 'month';
    v_step := interval '1 month';
  end if;

  v_first_bucket := date_trunc(v_granularity, p_start_date);
  v_last_bucket := date_trunc(v_granularity, p_end_date - interval '1 microsecond');

  with buckets as (
    select generate_series(v_first_bucket, v_last_bucket, v_step) as bucket_start
  ),
  filtered_events as (
    select event_name, occurred_at, anonymous_session_id
    from public.analytics_events
    where occurred_at >= p_start_date
      and occurred_at < p_end_date
      and environment = p_environment
      and (p_language is null or language = p_language)
      and (p_device_type is null or device_type = p_device_type)
  ),
  aggregates as (
    select
      date_trunc(v_granularity, occurred_at) as bucket_start,
      count(distinct anonymous_session_id)::integer as active_sessions,
      count(*) filter (where event_name = 'search_submitted')::integer as searches,
      count(*) filter (where event_name = 'resource_saved')::integer as resource_saves,
      count(*) filter (where event_name in ('call_clicked', 'whatsapp_clicked', 'website_clicked', 'directions_clicked'))::integer as contact_actions,
      count(*) filter (where event_name = 'search_no_results')::integer as no_results
    from filtered_events
    group by 1
  )
  select jsonb_build_object(
    'granularity', v_granularity,
    'points', coalesce(jsonb_agg(jsonb_build_object(
      'bucket_start', buckets.bucket_start,
      'active_sessions', coalesce(aggregates.active_sessions, 0),
      'searches', coalesce(aggregates.searches, 0),
      'resource_saves', coalesce(aggregates.resource_saves, 0),
      'contact_actions', coalesce(aggregates.contact_actions, 0),
      'no_results', coalesce(aggregates.no_results, 0)
    ) order by buckets.bucket_start), '[]'::jsonb)
  )
  into v_result
  from buckets
  left join aggregates using (bucket_start);

  return v_result;
end;
$$;

revoke all on function public.get_insights_time_series(timestamptz, timestamptz, text, text, text) from public, anon;
grant execute on function public.get_insights_time_series(timestamptz, timestamptz, text, text, text) to authenticated;
