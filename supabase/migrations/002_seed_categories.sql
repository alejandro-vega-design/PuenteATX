insert into public.categories (id, slug, label_es, label_en, description_es, description_en, icon_path, sort_order) values
('10000000-0000-4000-8000-000000000001','comida','Comida','Food','Alimentos y despensas.','Food and pantry support.','/assets/icons/food.svg',1),
('10000000-0000-4000-8000-000000000002','vivienda','Vivienda','Housing','Renta y vivienda estable.','Rent and stable housing.','/assets/icons/home.svg',2),
('10000000-0000-4000-8000-000000000003','salud','Salud','Health','Clínicas y bienestar.','Clinics and wellness.','/assets/icons/health.svg',3),
('10000000-0000-4000-8000-000000000004','transporte','Transporte','Transportation','Opciones para trasladarse.','Transportation options.','/assets/icons/bus.svg',4),
('10000000-0000-4000-8000-000000000005','recursos-financieros','Recursos financieros','Financial resources','Apoyo económico.','Financial support.','/assets/icons/money.svg',5),
('10000000-0000-4000-8000-000000000006','educacion','Educación','Education','Escuela y aprendizaje.','School and learning.','/assets/icons/book.svg',6),
('10000000-0000-4000-8000-000000000007','ayuda-legal','Ayuda legal','Legal help','Orientación legal.','Legal guidance.','/assets/icons/legal.svg',7),
('10000000-0000-4000-8000-000000000008','otros-recursos','Otros recursos','Other resources','Otros apoyos comunitarios.','Other community support.','/assets/icons/shirt.svg',8)
on conflict (slug) do update set label_es=excluded.label_es, label_en=excluded.label_en, description_es=excluded.description_es, description_en=excluded.description_en, icon_path=excluded.icon_path, sort_order=excluded.sort_order;
