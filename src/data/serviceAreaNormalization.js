import { getServiceArea } from '../config/serviceAreas.js';

const COUNTY_ORDER = ['Travis', 'Williamson', 'Bastrop', 'Hays', 'Caldwell', 'Blanco', 'Burnet', 'Bell', 'Hidalgo'];

const CITY_COUNTIES = new Map([
  ['austin', ['Travis']],
  ['pflugerville', ['Travis']],
  ['manor', ['Travis']],
  ['georgetown', ['Williamson']],
  ['round rock', ['Williamson']],
  ['cedar park', ['Williamson']],
  ['leander', ['Williamson']],
  ['liberty hill', ['Williamson']],
  ['taylor', ['Williamson']],
  ['hutto', ['Williamson']],
  ['granger', ['Williamson']],
  ['florence', ['Williamson']],
  ['jarrell', ['Williamson']],
  ['bartlett', ['Williamson']],
  ['jonah', ['Williamson']],
  ['schwertner', ['Williamson']],
  ['walburg', ['Williamson']],
  ['weir', ['Williamson']],
  ['andice', ['Williamson']],
  ['bastrop', ['Bastrop']],
  ['elgin', ['Bastrop']],
  ['smithville', ['Bastrop']],
  ['san marcos', ['Hays']],
  ['kyle', ['Hays']],
  ['buda', ['Hays']],
  ['dripping springs', ['Hays']],
  ['wimberley', ['Hays']],
  ['lockhart', ['Caldwell']],
  ['luling', ['Caldwell']],
  ['blanco', ['Blanco']],
  ['burnet', ['Burnet']],
  ['marble falls', ['Burnet']],
  ['mercedes', ['Hidalgo']]
]);

const fold = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase();

const countyPattern = county => new RegExp(`\\b${county.toLocaleLowerCase()}(?:\\s+(?:county|counties))?\\b`, 'i');
const isStatewide = value => /\b(todo texas|todos los condados de texas|all texas|all texas counties|statewide|state-wide)\b/i.test(fold(value));

const addCountyMatches = (source, counties) => {
  const folded = fold(source);
  for (const county of COUNTY_ORDER) {
    if (countyPattern(county).test(folded)) counties.add(county);
  }
};

const addCityMatches = (source, counties) => {
  const folded = fold(source);
  for (const [city, cityCounties] of CITY_COUNTIES) {
    if (new RegExp(`\\b${city.replace(/ /g, '\\s+')}\\b`, 'i').test(folded)) cityCounties.forEach(county => counties.add(county));
  }
};

export function normalizeServiceArea({ serviceAreaEs, serviceAreaEn, city, county, postalCode }) {
  const suppliedArea = `${serviceAreaEs || ''} ${serviceAreaEn || ''}`.trim();
  if (isStatewide(suppliedArea)) return { es: 'Todos los condados de Texas', en: 'All Texas counties', counties: ['statewide'] };

  const counties = new Set();
  addCountyMatches(suppliedArea, counties);
  addCityMatches(suppliedArea, counties);

  if (!counties.size) addCountyMatches(county, counties);
  if (!counties.size) addCityMatches(city, counties);
  if (!counties.size) {
    const zipArea = getServiceArea(postalCode);
    if (zipArea?.county) counties.add(zipArea.county);
  }

  const ordered = COUNTY_ORDER.filter(item => counties.has(item));
  if (!ordered.length) return { es: '', en: '', counties: [] };
  return {
    es: ordered.map(item => `Condado de ${item}`).join(', '),
    en: ordered.map(item => `${item} County`).join(', '),
    counties: ordered
  };
}

