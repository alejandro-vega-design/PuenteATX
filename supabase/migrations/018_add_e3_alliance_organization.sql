-- Add E3 Alliance to the Community Passport organization directory.
-- This creates no Auth user, membership, or access by itself.
insert into public.organizations (name, slug, status)
values ('E3 Alliance', 'e3-alliance', 'active')
on conflict (slug) do update
set name = excluded.name,
    status = excluded.status;

