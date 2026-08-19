-- Community Passport MVP: additive operational schema.
-- Contains limited participant PII. No clinical, immigration, insurance, or file data.

create type public.organization_status as enum ('active', 'inactive');
create type public.organization_user_role as enum ('admin', 'navigator', 'case_worker', 'viewer');
create type public.organization_user_status as enum ('active', 'inactive');
create type public.passport_status as enum ('active', 'closed');
create type public.need_priority as enum ('standard', 'urgent');
create type public.need_status as enum ('active', 'resolved', 'closed');
create type public.consent_type as enum ('verbal');
create type public.consent_status as enum ('active', 'revoked', 'expired');
create type public.referral_status as enum (
  'new',
  'accepted',
  'contact_attempted',
  'contacted',
  'enrolled',
  'service_received',
  'not_eligible',
  'unable_to_contact',
  'closed'
);
create type public.referral_update_type as enum (
  'referral_created',
  'accepted',
  'contact_attempted',
  'contacted',
  'enrolled',
  'service_received',
  'not_eligible',
  'unable_to_contact',
  'closed',
  'note_added'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status public.organization_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organization_user_role not null,
  status public.organization_user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.people (
  id uuid primary key default gen_random_uuid(),
  owning_organization_id uuid not null references public.organizations(id) on delete restrict,
  first_name text not null check (char_length(btrim(first_name)) between 1 and 100),
  last_name text check (last_name is null or char_length(btrim(last_name)) between 1 and 100),
  preferred_name text check (preferred_name is null or char_length(btrim(preferred_name)) between 1 and 100),
  phone text check (phone is null or char_length(btrim(phone)) between 7 and 30),
  email text check (email is null or char_length(btrim(email)) between 3 and 254),
  preferred_language text not null default 'es' check (preferred_language in ('es', 'en', 'other')),
  zip_code text check (zip_code is null or zip_code ~ '^[0-9]{5}$'),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);

create table public.passports (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete restrict,
  originating_organization_id uuid not null references public.organizations(id) on delete restrict,
  status public.passport_status not null default 'active',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz,
  check ((status = 'closed') = (closed_at is not null))
);

create unique index passports_one_active_per_person_idx
  on public.passports (person_id)
  where status = 'active';

create table public.needs (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.passports(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete restrict,
  title text not null check (char_length(btrim(title)) between 2 and 120),
  description text check (description is null or char_length(btrim(description)) between 1 and 1000),
  priority public.need_priority not null default 'standard',
  status public.need_status not null default 'active',
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete restrict,
  passport_id uuid not null references public.passports(id) on delete cascade,
  consent_type public.consent_type not null default 'verbal',
  authorized_organization_id uuid not null references public.organizations(id) on delete restrict,
  allowed_fields text[] not null,
  purpose text not null check (char_length(btrim(purpose)) between 5 and 500),
  status public.consent_status not null default 'active',
  granted_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(allowed_fields) > 0),
  check (allowed_fields <@ array[
    'preferred_name', 'first_name', 'last_name', 'phone', 'email',
    'preferred_language', 'zip_code', 'need_summary'
  ]::text[]),
  check (expires_at is null or expires_at > granted_at),
  check ((status = 'revoked') = (revoked_at is not null))
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.passports(id) on delete restrict,
  need_id uuid not null references public.needs(id) on delete restrict,
  consent_id uuid not null references public.consents(id) on delete restrict,
  from_organization_id uuid not null references public.organizations(id) on delete restrict,
  to_organization_id uuid not null references public.organizations(id) on delete restrict,
  assigned_to_user_id uuid references auth.users(id) on delete set null,
  resource_id uuid references public.resources(id) on delete set null,
  status public.referral_status not null default 'new',
  priority public.need_priority not null default 'standard',
  reason text not null check (char_length(btrim(reason)) between 2 and 1000),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  closed_at timestamptz,
  closed_reason text check (closed_reason is null or char_length(btrim(closed_reason)) between 2 and 500),
  check (from_organization_id <> to_organization_id),
  check ((status = 'accepted') is false or accepted_at is not null),
  check ((status = 'service_received') is false or completed_at is not null),
  check ((status in ('not_eligible', 'unable_to_contact', 'closed')) is false or closed_at is not null)
);

create table public.referral_updates (
  id uuid primary key default gen_random_uuid(),
  referral_id uuid not null references public.referrals(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  update_type public.referral_update_type not null,
  note text check (note is null or char_length(btrim(note)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  action text not null check (action in (
    'passport_created', 'passport_viewed', 'person_updated', 'need_added',
    'referral_created', 'referral_viewed', 'referral_accepted',
    'referral_status_changed', 'referral_completed',
    'consent_granted', 'consent_revoked'
  )),
  record_type text not null check (record_type in ('person', 'passport', 'need', 'referral', 'consent')),
  record_id uuid not null,
  metadata jsonb not null default '{}'::jsonb check (
    jsonb_typeof(metadata) = 'object'
    and octet_length(metadata::text) <= 2048
  ),
  created_at timestamptz not null default now()
);

create index organization_users_user_idx on public.organization_users (user_id, status);
create index organization_users_org_idx on public.organization_users (organization_id, status, role);
create index people_owner_idx on public.people (owning_organization_id, updated_at desc);
create index people_name_idx on public.people (owning_organization_id, lower(last_name), lower(first_name));
create index people_phone_idx on public.people (owning_organization_id, phone) where phone is not null;
create index passports_origin_status_idx on public.passports (originating_organization_id, status, updated_at desc);
create index needs_passport_status_idx on public.needs (passport_id, status, updated_at desc);
create index consents_passport_org_idx on public.consents (passport_id, authorized_organization_id, status);
create index referrals_from_status_idx on public.referrals (from_organization_id, status, updated_at desc);
create index referrals_to_status_idx on public.referrals (to_organization_id, status, updated_at desc);
create index referrals_assignee_idx on public.referrals (assigned_to_user_id, status) where assigned_to_user_id is not null;
create index referral_updates_referral_idx on public.referral_updates (referral_id, created_at);
create index audit_events_record_idx on public.audit_events (record_type, record_id, created_at desc);
create index audit_events_org_idx on public.audit_events (organization_id, created_at desc);

create trigger organizations_updated before update on public.organizations
for each row execute function public.set_updated_at();
create trigger organization_users_updated before update on public.organization_users
for each row execute function public.set_updated_at();
create trigger people_updated before update on public.people
for each row execute function public.set_updated_at();
create trigger passports_updated before update on public.passports
for each row execute function public.set_updated_at();
create trigger needs_updated before update on public.needs
for each row execute function public.set_updated_at();
create trigger consents_updated before update on public.consents
for each row execute function public.set_updated_at();
create trigger referrals_updated before update on public.referrals
for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.organization_users enable row level security;
alter table public.people enable row level security;
alter table public.passports enable row level security;
alter table public.needs enable row level security;
alter table public.consents enable row level security;
alter table public.referrals enable row level security;
alter table public.referral_updates enable row level security;
alter table public.audit_events enable row level security;

alter table public.organizations force row level security;
alter table public.organization_users force row level security;
alter table public.people force row level security;
alter table public.passports force row level security;
alter table public.needs force row level security;
alter table public.consents force row level security;
alter table public.referrals force row level security;
alter table public.referral_updates force row level security;
alter table public.audit_events force row level security;

revoke all on public.organizations, public.organization_users, public.people,
  public.passports, public.needs, public.consents, public.referrals,
  public.referral_updates, public.audit_events from public, anon, authenticated;

comment on table public.people is
  'Minimum participant contact data for Community Passport. Do not store clinical, immigration, insurance, SSN, or document data.';
comment on table public.referral_updates is
  'Shared operational timeline. Notes are visible to both referral organizations and must not contain clinical or other excluded sensitive data.';
comment on table public.audit_events is
  'Append-only Community Passport security and workflow audit events. Metadata must never contain participant PII.';
