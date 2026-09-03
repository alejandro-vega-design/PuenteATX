import { supportedCounties } from './serviceAreas.js';

export const RESOURCE_COUNTIES = supportedCounties;

export const normalizeCounty = value => String(value || '')
  .toLocaleLowerCase()
  .replace(/\b(county|condado)\b/g, '')
  .trim();

export const isResourceCounty = value => RESOURCE_COUNTIES.some(county => normalizeCounty(county) === normalizeCounty(value));
