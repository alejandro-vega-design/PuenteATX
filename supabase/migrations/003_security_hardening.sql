-- Make browser-facing privileges explicit and keep the role helper private to API roles.
revoke all on function public.current_admin_role() from public;
grant execute on function public.current_admin_role() to anon, authenticated;

revoke insert, update, delete, truncate, references, trigger on public.categories from anon;
revoke insert, update, delete, truncate, references, trigger on public.resources from anon;
revoke insert, update, delete, truncate, references, trigger on public.resource_categories from anon;
revoke all on public.admin_profiles from anon;

revoke delete on public.categories, public.resources, public.admin_profiles from authenticated;

-- Published rows are public, but internal verification notes and staff identifiers are not.
revoke select on public.resources from anon;
grant select (
  id, slug, status, organization_name, title_es, title_en, summary_es, summary_en,
  description_es, description_en, primary_category_id, keywords_es, keywords_en,
  languages, service_methods, cost_type, eligibility_es, eligibility_en,
  required_documents_es, required_documents_en, application_steps_es, application_steps_en,
  hours_es, hours_en, accessibility_notes_es, accessibility_notes_en,
  service_area_es, service_area_en, phone, sms_phone, whatsapp_phone, email, website_url,
  address_line_1, address_line_2, city, state, postal_code, county, latitude, longitude,
  source_url, logo_url, is_featured, is_emergency, last_verified_at, published_at,
  created_at, updated_at
) on public.resources to anon;

-- Editors may only alter category links belonging to drafts. Admins may manage all links.
drop policy if exists "staff manage resource categories" on public.resource_categories;
create policy "staff read resource categories"
on public.resource_categories for select to authenticated
using (public.current_admin_role() in ('admin','editor'));

create policy "staff insert resource categories"
on public.resource_categories for insert to authenticated
with check (
  public.current_admin_role() = 'admin'
  or (
    public.current_admin_role() = 'editor'
    and exists (select 1 from public.resources r where r.id = resource_id and r.status = 'draft')
  )
);

create policy "staff delete resource categories"
on public.resource_categories for delete to authenticated
using (
  public.current_admin_role() = 'admin'
  or (
    public.current_admin_role() = 'editor'
    and exists (select 1 from public.resources r where r.id = resource_id and r.status = 'draft')
  )
);
