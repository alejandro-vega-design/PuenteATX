export const RESOURCE_FINDER_DEFAULT_ZIP = '78701';
export const RESOURCE_FINDER_DEFAULT_CENTER = [-97.7431, 30.2672];
export const RESOURCE_FINDER_DEFAULT_ZOOM = 8.6;
// Official Census TIGERweb extent for Travis, Williamson, Bastrop, and Hays
// counties. This keeps the regional camera tied to the actual service area
// instead of ZIP polygons that can cross county boundaries.
export const RESOURCE_FINDER_COVERAGE_BOUNDS = [[-98.2976, 29.75244], [-97.02446, 30.90441]];
export const RESOURCE_FINDER_SELECTED_ZOOM = 11.5;
export const RESOURCE_FINDER_DISTANCE_RINGS_ENABLED = false;
export const RESOURCE_FINDER_INITIAL_RADIUS_MILES = 15;
export const RESOURCE_FINDER_EXPANDED_RADIUS_MILES = 30;
export const RESOURCE_FINDER_REGIONAL_RADIUS_MILES = 50;
export const RESOURCE_FINDER_MAP_STYLE = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';
