import { serviceAreas } from './serviceAreas';

export const RESOURCE_FINDER_DEFAULT_ZIP = '78701';
export const RESOURCE_FINDER_DEFAULT_CENTER = [-97.7431, 30.2672];
export const RESOURCE_FINDER_DEFAULT_ZOOM = 8.6;
// A simple min/max bounding box of the approved ZIP centroids would center on
// that box's own geometric middle, not on where the ZIPs actually are — Gonzales
// and Guadalupe counties, at the region's southeast edge, have far fewer ZIPs
// than Travis/Williamson (Austin) but still stretch the box's corner out there,
// pulling its center ~50km southeast of the real, population-weighted centroid.
// The initial map view was visibly off-center as a result: the actual coverage
// area rendered noticeably left-and-up of the map's own middle.
// Instead, build a box that's centered ON that real centroid by construction —
// take the farther of each pair of opposite extents (north vs. south, east vs.
// west) as a symmetric half-span. This still contains every approved ZIP (some
// sides just carry a bit more headroom than the nearest ZIP needs) while
// guaranteeing the fitted view centers on where the service area actually is.
// Recomputed from serviceAreas so it can't drift out of sync as ZIPs are added.
const zipCentroidLng = serviceAreas.reduce((sum, area) => sum + area.longitude, 0) / serviceAreas.length;
const zipCentroidLat = serviceAreas.reduce((sum, area) => sum + area.latitude, 0) / serviceAreas.length;
const zipHalfSpanLng = Math.max(...serviceAreas.map(area => Math.abs(area.longitude - zipCentroidLng)));
const zipHalfSpanLat = Math.max(...serviceAreas.map(area => Math.abs(area.latitude - zipCentroidLat)));
export const RESOURCE_FINDER_COVERAGE_BOUNDS = [
  [zipCentroidLng - zipHalfSpanLng, zipCentroidLat - zipHalfSpanLat],
  [zipCentroidLng + zipHalfSpanLng, zipCentroidLat + zipHalfSpanLat]
];
export const RESOURCE_FINDER_SELECTED_ZOOM = 11.5;
export const RESOURCE_FINDER_DISTANCE_RINGS_ENABLED = false;
export const RESOURCE_FINDER_INITIAL_RADIUS_MILES = 15;
export const RESOURCE_FINDER_EXPANDED_RADIUS_MILES = 30;
export const RESOURCE_FINDER_REGIONAL_RADIUS_MILES = 50;
export const RESOURCE_FINDER_MAP_STYLE = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';
