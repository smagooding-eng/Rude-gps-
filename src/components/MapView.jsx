import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { styleUrl, styleTransform } from '../lib/mapTheme.js';
import { hazardSvg, HAZARD_STYLE } from '../lib/hazardIcons.js';

const EMPTY = { type: 'FeatureCollection', features: [] };

function lineFC(coords) {
  return coords?.length > 1
    ? { type: 'Feature', geometry: { type: 'LineString', coordinates: coords }, properties: {} }
    : EMPTY;
}

function makeUserEl() {
  const el = document.createElement('div');
  el.className = 'user-marker';
  el.innerHTML = '<div class="user-pulse"></div><svg viewBox="0 0 40 40" width="40" height="40"><path d="M20 4 L32 34 L20 27 L8 34 Z" /></svg>';
  return el;
}

function makeDestEl() {
  const el = document.createElement('div');
  el.className = 'dest-marker';
  el.innerHTML = '<svg viewBox="0 0 36 48" width="36" height="48"><path d="M18 46s14-15.5 14-27a14 14 0 1 0-28 0c0 11.5 14 27 14 27Z"/><path d="M12 12v14M12 13h11l-3 4 3 4H12" class="flag"/></svg>';
  return el;
}

function makeHazardEl(h) {
  const el = document.createElement('div');
  el.className = 'hazard-marker';
  el.style.setProperty('--hz', (HAZARD_STYLE[h.kind] || HAZARD_STYLE.hazard).color);
  el.innerHTML = hazardSvg(h.kind, 18);
  el.title = (HAZARD_STYLE[h.kind] || HAZARD_STYLE.hazard).label;
  return el;
}

function applyStyle(m, theme) {
  m.setStyle(styleUrl(theme), { transformStyle: styleTransform(theme), diff: false });
}

