-- Community Passport authorization helpers, grants, and RLS policies.

create or replace function public.is_system_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(exists (
    select 1 from public.admin_profiles
    where id = auth.uid() and role = 'admin'
  ), false);
$$;

create or replace function public.has_mfa_session()
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce(auth.jwt() ->> 'aal' = 'aal2', false);
$$;

create or replace function public.active_organization_role(p_organization_id uuid)
returns public.organization_user_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select ou.role
  from public.organization_users ou
  join public.organizations o on o.id = ou.organization_id
  where ou.user_id = auth.uid()
    and ou.organization_id = p_organization_id
    and ou.status = 'active'
    and o.status = 'active'
  limit 1;
$$;

create or replace function public.is_active_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.active_organization_role(p_organization_id) is not null, false);
$$;

create or replace function public.has_active_organization_membership()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(exists (
    select 1
    from public.organization_users ou
    join public.organizations o on o.id = ou.organization_id
    where ou.user_id = auth.uid()
      and ou.status = 'active'
      and o.status = 'active'
  ), false);
$$;

create or replace function public.has_organization_role(
  p_organization_id uuid,
  p_roles public.organization_user_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.active_organization_role(p_organization_id) = any(p_roles), false);
$$;

create or replace function public.can_access_passport(p_passport_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(exists (
    select 1
    from public.passports p
    where p.id = p_passport_id
      and public.is_active_organization_member(p.originating_organization_id)
  ), false);
$$;

create or replace function public.can_access_referral(p_referral_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(exists (
    select 1
    from public.referrals r
    where r.id = p_referral_id
      and (
        public.is_active_organization_member(r.from_organization_id)
        or public.is_active_organization_member(r.to_organization_id)
      )
  ), false);
$$;

revoke all on function public.is_system_admin() from public;
revoke all on function public.has_mfa_session() from public;
revoke all on function public.active_organization_role(uuid) from public;
revoke all on function public.is_active_organization_member(uuid) from public;
revoke all on function public.has_active_organization_membership() from public;
revoke all on function public.has_organization_role(uuid, public.organization_user_role[]) from public;
revoke all on function public.can_access_passport(uuid) from public;
revoke all on function public.can_access_referral(uuid) from public;

grant execute on function public.is_system_admin() to authenticated;
grant execute on function public.has_mfa_session() to authenticated;
grant execute on function public.active_organization_role(uuid) to authenticated;
grant execute on function public.is_active_organization_member(uuid) to authenticated;
grant execute on function public.has_active_organization_membership() to authenticated;
grant execute on function public.has_organization_role(uuid, public.organization_user_role[]) to authenticated;
grant execute on function public.can_access_passport(uuid) to authenticated;
grant execute on function public.can_access_referral(uuid) to authenticated;

create policy "participating users read active organizations"
on public.organizations for select to authenticated
using (
  public.is_system_admin()
  or (status = 'active' and public.has_active_organization_membership())
);

create policy "system admins create organizations"
on public.organizations for insert to authenticated
with check (public.has_mfa_session() and public.is_system_admin());

create policy "system admins update organizations"
on public.organizations for update to authenticated
using (public.has_mfa_session() and public.is_system_admin())
with check (public.has_mfa_session() and public.is_system_admin());

create policy "users read permitted organization memberships"
on public.organization_users for select to authenticated
using (
  user_id = auth.uid()
  or public.is_system_admin()
  or public.has_organization_role(
    organization_id,
    array['admin']::public.organization_user_role[]
  )
);

create policy "authorized admins create organization memberships"
on public.organization_users for insert to authenticated
with check (
  public.has_mfa_session()
  and (
    public.is_system_admin()
    or public.has_organization_role(
      organization_id,
      array['admin']::public.organization_user_role[]
    )
  )
);

create policy "authorized admins update organization memberships"
on public.organization_users for update to authenticated
using (
  public.has_mfa_session()
  and (
    public.is_system_admin()
    or public.has_organization_role(
      organization_id,
      array['admin']::public.organization_user_role[]
    )
  )
)
with check (
  public.has_mfa_session()
  and (
    public.is_system_admin()
    or public.has_organization_role(
      organization_id,
      array['admin']::public.organization_user_role[]
    )
  )
);

create policy "origin members read people"
on public.people for select to authenticated
using (
  public.has_mfa_session()
  and public.is_active_organization_member(owning_organization_id)
);

create policy "origin members read passports"
on public.passports for select to authenticated
using (
  public.has_mfa_session()
  and public.is_active_organization_member(originating_organization_id)
);

create policy "origin members read needs"
on public.needs for select to authenticated
using (public.has_mfa_session() and public.can_access_passport(passport_id));

create policy "origin members read consents"
on public.consents for select to authenticated
using (public.has_mfa_session() and public.can_access_passport(passport_id));

create policy "referral organizations read referrals"
on public.referrals for select to authenticated
using (
  public.has_mfa_session()
  and (
    public.is_active_organization_member(from_organization_id)
    or public.is_active_organization_member(to_organization_id)
  )
);

create policy "referral organizations read shared updates"
on public.referral_updates for select to authenticated
using (public.has_mfa_session() and public.can_access_referral(referral_id));

create policy "organization members read their audit events"
on public.audit_events for select to authenticated
using (
  public.has_mfa_session()
  and public.is_active_organization_member(organization_id)
);

grant select on public.organizations, public.organization_users, public.people,
  public.passports, public.needs, public.consents, public.referrals,
  public.referral_updates, public.audit_events to authenticated;

grant insert, update on public.organizations, public.organization_users to authenticated;

-- Sensitive workflow tables have no direct INSERT/UPDATE/DELETE grants.
-- All mutations occur through the validated functions in migration 013.
revoke insert, update, delete, truncate on public.people, public.passports,
  public.needs, public.consents, public.referrals, public.referral_updates,
  public.audit_events from authenticated;

comment on function public.active_organization_role(uuid) is
  'Returns the signed-in user role only for an active membership in an active organization.';
comment on function public.can_access_referral(uuid) is
  'Checks row-level referral participation. It does not grant access to the underlying person row.';
