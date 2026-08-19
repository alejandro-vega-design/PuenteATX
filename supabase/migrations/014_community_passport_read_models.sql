-- Consent-aware Community Passport read models. No anonymous access.

create or replace function public.list_community_passports(
  p_status public.passport_status default 'active',
  p_search text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_result jsonb;
begin
  perform public.require_community_mfa();
  select coalesce(jsonb_agg(row_data order by (row_data->>'updated_at') desc), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'id', pp.id,
      'status', pp.status,
      'created_at', pp.created_at,
      'updated_at', greatest(pp.updated_at, coalesce(max(r.updated_at), pp.updated_at)),
      'person', jsonb_strip_nulls(jsonb_build_object(
        'first_name', pe.first_name, 'last_name', pe.last_name,
        'preferred_name', pe.preferred_name, 'phone', pe.phone,
        'preferred_language', pe.preferred_language, 'zip_code', pe.zip_code
      )),
      'organization', jsonb_build_object('id', o.id, 'name', o.name),
      'active_need_count', count(distinct n.id) filter (where n.status = 'active'),
      'referral_count', count(distinct r.id)
    ) as row_data
    from public.passports pp
    join public.people pe on pe.id = pp.person_id
    join public.organizations o on o.id = pp.originating_organization_id
    left join public.needs n on n.passport_id = pp.id
    left join public.referrals r on r.passport_id = pp.id
    where pp.status = p_status
      and public.is_active_organization_member(pp.originating_organization_id)
      and (
        nullif(btrim(p_search), '') is null
        or concat_ws(' ', pe.first_name, pe.last_name, pe.preferred_name) ilike '%' || btrim(p_search) || '%'
        or pe.phone ilike '%' || btrim(p_search) || '%'
        or pp.id::text ilike btrim(p_search) || '%'
      )
    group by pp.id, pe.id, o.id
  ) rows;
  return v_result;
end;
$$;

create or replace function public.get_community_passport_detail(p_passport_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_result jsonb;
begin
  perform public.require_community_mfa();
  if not exists (
    select 1 from public.passports
    where id = p_passport_id
      and public.is_active_organization_member(originating_organization_id)
  ) then raise exception 'not_authorized' using errcode = '42501'; end if;

  select jsonb_build_object(
    'passport', to_jsonb(pp) - 'created_by' - 'person_id',
    'person', to_jsonb(pe) - 'created_by' - 'owning_organization_id',
    'organization', jsonb_build_object('id', o.id, 'name', o.name),
    'needs', coalesce((select jsonb_agg(to_jsonb(n) - 'created_by' order by n.created_at) from public.needs n where n.passport_id = pp.id), '[]'::jsonb),
    'referrals', coalesce((select jsonb_agg(
      (to_jsonb(r) - 'created_by') || jsonb_build_object(
        'to_organization', jsonb_build_object('id', ro.id, 'name', ro.name)
      ) order by r.created_at desc
    ) from public.referrals r join public.organizations ro on ro.id = r.to_organization_id where r.passport_id = pp.id), '[]'::jsonb),
    'consents', coalesce((select jsonb_agg(
      (to_jsonb(c) - 'created_by' - 'person_id') || jsonb_build_object(
        'authorized_organization', jsonb_build_object('id', co.id, 'name', co.name)
      ) order by c.granted_at desc
    ) from public.consents c join public.organizations co on co.id = c.authorized_organization_id where c.passport_id = pp.id), '[]'::jsonb),
    'timeline', coalesce((select jsonb_agg(jsonb_build_object(
      'id', u.id, 'referral_id', u.referral_id, 'update_type', u.update_type,
      'note', u.note, 'created_at', u.created_at
    ) order by u.created_at desc) from public.referral_updates u join public.referrals r on r.id = u.referral_id where r.passport_id = pp.id), '[]'::jsonb)
  ) into v_result
  from public.passports pp
  join public.people pe on pe.id = pp.person_id
  join public.organizations o on o.id = pp.originating_organization_id
  where pp.id = p_passport_id;

  return v_result;
end;
$$;

create or replace function public.list_community_referrals(p_group text default 'new')
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare v_result jsonb;
begin
  perform public.require_community_mfa();
  if p_group not in ('new', 'in_progress', 'closed') then
    raise exception 'invalid_status_group' using errcode = '22023';
  end if;
  select coalesce(jsonb_agg(row_data order by (row_data->>'created_at') desc), '[]'::jsonb)
  into v_result
  from (
    select jsonb_build_object(
      'id', r.id, 'status', r.status, 'priority', r.priority,
      'created_at', r.created_at, 'updated_at', r.updated_at,
      'person_label', case
        when public.is_active_organization_member(r.from_organization_id) then coalesce(nullif(pe.preferred_name, ''), pe.first_name)
        when 'preferred_name' = any(c.allowed_fields) then pe.preferred_name
        when 'first_name' = any(c.allowed_fields) then pe.first_name
        else 'Participant'
      end,
      'need', jsonb_build_object('id', n.id, 'title', n.title),
      'from_organization', jsonb_build_object('id', fo.id, 'name', fo.name),
      'to_organization', jsonb_build_object('id', too.id, 'name', too.name),
      'assigned_to_user_id', r.assigned_to_user_id
    ) row_data
    from public.referrals r
    join public.needs n on n.id = r.need_id
    join public.passports pp on pp.id = r.passport_id
    join public.people pe on pe.id = pp.person_id
    join public.consents c on c.id = r.consent_id
    join public.organizations fo on fo.id = r.from_organization_id
    join public.organizations too on too.id = r.to_organization_id
    where (public.is_active_organization_member(r.from_organization_id) or public.is_active_organization_member(r.to_organization_id))
      and (public.is_active_organization_member(r.from_organization_id) or (c.status = 'active' and (c.expires_at is null or c.expires_at > now())))
      and case p_group
        when 'new' then r.status = 'new'
        when 'in_progress' then r.status in ('accepted', 'contact_attempted', 'contacted', 'enrolled')
        else r.status in ('service_received', 'not_eligible', 'unable_to_contact', 'closed')
      end
  ) rows;
  return v_result;
end;
$$;

revoke all on function public.list_community_passports(public.passport_status, text) from public, anon;
revoke all on function public.get_community_passport_detail(uuid) from public, anon;
revoke all on function public.list_community_referrals(text) from public, anon;
grant execute on function public.list_community_passports(public.passport_status, text) to authenticated;
grant execute on function public.get_community_passport_detail(uuid) to authenticated;
grant execute on function public.list_community_referrals(text) to authenticated;

comment on function public.list_community_referrals(text) is 'Returns only organization-participating referrals; recipient labels require active consent.';
