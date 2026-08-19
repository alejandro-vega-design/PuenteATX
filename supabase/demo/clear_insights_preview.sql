-- Elimina exclusivamente los datos ficticios creados por
-- supabase/demo/seed_insights_preview.sql.

delete from public.analytics_events
where environment = 'preview'
  and metadata ->> 'demo_seed' = 'puente-atx-insights-v1';

select count(*) as remaining_demo_events
from public.analytics_events
where metadata ->> 'demo_seed' = 'puente-atx-insights-v1';
