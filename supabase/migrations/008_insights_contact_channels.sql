-- Puente ATX Insights: admin-only contact-channel aggregates.
-- Additive migration. It never returns individual analytics events.

create or replace function public.get_insights_contact_channels(
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

  select jsonb_build_object(
    'calls', count(*) filter (where event_name = 'call_clicked')::integer,
    'whatsapp', count(*) filter (where event_name = 'whatsapp_clicked')::integer,
    'websites', count(*) filter (where event_name = 'website_clicked')::integer,
    'directions', count(*) filter (where event_name = 'directions_clicked')::integer,
    'resource_prints', count(*) filter (where event_name = 'resource_printed')::integer,
    'list_shares', count(*) filter (where event_name = 'list_shared')::integer,
    'conversations', count(*) filter (where event_name = 'conversation_requested')::integer,
    'total', count(*)::integer
  )
  into v_result
  from public.analytics_events
  where occurred_at >= p_start_date
    and occurred_at < p_end_date
    and environment = p_environment
    and event_name in (
      'call_clicked', 'whatsapp_clicked', 'website_clicked', 'directions_clicked',
      'resource_printed', 'list_shared', 'conversation_requested'
    )
    and (p_language is null or language = p_language)
    and (p_device_type is null or device_type = p_device_type);

  return v_result;
end;
$$;

revoke all on function public.get_insights_contact_channels(timestamptz, timestamptz, text, text, text) from public, anon;
grant execute on function public.get_insights_contact_channels(timestamptz, timestamptz, text, text, text) to authenticated;
