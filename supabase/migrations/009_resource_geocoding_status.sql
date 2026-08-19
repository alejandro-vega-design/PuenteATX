alter table public.resources
  add column if not exists geocoded_at timestamptz,
  add column if not exists geocode_status text not null default 'pending';

alter table public.resources
  drop constraint if exists resources_geocode_status_check;

alter table public.resources
  add constraint resources_geocode_status_check
  check (geocode_status in ('pending', 'success', 'failed', 'needs_review', 'not_applicable'));

update public.resources
set geocode_status = case
  when latitude is not null and longitude is not null then 'success'
  when coalesce(trim(address_line_1), '') = '' and service_methods && array['online', 'phone']::public.service_method[] then 'not_applicable'
  when coalesce(trim(address_line_1), '') = '' then 'needs_review'
  else 'pending'
end
where geocode_status = 'pending';

comment on column public.resources.geocoded_at is 'Last time the physical resource address was geocoded.';
comment on column public.resources.geocode_status is 'One-time geocoding workflow state; public clients never geocode resources.';

create or replace function public.reset_resource_geocode_on_address_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if row(new.address_line_1, new.address_line_2, new.city, new.state, new.postal_code)
     is distinct from
     row(old.address_line_1, old.address_line_2, old.city, old.state, old.postal_code) then
    if new.latitude is distinct from old.latitude
       and new.longitude is distinct from old.longitude
       and new.latitude is not null
       and new.longitude is not null then
      new.geocode_status := 'success';
      new.geocoded_at := coalesce(new.geocoded_at, now());
    else
      new.latitude := null;
      new.longitude := null;
      new.geocoded_at := null;
      new.geocode_status := case
        when coalesce(trim(new.address_line_1), '') = '' then 'needs_review'
        else 'pending'
      end;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists resources_reset_geocode_on_address_change on public.resources;
create trigger resources_reset_geocode_on_address_change
before update of address_line_1, address_line_2, city, state, postal_code, latitude, longitude
on public.resources
for each row execute function public.reset_resource_geocode_on_address_change();
