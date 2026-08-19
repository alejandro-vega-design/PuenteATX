const EARTH_RADIUS_MILES = 3958.7613;
const radians = degrees => degrees * (Math.PI / 180);
const degrees = radiansValue => radiansValue * (180 / Math.PI);

export const hasCoordinates = value => value?.latitude !== null
  && value?.latitude !== undefined
  && value?.latitude !== ''
  && value?.longitude !== null
  && value?.longitude !== undefined
  && value?.longitude !== ''
  && Number.isFinite(Number(value.latitude))
  && Number.isFinite(Number(value.longitude))
  && Math.abs(Number(value.latitude)) <= 90
  && Math.abs(Number(value.longitude)) <= 180;

export function distanceMiles(origin, destination) {
  if (!hasCoordinates(origin) || !hasCoordinates(destination)) return null;
  const lat1 = radians(Number(origin.latitude));
  const lat2 = radians(Number(destination.latitude));
  const deltaLat = lat2 - lat1;
  const deltaLon = radians(Number(destination.longitude) - Number(origin.longitude));
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const formatMiles = (miles, lang = 'es') => {
  if (!Number.isFinite(miles)) return '';
  const value = miles < 10 ? miles.toFixed(1) : Math.round(miles).toString();
  return `${value} ${lang === 'es' ? 'mi' : 'mi'}`;
};

export function sortResourcesByDistance(resources, origin) {
  return resources
    .filter(hasCoordinates)
    .map(resource => ({ ...resource, distance_miles: distanceMiles(origin, resource) }))
    .sort((a, b) => a.distance_miles - b.distance_miles);
}

export function destinationPoint(origin, distance, bearing) {
  const angularDistance = distance / EARTH_RADIUS_MILES;
  const bearingRadians = radians(bearing);
  const latitude = radians(Number(origin.latitude));
  const longitude = radians(Number(origin.longitude));
  const nextLatitude = Math.asin(Math.sin(latitude) * Math.cos(angularDistance)
    + Math.cos(latitude) * Math.sin(angularDistance) * Math.cos(bearingRadians));
  const nextLongitude = longitude + Math.atan2(
    Math.sin(bearingRadians) * Math.sin(angularDistance) * Math.cos(latitude),
    Math.cos(angularDistance) - Math.sin(latitude) * Math.sin(nextLatitude)
  );
  return [degrees(nextLongitude), degrees(nextLatitude)];
}

export function distanceRingsGeojson(origin, radii = [10, 20, 30], steps = 96) {
  if (!hasCoordinates(origin)) return { type: 'FeatureCollection', features: [] };
  const ringFeatures = radii.map(radius => {
    const coordinates = Array.from(
      { length: steps + 1 },
      (_, index) => destinationPoint(origin, radius, index / steps * 360)
    );
    return {
      type: 'Feature',
      properties: { radius, label: `${radius} mi`, featureType: 'ring' },
      geometry: { type: 'LineString', coordinates }
    };
  });
  const labelFeatures = radii.map(radius => ({
    type: 'Feature',
    properties: { radius, label: `${radius} mi`, featureType: 'label' },
    geometry: { type: 'Point', coordinates: destinationPoint(origin, radius, 0) }
  }));
  return {
    type: 'FeatureCollection',
    features: [...ringFeatures, ...labelFeatures]
  };
}
