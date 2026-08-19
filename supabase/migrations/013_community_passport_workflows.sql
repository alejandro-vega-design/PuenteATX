-- Community Passport transactional workflows and consent-aware projections.

create or replace function public.write_community_audit(
  p_organization_id uuid,
  p_action text,
  p_record_type text,
  p_record_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.audit_events (
    user_id, organization_id, action, record_type, record_id, metadata
  ) values (
    auth.uid(), p_organization_id, p_action, p_record_type, p_record_id,
    coalesce(p_metadata, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.write_community_audit(uuid, text, text, uuid, jsonb) from public, anon, authenticated;

create or replace function public.require_community_mfa()
returns void
language plpgsql
stable
security invoker
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if not public.has_mfa_session() then
    raise exception 'mfa_required' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.require_community_mfa() from public;
grant execute on function public.require_community_mfa() to authenticated;

create or replace function public.create_person_and_passport(
  p_organization_id uuid,
  p_first_name text,
  p_last_name text default null,
  p_preferred_name text default null,
  p_phone text default null,
  p_email text default null,
  p_preferred_language text default 'es',
  p_zip_code text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_person_id uuid;
  v_passport_id uuid;
begin
  perform public.require_community_mfa();
  if not public.has_organization_role(
    p_organization_id,
    array['admin', 'navigator']::public.organization_user_role[]
  ) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  insert into public.people (
    owning_organization_id, first_name, last_name, preferred_name,
    phone, email, preferred_language, zip_code, created_by
  ) values (
    p_organization_id,
    btrim(p_first_name),
    nullif(btrim(p_last_name), ''),
    nullif(btrim(p_preferred_name), ''),
    nullif(btrim(p_phone), ''),
    nullif(lower(btrim(p_email)), ''),
    p_preferred_language,
    nullif(btrim(p_zip_code), ''),
    auth.uid()
  ) returning id into v_person_id;

  insert into public.passports (
    person_id, originating_organization_id, created_by
  ) values (
    v_person_id, p_organization_id, auth.uid()
  ) returning id into v_passport_id;

  perform public.write_community_audit(
    p_organization_id, 'passport_created', 'passport', v_passport_id,
    '{}'::jsonb
  );

  return jsonb_build_object('person_id', v_person_id, 'passport_id', v_passport_id);
end;
$$;

create or replace function public.add_passport_need(
  p_passport_id uuid,
  p_category_id uuid,
  p_title text,
  p_description text default null,
  p_priority public.need_priority default 'standard'
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_organization_id uuid;
  v_need_id uuid;
begin
  perform public.require_community_mfa();
  select originating_organization_id into v_organization_id
  from public.passports
  where id = p_passport_id and status = 'active';

  if v_organization_id is null or not public.has_organization_role(
    v_organization_id,
    array['admin', 'navigator']::public.organization_user_role[]
  ) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from public.categories where id = p_category_id and is_active) then
    raise exception 'invalid_category' using errcode = '22023';
  end if;

  insert into public.needs (
    passport_id, category_id, title, description, priority, created_by
  ) values (
    p_passport_id, p_category_id, btrim(p_title),
    nullif(btrim(p_description), ''), p_priority, auth.uid()
  ) returning id into v_need_id;

  perform public.write_community_audit(
    v_organization_id, 'need_added', 'need', v_need_id,
    jsonb_build_object('passport_id', p_passport_id, 'category_id', p_category_id)
  );
  return v_need_id;
end;
$$;

create or replace function public.grant_passport_consent(
  p_passport_id uuid,
  p_authorized_organization_id uuid,
  p_allowed_fields text[],
  p_purpose text,
  p_expires_at timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_origin_id uuid;
  v_person_id uuid;
  v_consent_id uuid;
  v_allowed text[];
begin
  perform public.require_community_mfa();
  select originating_organization_id, person_id
  into v_origin_id, v_person_id
  from public.passports
  where id = p_passport_id and status = 'active';

  if v_origin_id is null or not public.has_organization_role(
    v_origin_id,
    array['admin', 'navigator']::public.organization_user_role[]
  ) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if p_authorized_organization_id = v_origin_id
    or not exists (
      select 1 from public.organizations
      where id = p_authorized_organization_id and status = 'active'
    ) then
    raise exception 'invalid_destination' using errcode = '22023';
  end if;

  select array_agg(distinct field order by field)
  into v_allowed
  from unnest(coalesce(p_allowed_fields, '{}'::text[])) field;

  insert into public.consents (
    person_id, passport_id, authorized_organization_id, allowed_fields,
    purpose, expires_at, created_by
  ) values (
    v_person_id, p_passport_id, p_authorized_organization_id, v_allowed,
    btrim(p_purpose), p_expires_at, auth.uid()
  ) returning id into v_consent_id;

  perform public.write_community_audit(
    v_origin_id, 'consent_granted', 'consent', v_consent_id,
    jsonb_build_object('authorized_organization_id', p_authorized_organization_id)
  );
  return v_consent_id;
end;
$$;

create or replace function public.create_passport_referral(
  p_passport_id uuid,
  p_need_id uuid,
  p_consent_id uuid,
  p_to_organization_id uuid,
  p_reason text,
  p_priority public.need_priority default 'standard',
  p_resource_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_origin_id uuid;
  v_person_id uuid;
  v_referral_id uuid;
begin
  perform public.require_community_mfa();
  select originating_organization_id, person_id
  into v_origin_id, v_person_id
  from public.passports
  where id = p_passport_id and status = 'active';

  if v_origin_id is null or not public.has_organization_role(
    v_origin_id,
    array['admin', 'navigator']::public.organization_user_role[]
  ) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.needs
    where id = p_need_id and passport_id = p_passport_id and status = 'active'
  ) then
    raise exception 'invalid_need' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.consents
    where id = p_consent_id
      and person_id = v_person_id
      and passport_id = p_passport_id
      and authorized_organization_id = p_to_organization_id
      and status = 'active'
      and (expires_at is null or expires_at > now())
  ) then
    raise exception 'active_consent_required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.organizations
    where id = p_to_organization_id and status = 'active'
  ) then
    raise exception 'invalid_destination' using errcode = '22023';
  end if;

  insert into public.referrals (
    passport_id, need_id, consent_id, from_organization_id,
    to_organization_id, resource_id, priority, reason, created_by
  ) values (
    p_passport_id, p_need_id, p_consent_id, v_origin_id,
    p_to_organization_id, p_resource_id, p_priority, btrim(p_reason), auth.uid()
  ) returning id into v_referral_id;

  insert into public.referral_updates (
    referral_id, created_by, update_type
  ) values (v_referral_id, auth.uid(), 'referral_created');

  perform public.write_community_audit(
    v_origin_id, 'referral_created', 'referral', v_referral_id,
    jsonb_build_object('to_organization_id', p_to_organization_id)
  );
  perform public.write_community_audit(
    p_to_organization_id, 'referral_created', 'referral', v_referral_id,
    jsonb_build_object('from_organization_id', v_origin_id)
  );
  return v_referral_id;
end;
$$;

create or replace function public.accept_passport_referral(
  p_referral_id uuid,
  p_assign_to_user_id uuid default null,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_referral public.referrals%rowtype;
  v_assignee uuid;
begin
  perform public.require_community_mfa();
  select * into v_referral from public.referrals where id = p_referral_id for update;
  if v_referral.id is null or not public.has_organization_role(
    v_referral.to_organization_id,
    array['admin', 'navigator', 'case_worker']::public.organization_user_role[]
  ) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if v_referral.status <> 'new' then
    raise exception 'invalid_status_transition' using errcode = '22023';
  end if;

  v_assignee := coalesce(p_assign_to_user_id, auth.uid());
  if not exists (
    select 1 from public.organization_users
    where organization_id = v_referral.to_organization_id
      and user_id = v_assignee
      and status = 'active'
  ) then
    raise exception 'invalid_assignee' using errcode = '22023';
  end if;

  update public.referrals
  set status = 'accepted', accepted_at = now(), assigned_to_user_id = v_assignee
  where id = p_referral_id;

  insert into public.referral_updates (referral_id, created_by, update_type, note)
  values (p_referral_id, auth.uid(), 'accepted', nullif(btrim(p_note), ''));

  perform public.write_community_audit(
    v_referral.to_organization_id, 'referral_accepted', 'referral', p_referral_id,
    jsonb_build_object('previous_status', 'new', 'new_status', 'accepted')
  );
  perform public.write_community_audit(
    v_referral.from_organization_id, 'referral_accepted', 'referral', p_referral_id,
    jsonb_build_object('previous_status', 'new', 'new_status', 'accepted')
  );
end;
$$;

create or replace function public.update_passport_referral_status(
  p_referral_id uuid,
  p_status public.referral_status,
  p_note text default null,
  p_closed_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_referral public.referrals%rowtype;
  v_allowed boolean := false;
  v_action text := 'referral_status_changed';
begin
  perform public.require_community_mfa();
  select * into v_referral from public.referrals where id = p_referral_id for update;
  if v_referral.id is null or not public.has_organization_role(
    v_referral.to_organization_id,
    array['admin', 'navigator', 'case_worker']::public.organization_user_role[]
  ) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  v_allowed := case v_referral.status
    when 'accepted' then p_status in ('contact_attempted', 'contacted', 'enrolled', 'not_eligible', 'unable_to_contact', 'closed')
    when 'contact_attempted' then p_status in ('contact_attempted', 'contacted', 'not_eligible', 'unable_to_contact', 'closed')
    when 'contacted' then p_status in ('enrolled', 'service_received', 'not_eligible', 'unable_to_contact', 'closed')
    when 'enrolled' then p_status in ('service_received', 'not_eligible', 'unable_to_contact', 'closed')
    else false
  end;
  if not v_allowed then
    raise exception 'invalid_status_transition' using errcode = '22023';
  end if;
  if p_status in ('not_eligible', 'unable_to_contact', 'closed')
    and nullif(btrim(p_closed_reason), '') is null then
    raise exception 'closed_reason_required' using errcode = '22023';
  end if;

  update public.referrals
  set status = p_status,
      completed_at = case when p_status = 'service_received' then now() else completed_at end,
      closed_at = case when p_status in ('not_eligible', 'unable_to_contact', 'closed') then now() else closed_at end,
      closed_reason = case when p_status in ('not_eligible', 'unable_to_contact', 'closed') then btrim(p_closed_reason) else closed_reason end
  where id = p_referral_id;

  insert into public.referral_updates (referral_id, created_by, update_type, note)
  values (
    p_referral_id, auth.uid(), p_status::text::public.referral_update_type,
    nullif(btrim(p_note), '')
  );

  if p_status = 'service_received' then v_action := 'referral_completed'; end if;
  perform public.write_community_audit(
    v_referral.to_organization_id, v_action, 'referral', p_referral_id,
    jsonb_build_object('previous_status', v_referral.status, 'new_status', p_status)
  );
  perform public.write_community_audit(
    v_referral.from_organization_id, v_action, 'referral', p_referral_id,
    jsonb_build_object('previous_status', v_referral.status, 'new_status', p_status)
  );
end;
$$;

create or replace function public.revoke_passport_consent(p_consent_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_consent public.consents%rowtype;
  v_origin_id uuid;
begin
  perform public.require_community_mfa();
  select * into v_consent from public.consents where id = p_consent_id for update;
  select originating_organization_id into v_origin_id
  from public.passports where id = v_consent.passport_id;
  if v_consent.id is null or not public.has_organization_role(
    v_origin_id,
    array['admin', 'navigator']::public.organization_user_role[]
  ) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if v_consent.status <> 'active' then
    raise exception 'consent_not_active' using errcode = '22023';
  end if;

  update public.consents
  set status = 'revoked', revoked_at = now()
  where id = p_consent_id;
  perform public.write_community_audit(
    v_origin_id, 'consent_revoked', 'consent', p_consent_id,
    jsonb_build_object('authorized_organization_id', v_consent.authorized_organization_id)
  );
end;
$$;

create or replace function public.get_passport_referral_detail(p_referral_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_referral public.referrals%rowtype;
  v_person public.people%rowtype;
  v_need public.needs%rowtype;
  v_consent public.consents%rowtype;
  v_is_origin boolean;
  v_consent_active boolean;
  v_person_projection jsonb := '{}'::jsonb;
  v_result jsonb;
begin
  perform public.require_community_mfa();
  select * into v_referral from public.referrals where id = p_referral_id;
  if v_referral.id is null or not public.can_access_referral(p_referral_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  select p.* into v_person
  from public.people p
  join public.passports pp on pp.person_id = p.id
  where pp.id = v_referral.passport_id;
  select * into v_need from public.needs where id = v_referral.need_id;
  select * into v_consent from public.consents where id = v_referral.consent_id;

  v_is_origin := public.is_active_organization_member(v_referral.from_organization_id);
  v_consent_active := v_consent.status = 'active'
    and (v_consent.expires_at is null or v_consent.expires_at > now());

  if v_is_origin then
    v_person_projection := jsonb_strip_nulls(jsonb_build_object(
      'first_name', v_person.first_name,
      'last_name', v_person.last_name,
      'preferred_name', v_person.preferred_name,
      'phone', v_person.phone,
      'email', v_person.email,
      'preferred_language', v_person.preferred_language,
      'zip_code', v_person.zip_code
    ));
  elsif v_consent_active then
    if 'preferred_name' = any(v_consent.allowed_fields) then v_person_projection := v_person_projection || jsonb_build_object('preferred_name', v_person.preferred_name); end if;
    if 'first_name' = any(v_consent.allowed_fields) then v_person_projection := v_person_projection || jsonb_build_object('first_name', v_person.first_name); end if;
    if 'last_name' = any(v_consent.allowed_fields) then v_person_projection := v_person_projection || jsonb_build_object('last_name', v_person.last_name); end if;
    if 'phone' = any(v_consent.allowed_fields) then v_person_projection := v_person_projection || jsonb_build_object('phone', v_person.phone); end if;
    if 'email' = any(v_consent.allowed_fields) then v_person_projection := v_person_projection || jsonb_build_object('email', v_person.email); end if;
    if 'preferred_language' = any(v_consent.allowed_fields) then v_person_projection := v_person_projection || jsonb_build_object('preferred_language', v_person.preferred_language); end if;
    if 'zip_code' = any(v_consent.allowed_fields) then v_person_projection := v_person_projection || jsonb_build_object('zip_code', v_person.zip_code); end if;
    v_person_projection := jsonb_strip_nulls(v_person_projection);
  end if;

  select jsonb_build_object(
    'referral', to_jsonb(v_referral) - 'created_by',
    'person', v_person_projection,
    'need', jsonb_build_object(
      'id', v_need.id,
      'category_id', v_need.category_id,
      'title', v_need.title,
      'description', case
        when v_is_origin or (v_consent_active and 'need_summary' = any(v_consent.allowed_fields))
        then v_need.description else null end,
      'priority', v_need.priority,
      'status', v_need.status
    ),
    'consent', jsonb_build_object(
      'id', v_consent.id,
      'status', case
        when v_consent_active then 'active'
        when v_consent.status = 'active' and v_consent.expires_at <= now() then 'expired'
        else v_consent.status::text end,
      'allowed_fields', case when v_is_origin or v_consent_active then v_consent.allowed_fields else '{}'::text[] end,
      'purpose', case when v_is_origin or v_consent_active then v_consent.purpose else null end,
      'granted_at', v_consent.granted_at,
      'expires_at', v_consent.expires_at,
      'revoked_at', v_consent.revoked_at
    ),
    'from_organization', (select jsonb_build_object('id', id, 'name', name) from public.organizations where id = v_referral.from_organization_id),
    'to_organization', (select jsonb_build_object('id', id, 'name', name) from public.organizations where id = v_referral.to_organization_id),
    'updates', (
      select coalesce(jsonb_agg(
        jsonb_build_object(
          'id', ru.id,
          'update_type', ru.update_type,
          'note', ru.note,
          'created_at', ru.created_at
        ) order by ru.created_at
      ), '[]'::jsonb)
      from public.referral_updates ru
      where ru.referral_id = p_referral_id
    )
  ) into v_result;
  return v_result;
end;
$$;

create or replace function public.record_community_record_view(
  p_record_type text,
  p_record_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_organization_id uuid;
begin
  perform public.require_community_mfa();
  if p_record_type = 'passport' then
    select originating_organization_id into v_organization_id
    from public.passports where id = p_record_id;
    if v_organization_id is null or not public.can_access_passport(p_record_id) then
      raise exception 'not_authorized' using errcode = '42501';
    end if;
    perform public.write_community_audit(v_organization_id, 'passport_viewed', 'passport', p_record_id, '{}'::jsonb);
  elsif p_record_type = 'referral' then
    select case
      when public.is_active_organization_member(from_organization_id) then from_organization_id
      else to_organization_id end
    into v_organization_id
    from public.referrals where id = p_record_id;
    if v_organization_id is null or not public.can_access_referral(p_record_id) then
      raise exception 'not_authorized' using errcode = '42501';
    end if;
    perform public.write_community_audit(v_organization_id, 'referral_viewed', 'referral', p_record_id, '{}'::jsonb);
  else
    raise exception 'invalid_record_type' using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.create_person_and_passport(uuid, text, text, text, text, text, text, text) from public, anon;
revoke all on function public.add_passport_need(uuid, uuid, text, text, public.need_priority) from public, anon;
revoke all on function public.grant_passport_consent(uuid, uuid, text[], text, timestamptz) from public, anon;
revoke all on function public.create_passport_referral(uuid, uuid, uuid, uuid, text, public.need_priority, uuid) from public, anon;
revoke all on function public.accept_passport_referral(uuid, uuid, text) from public, anon;
revoke all on function public.update_passport_referral_status(uuid, public.referral_status, text, text) from public, anon;
revoke all on function public.revoke_passport_consent(uuid) from public, anon;
revoke all on function public.get_passport_referral_detail(uuid) from public, anon;
revoke all on function public.record_community_record_view(text, uuid) from public, anon;

grant execute on function public.create_person_and_passport(uuid, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.add_passport_need(uuid, uuid, text, text, public.need_priority) to authenticated;
grant execute on function public.grant_passport_consent(uuid, uuid, text[], text, timestamptz) to authenticated;
grant execute on function public.create_passport_referral(uuid, uuid, uuid, uuid, text, public.need_priority, uuid) to authenticated;
grant execute on function public.accept_passport_referral(uuid, uuid, text) to authenticated;
grant execute on function public.update_passport_referral_status(uuid, public.referral_status, text, text) to authenticated;
grant execute on function public.revoke_passport_consent(uuid) to authenticated;
grant execute on function public.get_passport_referral_detail(uuid) to authenticated;
grant execute on function public.record_community_record_view(text, uuid) to authenticated;

comment on function public.get_passport_referral_detail(uuid) is
  'Returns full participant contact data to the origin organization and only active-consent fields to the destination organization.';
comment on function public.update_passport_referral_status(uuid, public.referral_status, text, text) is
  'Applies an allowed closed-loop transition and atomically writes the shared timeline and organization audit events.';
