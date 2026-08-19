import regionalZipData from './centralTexasZipCentroids.js';

export const SERVICE_AREA_ALL = 'all';
export const SERVICE_AREA_UNDISCLOSED = 'undisclosed';

export const supportedCounties = regionalZipData.counties;
export const serviceAreas = regionalZipData.zipCodes.map(area => ({
  code: area.zipCode,
  label: `${area.zipCode} · ${area.county}`,
  shortName: area.zipCode,
  county: area.county,
  latitude: area.latitude,
  longitude: area.longitude,
  active: area.active
}));

export const serviceAreaCodes = new Set(serviceAreas.map(area => area.code));
export const getServiceArea = value => serviceAreas.find(area => area.code === String(value)) || null;
export const isValidServiceArea = value => value == null
  || value === ''
  || value === SERVICE_AREA_ALL
  || value === SERVICE_AREA_UNDISCLOSED
  || serviceAreaCodes.has(String(value));
