create extension if not exists pgcrypto;

create type public.resource_status as enum ('draft', 'published', 'archived');
create type public.service_method as enum ('in_person', 'phone', 'online', 'home_visit');
create type public.cost_type as enum ('free', 'sliding_scale', 'paid', 'unknown');
create type public.admin_role as enum ('admin', 'editor');

create table public.categories (
  id uuid primary key default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  label_es text not null, label_en text not null, description_es text default '', description_en text default '', icon_path text not null,
  sort_order integer not null default 0, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade, display_name text not null, role public.admin_role not null default 'editor',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(), slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), status public.resource_status not null default 'draft',
  organization_name text not null default '', title_es text not null default '', title_en text not null default '', summary_es text not null default '', summary_en text not null default '',
  description_es text not null default '', description_en text not null default '', primary_category_id uuid references public.categories(id),
  keywords_es text[] not null default '{}', keywords_en text[] not null default '{}', languages text[] not null default '{}', service_methods public.service_method[] not null default '{}', cost_type public.cost_type not null default 'unknown',
  eligibility_es text, eligibility_en text, required_documents_es text, required_documents_en text, application_steps_es text, application_steps_en text,
  hours_es text, hours_en text, accessibility_notes_es text, accessibility_notes_en text, service_area_es text, service_area_en text,
  phone text, sms_phone text, whatsapp_phone text, email text, website_url text, address_line_1 text, address_line_2 text, city text, state text, postal_code text, county text,
  latitude numeric(9,6), longitude numeric(9,6), source_url text, logo_url text, is_featured boolean not null default false, is_emergency boolean not null default false,
  last_verified_at date, verification_notes text, published_at timestamptz, archived_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid references auth.users(id), updated_by uuid references auth.users(id),
  constraint publish_required_fields check (status <> 'published' or (organization_name <> '' and (title_es <> '' or title_en <> '') and (summary_es <> '' or summary_en <> '') and (description_es <> '' or description_en <> '') and primary_category_id is not null and (phone is not null or email is not null or website_url is not null) and source_url is not null and last_verified_at is not null))
);

create table public.resource_categories (
  resource_id uuid not null references public.resources(id) on delete cascade, category_id uuid not null references public.categories(id) on delete restrict,
  created_at timestamptz not null default now(), primary key (resource_id, category_id)
);

create index resources_slug_idx on public.resources(slug);
create index resources_status_idx on public.resources(status);
create index resources_primary_category_idx on public.resources(primary_category_id);
create index resources_last_verified_idx on public.resources(last_verified_at desc);
create index resources_updated_idx on public.resources(updated_at desc);
create index resource_categories_category_idx on public.resource_categories(category_id);
create index resources_search_idx on public.resources using gin (to_tsvector('simple', coalesce(organization_name,'') || ' ' || coalesce(title_es,'') || ' ' || coalesce(title_en,'') || ' ' || coalesce(summary_es,'') || ' ' || coalesce(summary_en,'') || ' ' || coalesce(description_es,'') || ' ' || coalesce(description_en,'')));

create function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();
create trigger admin_profiles_updated before update on public.admin_profiles for each row execute function public.set_updated_at();
create trigger resources_updated before update on public.resources for each row execute function public.set_updated_at();

create function public.current_admin_role() returns public.admin_role language sql stable security definer set search_path = public as $$
  select role from public.admin_profiles where id = auth.uid();
$$;

alter table public.categories enable row level security;
alter table public.resources enable row level security;
alter table public.resource_categories enable row level security;
alter table public.admin_profiles enable row level security;

create policy "active categories are public" on public.categories for select using (is_active or public.current_admin_role() in ('admin','editor'));
create policy "published resources are public" on public.resources for select using (status = 'published' or public.current_admin_role() in ('admin','editor'));
create policy "published resource categories are public" on public.resource_categories for select using (exists (select 1 from public.resources r where r.id = resource_id and (r.status = 'published' or public.current_admin_role() in ('admin','editor'))));
create policy "profiles visible to staff" on public.admin_profiles for select using (id = auth.uid() or public.current_admin_role() = 'admin');

create policy "staff insert resources" on public.resources for insert to authenticated with check (public.current_admin_role() = 'admin' or (public.current_admin_role() = 'editor' and status = 'draft'));
create policy "staff update resources" on public.resources for update to authenticated using (public.current_admin_role() in ('admin','editor')) with check (public.current_admin_role() = 'admin' or (public.current_admin_role() = 'editor' and status = 'draft'));
create policy "staff manage resource categories" on public.resource_categories for all to authenticated using (public.current_admin_role() in ('admin','editor')) with check (public.current_admin_role() in ('admin','editor'));
create policy "admins insert categories" on public.categories for insert to authenticated with check (public.current_admin_role() = 'admin');
create policy "admins update categories" on public.categories for update to authenticated using (public.current_admin_role() = 'admin') with check (public.current_admin_role() = 'admin');
create policy "admins manage profiles" on public.admin_profiles for all to authenticated using (public.current_admin_role() = 'admin') with check (public.current_admin_role() = 'admin');

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.resources, public.resource_categories to anon;
grant select on public.categories, public.resources, public.resource_categories, public.admin_profiles to authenticated;
grant insert, update on public.categories, public.resources, public.resource_categories, public.admin_profiles to authenticated;
grant delete on public.resource_categories to authenticated;

-- Run after creating the first Auth user manually:
-- insert into public.admin_profiles (id, display_name, role) values ('AUTH-USER-UUID', 'Administrator', 'admin');
