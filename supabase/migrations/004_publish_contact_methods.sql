alter table public.resources
  drop constraint if exists publish_required_fields;

alter table public.resources
  add constraint publish_required_fields check (
    status <> 'published'
    or (
      btrim(organization_name) <> ''
      and (btrim(title_es) <> '' or btrim(title_en) <> '')
      and (btrim(summary_es) <> '' or btrim(summary_en) <> '')
      and (btrim(description_es) <> '' or btrim(description_en) <> '')
      and primary_category_id is not null
      and (
        nullif(btrim(phone), '') is not null
        or nullif(btrim(sms_phone), '') is not null
        or nullif(btrim(whatsapp_phone), '') is not null
        or nullif(btrim(email), '') is not null
        or nullif(btrim(website_url), '') is not null
      )
      and nullif(btrim(source_url), '') is not null
      and last_verified_at is not null
    )
  );
