import React, { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { RESOURCE_FINDER_COVERAGE_BOUNDS, RESOURCE_FINDER_DEFAULT_CENTER, RESOURCE_FINDER_DEFAULT_ZOOM, RESOURCE_FINDER_DISTANCE_RINGS_ENABLED, RESOURCE_FINDER_MAP_STYLE } from '../../config/resourceFinder';
import { distanceRingsGeojson } from '../../utils/geo';

const ZIP_SOURCE_ID = 'finder-zip-boundaries';
const ZIP_FILL_LAYER_ID = 'finder-zip-boundary-fill';
const ZIP_LINE_LAYER_ID = 'finder-zip-boundary-line';
const RINGS_SOURCE_ID = 'finder-distance-rings';
const RINGS_LINE_LAYER_ID = 'finder-distance-rings-line';
const RINGS_LABEL_LAYER_ID = 'finder-distance-rings-label';
const DISPLAY_RING_MILES = [5, 10, 15];
const DESKTOP_MAP_QUERY = '(min-width: 768px)';
const DESKTOP_MAP_PADDING = { top: 64, right: 48, bottom: 64, left: 500 };
const MOBILE_MAP_PADDING = { top: 48, right: 32, bottom: 48, left: 32 };
const allCoordinates = coordinates => Array.isArray(coordinates?.[0]?.[0]) ? coordinates.flatMap(allCoordinates) : coordinates;
const isDesktopMap = () => window.matchMedia(DESKTOP_MAP_QUERY).matches;
const getMapPadding = () => isDesktopMap() ? DESKTOP_MAP_PADDING : MOBILE_MAP_PADDING;
const getVisibleMapOffset = () => isDesktopMap() ? [226, 0] : [0, 0];
const boundsFromPoints = points => points.reduce((bounds, point) => bounds.extend(point), new maplibregl.LngLatBounds(points[0], points[0]));

export default function ResourceMap({ t, zip, zipCenter, resources, categories, selectedId, hoveredId, fitResults = true, onSelect, onHover, onSearchArea }) {
  const containerRef = useRef(null); const mapRef = useRef(null); const markersRef = useRef(new Map()); const zipMarkerRef = useRef(null); const userMoveRef = useRef(false);
  const [loaded, setLoaded] = useState(false); const [failed, setFailed] = useState(false); const [zipGeojson, setZipGeojson] = useState(null); const [showRings, setShowRings] = useState(false); const [pendingBounds, setPendingBounds] = useState(null);
  const selectedZipFeature = useMemo(() => zipGeojson?.features?.find(feature => feature.properties?.zip_code === zip), [zipGeojson, zip]);
  const selectedZipCoordinates = useMemo(() => selectedZipFeature ? allCoordinates(selectedZipFeature.geometry.coordinates) : [], [selectedZipFeature]);
  const ringGeojson = useMemo(() => RESOURCE_FINDER_DISTANCE_RINGS_ENABLED && showRings && zipCenter ? distanceRingsGeojson(zipCenter, DISPLAY_RING_MILES) : { type: 'FeatureCollection', features: [] }, [showRings, zipCenter]);
  useEffect(() => { setPendingBounds(null); }, [zip]);
  useEffect(() => {
    let active = true;
    fetch('/maps/central-texas-zip-codes.geojson').then(response => {
      if (!response.ok) throw new Error('ZIP geography unavailable');
      return response.json();
    }).then(data => { if (active) setZipGeojson(data); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    try {
      const map = new maplibregl.Map({ container: containerRef.current, style: RESOURCE_FINDER_MAP_STYLE, center: RESOURCE_FINDER_DEFAULT_CENTER, zoom: RESOURCE_FINDER_DEFAULT_ZOOM, attributionControl: true });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.once('style.load', () => setLoaded(true));
      map.on('error', () => { if (!map.isStyleLoaded()) setFailed(true); });
      map.on('movestart', event => { if (event.originalEvent) userMoveRef.current = true; });
      map.on('moveend', () => {
        if (!userMoveRef.current) return;
        userMoveRef.current = false;
        const bounds = map.getBounds();
        setPendingBounds({ west: bounds.getWest(), south: bounds.getSouth(), east: bounds.getEast(), north: bounds.getNorth() });
      });
      mapRef.current = map;
      return () => { map.remove(); mapRef.current = null; };
    } catch { setFailed(true); return undefined; }
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !zipGeojson) return;
    const source = map.getSource(ZIP_SOURCE_ID);
    if (source) source.setData(zipGeojson);
    else {
      map.addSource(ZIP_SOURCE_ID, { type: 'geojson', data: zipGeojson });
      const firstSymbolLayer = map.getStyle().layers?.find(layer => layer.type === 'symbol')?.id;
      map.addLayer({ id: ZIP_FILL_LAYER_ID, type: 'fill', source: ZIP_SOURCE_ID, filter: ['==', ['get', 'zip_code'], zip || ''], paint: { 'fill-color': '#f0d2c3', 'fill-opacity': 0.48 } }, firstSymbolLayer);
      map.addLayer({ id: ZIP_LINE_LAYER_ID, type: 'line', source: ZIP_SOURCE_ID, filter: ['==', ['get', 'zip_code'], zip || ''], paint: { 'line-color': '#df7448', 'line-width': 1.5, 'line-opacity': 0.9 } }, firstSymbolLayer);
    }
    const filter = ['==', ['get', 'zip_code'], zip || ''];
    if (map.getLayer(ZIP_FILL_LAYER_ID)) map.setFilter(ZIP_FILL_LAYER_ID, filter);
    if (map.getLayer(ZIP_LINE_LAYER_ID)) map.setFilter(ZIP_LINE_LAYER_ID, filter);
  }, [loaded, zipGeojson, zip]);
  useEffect(() => {
    const map = mapRef.current;
    if (!RESOURCE_FINDER_DISTANCE_RINGS_ENABLED || !map || !loaded) return;
    const source = map.getSource(RINGS_SOURCE_ID);
    if (source) source.setData(ringGeojson);
    else map.addSource(RINGS_SOURCE_ID, { type: 'geojson', data: ringGeojson });
    if (!map.getLayer(RINGS_LINE_LAYER_ID)) {
      map.addLayer({ id: RINGS_LINE_LAYER_ID, type: 'line', source: RINGS_SOURCE_ID, filter: ['==', ['get', 'featureType'], 'ring'], paint: { 'line-color': '#df7448', 'line-width': 2.5, 'line-opacity': 0.95, 'line-dasharray': [3, 2] } });
    }
    if (!map.getLayer(RINGS_LABEL_LAYER_ID)) map.addLayer({ id: RINGS_LABEL_LAYER_ID, type: 'symbol', source: RINGS_SOURCE_ID, filter: ['==', ['get', 'featureType'], 'label'], layout: { 'text-field': ['get', 'label'], 'text-size': 12, 'text-offset': [0, -1], 'text-allow-overlap': true }, paint: { 'text-color': '#5c351d', 'text-halo-color': '#ffffff', 'text-halo-width': 2 } });
  }, [loaded, ringGeojson]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || !fitResults) return;
    const resourcePoints = resources.map(resource => [Number(resource.longitude), Number(resource.latitude)]);
    // Search results control the initial camera. Distance rings are a visual
    // overlay only and must never force the map to zoom away from the results.
    const points = [...resourcePoints, ...(zipCenter ? [[zipCenter.longitude, zipCenter.latitude]] : []), ...selectedZipCoordinates];
    if (points.length > 1) {
      map.fitBounds(boundsFromPoints(points), { padding: getMapPadding(), maxZoom: 12, duration: 700 });
    } else if (points.length === 1) map.easeTo({ center: points[0], offset: getVisibleMapOffset(), zoom: 11, duration: 700 });
  }, [loaded, resources, zipCenter, selectedZipCoordinates, fitResults]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded || zip) return;
    map.fitBounds(RESOURCE_FINDER_COVERAGE_BOUNDS, { padding: getMapPadding(), maxZoom: 10, duration: 600 });
  }, [loaded, zip]);
  useEffect(() => {
    const map = mapRef.current; if (!map || !loaded) return;
    markersRef.current.forEach(marker => marker.remove()); markersRef.current.clear(); zipMarkerRef.current?.remove();
    if (zipCenter) {
      const zipElement = document.createElement('div'); zipElement.className = 'zip-location-marker'; zipElement.setAttribute('role', 'img'); zipElement.setAttribute('aria-label', t.zipMarker(zip)); zipElement.innerHTML = '<span></span><i></i>';
      zipMarkerRef.current = new maplibregl.Marker({ element: zipElement, anchor: 'center' }).setLngLat([zipCenter.longitude, zipCenter.latitude]).addTo(map);
    }
    resources.forEach(resource => {
      const category = categories.find(item => item.id === resource.primary_category_id); const element = document.createElement('button'); element.type = 'button'; element.className = 'resource-map-marker'; element.dataset.resourceId = resource.id; element.setAttribute('aria-label', resource.title_es || resource.title_en);
      if (category) { const icon = document.createElement('img'); icon.src = category.icon_path; icon.alt = ''; element.appendChild(icon); } else element.appendChild(document.createElement('span'));
      element.addEventListener('click', () => onSelect(resource.id)); element.addEventListener('mouseenter', () => onHover(resource.id)); element.addEventListener('mouseleave', () => onHover(null));
      const marker = new maplibregl.Marker({ element, anchor: 'center' }).setLngLat([Number(resource.longitude), Number(resource.latitude)]).addTo(map); markersRef.current.set(resource.id, marker);
    });
  }, [loaded, resources, categories, zipCenter, zip, t, onSelect, onHover, selectedZipCoordinates]);
  useEffect(() => { markersRef.current.forEach((marker, id) => { const element = marker.getElement(); const selected = id === selectedId; const hovered = id === hoveredId; element.classList.toggle('is-selected', selected); element.classList.toggle('is-hovered', hovered); element.style.zIndex = selected ? '30' : hovered ? '20' : '1'; element.setAttribute('aria-pressed', selected ? 'true' : 'false'); }); const selected = markersRef.current.get(selectedId); if (selected && mapRef.current) mapRef.current.easeTo({ center: selected.getLngLat(), offset: getVisibleMapOffset(), duration: 500 }); }, [selectedId, hoveredId]);
  return <section className="finder-map" aria-label={t.map}><div ref={containerRef} className="finder-map-canvas"/>
    {pendingBounds && <button className="secondary-button secondary-cta finder-search-area-button no-print" type="button" onClick={() => { onSearchArea(pendingBounds); setPendingBounds(null); }}>{t.searchThisArea}</button>}
    <div className="finder-map-actions no-print">
      {RESOURCE_FINDER_DISTANCE_RINGS_ENABLED && <button className={`finder-map-control${showRings ? ' is-active' : ''}`} type="button" aria-pressed={showRings} aria-label={t.distanceRings} title={t.distanceRings} onClick={() => setShowRings(value => !value)}><span className="material-symbols-rounded" aria-hidden="true">radar</span></button>}
    </div>
    {!loaded && !failed && <div className="finder-map-status">{t.mapLoading}</div>}{failed && <div className="finder-map-status"><p>{t.mapError}</p></div>}
  </section>;
}
