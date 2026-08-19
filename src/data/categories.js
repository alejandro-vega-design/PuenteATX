/** @type {import('./resourceTypes').Category[]} */
export const resourceCategories = [
  { id: '10000000-0000-4000-8000-000000000001', slug: 'comida', label_es: 'Comida', label_en: 'Food', description_es: 'Alimentos y despensas.', description_en: 'Food and pantry support.', icon_path: '/assets/icons/food.svg', sort_order: 1, is_active: true },
  { id: '10000000-0000-4000-8000-000000000002', slug: 'vivienda', label_es: 'Vivienda', label_en: 'Housing', description_es: 'Renta y vivienda estable.', description_en: 'Rent and stable housing.', icon_path: '/assets/icons/home.svg', sort_order: 2, is_active: true },
  { id: '10000000-0000-4000-8000-000000000003', slug: 'salud', label_es: 'Salud', label_en: 'Health', description_es: 'Clínicas y bienestar.', description_en: 'Clinics and wellness.', icon_path: '/assets/icons/health.svg', sort_order: 3, is_active: true },
  { id: '10000000-0000-4000-8000-000000000004', slug: 'transporte', label_es: 'Transporte', label_en: 'Transportation', description_es: 'Opciones para trasladarse.', description_en: 'Transportation options.', icon_path: '/assets/icons/bus.svg', sort_order: 4, is_active: true },
  { id: '10000000-0000-4000-8000-000000000005', slug: 'recursos-financieros', label_es: 'Recursos financieros', label_en: 'Financial resources', description_es: 'Apoyo económico.', description_en: 'Financial support.', icon_path: '/assets/icons/money.svg', sort_order: 5, is_active: true },
  { id: '10000000-0000-4000-8000-000000000006', slug: 'educacion', label_es: 'Educación', label_en: 'Education', description_es: 'Escuela y aprendizaje.', description_en: 'School and learning.', icon_path: '/assets/icons/book.svg', sort_order: 6, is_active: true },
  { id: '10000000-0000-4000-8000-000000000007', slug: 'ayuda-legal', label_es: 'Ayuda legal', label_en: 'Legal help', description_es: 'Orientación legal.', description_en: 'Legal guidance.', icon_path: '/assets/icons/legal.svg', sort_order: 7, is_active: true },
  { id: '10000000-0000-4000-8000-000000000008', slug: 'otros-recursos', label_es: 'Otros recursos', label_en: 'Other resources', description_es: 'Otros apoyos comunitarios.', description_en: 'Other community support.', icon_path: '/assets/icons/shirt.svg', sort_order: 8, is_active: true }
];

export const getCategoryById = id => resourceCategories.find(category => category.id === id);
export const getCategoryBySlug = slug => resourceCategories.find(category => category.slug === slug);
