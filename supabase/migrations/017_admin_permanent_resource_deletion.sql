-- Permanent resource deletion is intentionally exposed only through this
-- admin-checked function. Historical analytics/referrals retain their rows
-- and set resource_id to null through their existing foreign keys.
create or replace function public.delete_resource_permanently(p_resource_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_resource record;
begin
  if auth.uid() is null or public.current_admin_role() is distinct from 'admin'::public.admin_role then
    raise exception 'insufficient_privilege' using errcode = '42501';
  end if;

  select id, slug, organization_name, title_es, title_en
    into v_resource
    from public.resources
   where id = p_resource_id
   for update;

  if not found then
    raise exception 'resource_not_found' using errcode = 'P0002';
  end if;

  delete from public.resources where id = p_resource_id;

  return jsonb_build_object(
    'id', v_resource.id,
    'slug', v_resource.slug,
    'organization_name', v_resource.organization_name,
    'title_es', v_resource.title_es,
    'title_en', v_resource.title_en,
    'deleted_at', now()
  );
end;
$$;

revoke all on function public.delete_resource_permanently(uuid) from public, anon;
grant execute on function public.delete_resource_permanently(uuid) to authenticated;

