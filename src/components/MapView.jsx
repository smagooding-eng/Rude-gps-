import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// OpenFreeMap: free OpenStreetMap vector tiles, no API key.
const STYLE = {
  light: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

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

export default function MapView({ theme, position, heading, route, traveled, destination, manualStart, mode, follow, onMapClick, onUserGesture }) {
  const box = useRef(null);
  const map = useRef(null);
  const userMarker = useRef(null);
  const destMarker = useRef(null);
  const startMarker = useRef(null);
  const firstFix = useRef(false);
  const data = useRef({ route: null, traveled: null });
  const cbs = useRef({ onMapClick, onUserGesture });
  cbs.current = { onMapClick, onUserGesture };

  // Create map once.
  useEffect(() => {
    const m = new maplibregl.Map({
      container: box.current,
      style: STYLE[theme] || STYLE.light,
      center: [-98.5, 39.8],
      zoom: 3,
      attributionControl: { compact: true },
      pitchWithRotate: true,
    });
    map.current = m;

    const addLayers = () => {
      if (!m.getSource('route')) {
        m.addSource('route', { type: 'geojson', data: lineFC(data.current.route) });
        m.addSource('traveled', { type: 'geojson', data: lineFC(data.current.traveled) });
        m.addLayer({ id: 'route-casing', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#111', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 7, 17, 16] } });
        m.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#ffd400', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 4, 17, 11] } });
        m.addLayer({ id: 'traveled-line', type: 'line', source: 'traveled', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#7a7a7a', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 4, 17, 11] } });
      }
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
    if (shownTheme.current === theme) return;
    shownTheme.current = theme;
    map.current?.setStyle(STYLE[theme] || STYLE.light);
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
    m.fitBounds(b, { padding: { top: 140, bottom: 300, left: 40, right: 40 }, pitch: 0, bearing: 0, duration: 800, maxZoom: 16 });
  }, [route, mode]);

  // Destination marker.
  useEffect(() => {
    destMarker.current?.remove();
    destMarker.current = null;
    if (destination && map.current) {
      destMarker.current = new maplibregl.Marker({ color: '#ff3b5c' }).setLngLat(destination.coords).addTo(map.current);
      if (mode === 'browse') map.current.easeTo({ center: destination.coords, zoom: Math.max(map.current.getZoom(), 14) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination]);

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
        pitch: 55,
        zoom: sp > 22 ? 15 : sp > 11 ? 16 : 17,
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
