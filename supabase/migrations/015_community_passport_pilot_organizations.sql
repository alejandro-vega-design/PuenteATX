-- Idempotent pilot organization records. No memberships or users are created here.
insert into public.organizations (name, slug, status)
values
  ('Puente ATX', 'puente-atx', 'active'),
  ('ALAS Texas', 'alas-texas', 'active'),
  ('A2 Toques Foundation', 'a2-toques-foundation', 'active')
on conflict (slug) do update set name = excluded.name, status = excluded.status;
