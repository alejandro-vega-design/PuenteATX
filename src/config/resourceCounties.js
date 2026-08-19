export const RESOURCE_COUNTIES = ['Travis', 'Williamson', 'Bastrop', 'Hays'];

export const normalizeCounty = value => String(value || '')
  .toLocaleLowerCase()
  .replace(/\b(county|condado)\b/g, '')
  .trim();

export const isResourceCounty = value => RESOURCE_COUNTIES.some(county => normalizeCounty(county) === normalizeCounty(value));
