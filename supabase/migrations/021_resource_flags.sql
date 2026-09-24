create type public.resource_flag_status as enum ('open', 'reviewing', 'resolved', 'dismissed');

create table public.resource_flags (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  reasons text[] not null,
  note text,
  status public.resource_flag_status not null default 'open',
  session_id text not null,
  lang text not null,
  area_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint resource_flags_reasons_not_empty check (array_length(reasons, 1) > 0),
  constraint resource_flags_reasons_valid check (reasons <@ array['wrong_contact','closed','wrong_hours','outdated','other']::text[]),
  constraint resource_flags_lang_valid check (lang in ('es','en'))
);

create index resource_flags_resource_idx on public.resource_flags(resource_id);
create index resource_flags_status_idx on public.resource_flags(status);
create index resource_flags_open_resource_idx on public.resource_flags(resource_id) where status in ('open','reviewing');

create trigger resource_flags_updated before update on public.resource_flags for each row execute function public.set_updated_at();

alter table public.resource_flags enable row level security;
alter table public.resource_flags force row level security;

-- No anon grants at all: public submissions never talk to Supabase directly.
-- They go through /api/resource-flags (service-role key, same pattern as
-- analytics_events / api/analytics/events.js), which validates the payload
-- server-side and confirms the resource exists and is published before
-- inserting. RLS below only governs the admin dashboard's authenticated reads
-- and status updates.
revoke all on public.resource_flags from public, anon, authenticated;

create policy "staff read resource flags" on public.resource_flags for select to authenticated using (public.current_admin_role() in ('admin','editor'));
create policy "staff update resource flags" on public.resource_flags for update to authenticated using (public.current_admin_role() in ('admin','editor')) with check (public.current_admin_role() in ('admin','editor'));

grant usage on schema public to authenticated;
grant select, update on public.resource_flags to authenticated;

comment on table public.resource_flags is
  'Anonymous public reports that a resource''s information may be wrong (wrong_contact, closed, wrong_hours, outdated, other). Inserted only by /api/resource-flags using the service-role key — never directly by anon. Staff review and change status from the admin dashboard; a flag never hides a resource by itself.';