export default function MapView({ theme, position, heading, route, traveled, destination, manualStart, hazards, mode, follow, onMapClick, onUserGesture }) {
  const box = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const destMarker = useRef(null);
  const startMarker = useRef(null);
  const hazardMarkers = useRef([]);
  const firstFix = useRef(false);
  const data = useRef({ route: null, traveled: null });
  const cbs = useRef({ onMapClick, onUserGesture });
  cbs.current = { onMapClick, onUserGesture };

  // Create map once.
  useEffect(() => {
    const m = new maplibregl.Map({
      container: box.current,
      center: [-98.5, 39.8],
      zoom: 3,
      attributionControl: { compact: true },
      pitchWithRotate: true,
      maxPitch: 70,
    });
    map.current = m;
    applyStyle(m, theme);

    const addLayers = () => {
      if (m.getSource('route')) return;
      m.addSource('route', { type: 'geojson', data: lineFC(data.current.route), lineMetrics: true });
      m.addSource('traveled', { type: 'geojson', data: lineFC(data.current.traveled) });
      const width = (a, b) => ['interpolate', ['exponential', 1.5], ['zoom'], 10, a, 18, b];
      const layout = { 'line-join': 'round', 'line-cap': 'round' };
      m.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout, paint: { 'line-color': '#ffd400', 'line-width': width(14, 40), 'line-opacity': 0.22, 'line-blur': 8 } });
      m.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout, paint: { 'line-color': '#141414', 'line-width': width(7, 20) } });
      m.addLayer({
        id: 'route-line', type: 'line', source: 'route', layout,
        paint: {
          'line-width': width(4, 13),
          'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, '#ffe55c', 0.6, '#ffd400', 1, '#ff9f1c'],
        },
      });
      m.addLayer({ id: 'traveled-line', type: 'line', source: 'traveled', layout, paint: { 'line-color': '#6d7079', 'line-width': width(4, 13) } });
    };
    m.on('style.load', addLayers);
    m.on('click', (e) => cbs.current.onMapClick?.([e.lngLat.lng, e.lngLat.lat]));
    const gesture = (e) => {
      if (e.originalEvent) cbs.current.onUserGesture?.();
    };
    m.on('dragstart', gesture);
    m.on('rotatestart', gesture);
    m.on('pitchstart', gesture);
    m.on('zoomstart', gesture);
    return () => m.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Theme switch (skip the initial value, the map was created with it).
  const shownTheme = useRef(theme);
  useEffect(() => {
    if (shownTheme.current === theme || !map.current) return;
    shownTheme.current = theme;
    applyStyle(map.current, theme);
  }, [theme]);

  // Route + traveled lines.
  useEffect(() => {
    data.current = { route: route?.coords || null, traveled };
    const m = map.current;
    m?.getSource('route')?.setData(lineFC(data.current.route));
    m?.getSource('traveled')?.setData(lineFC(traveled));
  }, [route, traveled]);

  // Fit the whole route when previewing.
  useEffect(() => {
    const m = map.current;
    if (!m || !route || mode !== 'preview') return;
    const b = new maplibregl.LngLatBounds(route.coords[0], route.coords[0]);
    route.coords.forEach((c) => b.extend(c));
    m.fitBounds(b, { padding: { top: 140, bottom: 320, left: 40, right: 40 }, pitch: 0, bearing: 0, duration: 800, maxZoom: 16 });
  }, [route, mode]);

  // Destination marker.
  useEffect(() => {
    destMarker.current?.remove();
    destMarker.current = null;
    if (destination && map.current) {
      destMarker.current = new maplibregl.Marker({ element: makeDestEl(), anchor: 'bottom' }).setLngLat(destination.coords).addTo(map.current);
      if (mode === 'browse') map.current.easeTo({ center: destination.coords, zoom: Math.max(map.current.getZoom(), 14) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination]);

  // Hazard markers.
  useEffect(() => {
    hazardMarkers.current.forEach((mk) => mk.remove());
    hazardMarkers.current = [];
    if (!map.current || !hazards?.length) return;
    hazardMarkers.current = hazards.slice(0, 150).map((h) =>
      new maplibregl.Marker({ element: makeHazardEl(h) }).setLngLat(h.coords).addTo(map.current),
    );
  }, [hazards]);

  // Manual start marker (no GPS).
  useEffect(() => {
    startMarker.current?.remove();
    startMarker.current = null;
    if (manualStart && map.current) {
      const el = document.createElement('div');
      el.className = 'start-marker';
      startMarker.current = new maplibregl.Marker({ element: el }).setLngLat(manualStart).addTo(map.current);
    }
  }, [manualStart]);

  // User marker + camera follow.
  useEffect(() => {
    const m = map.current;
    if (!m || !position) return;
    if (!userMarker.current) {
      userMarker.current = new maplibregl.Marker({ element: makeUserEl(), rotationAlignment: 'map', pitchAlignment: 'map' })
        .setLngLat(position.coords)
        .addTo(m);
    }
    userMarker.current.setLngLat(position.coords).setRotation(heading || 0);
    userMarker.current.getElement().classList.toggle('no-heading', heading == null);

    if (!firstFix.current && mode === 'browse') {
      firstFix.current = true;
      m.jumpTo({ center: position.coords, zoom: 15 });
      return;
    }
    if (!follow) return;
    if (mode === 'nav') {
      const sp = position.speed || 0;
      m.easeTo({
        center: position.coords,
        bearing: heading ?? m.getBearing(),
        pitch: 60,
        zoom: sp > 22 ? 15.2 : sp > 11 ? 16.2 : 17,
        padding: { top: Math.round(window.innerHeight * 0.45), bottom: 0, left: 0, right: 0 },
        duration: 950,
        easing: (t) => t,
      });
    } else if (mode === 'browse') {
      m.easeTo({ center: position.coords, padding: { top: 0, bottom: 0, left: 0, right: 0 }, pitch: 0, bearing: 0, duration: 600 });
    }
  }, [position, heading, follow, mode]);

  // Leaving nav: flatten the camera.
  useEffect(() => {
    if (mode === 'browse' && map.current) {
      map.current.easeTo({ pitch: 0, bearing: 0, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
    }
  }, [mode]);

  return <div ref={box} className="map" />;
}
