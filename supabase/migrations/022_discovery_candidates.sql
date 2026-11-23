create type public.discovery_candidate_status as enum ('pending', 'approved', 'rejected');

create table public.discovery_candidates (
  id uuid primary key default gen_random_uuid(),
  -- 'irs_bmf' today; 'search', 'link_graph', 'community' once those layers exist.
  source text not null,
  -- Source-specific identifier for dedup/audit (e.g. the EIN for irs_bmf).
  source_ref text,
  organization_name text not null,
  primary_category text not null check (primary_category in (
    'comida', 'vivienda', 'salud', 'transporte', 'recursos-financieros',
    'educacion', 'ayuda-legal', 'otros-recursos'
  )),
  -- Every other CSV_IMPORT_HEADERS-shaped field the source could partially
  -- fill in (city, postal_code, verification_notes, ...). Kept as jsonb
  -- instead of ~40 separate columns since most fields are blank for most
  -- candidates and the shape already matches src/data/csvImport.js.
  suggested_fields jsonb not null default '{}'::jsonb,
  status public.discovery_candidate_status not null default 'pending',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  -- Set when a candidate is approved and turned into a draft resource.
  resulting_resource_id uuid references public.resources(id)
);

create index discovery_candidates_status_idx on public.discovery_candidates(status);
create index discovery_candidates_source_idx on public.discovery_candidates(source, source_ref);

alter table public.discovery_candidates enable row level security;
alter table public.discovery_candidates force row level security;

-- No anon grants at all, and no INSERT grant for authenticated either: rows
-- are written only by the discovery pipeline itself (a script the site owner
-- runs, using the service-role key directly against Supabase — see
-- scripts/resource-discovery/README.md), which bypasses RLS by design, same
-- as analytics_events / resource_flags. Staff can only read and change status
-- from the admin dashboard; they never create a candidate by hand here.
revoke all on public.discovery_candidates from public, anon, authenticated;

create policy "staff read discovery candidates" on public.discovery_candidates for select to authenticated using (public.current_admin_role() in ('admin','editor'));
create policy "staff update discovery candidates" on public.discovery_candidates for update to authenticated using (public.current_admin_role() in ('admin','editor')) with check (public.current_admin_role() in ('admin','editor'));

grant usage on schema public to authenticated;
grant select, update on public.discovery_candidates to authenticated;

comment on table public.discovery_candidates is
  'Organizations surfaced by the resource-discovery pipeline (scripts/resource-discovery/) as possible new PuenteATX resources. Never published automatically — staff approve (creates a draft resource) or reject each one from /admin/descubrimiento.';
