// Hazard sources along the route:
//  - TomTom Traffic Incidents (crashes, closures, road work, hazards, jams). Needs a free key.
//  - OpenStreetMap speed / red-light cameras via Overpass. No key.
import { bearing, distance, nearestOnRoute } from './geo.js';

const TOMTOM = 'https://api.tomtom.com/traffic/services/5/incidentDetails';
const OVERPASS = 'https://overpass-api.de/api/interpreter';

const TT_KIND = { 0: 'hazard', 1: 'crash', 2: 'weather', 3: 'hazard', 4: 'weather', 5: 'weather', 6: 'jam', 7: 'lane', 8: 'closure', 9: 'roadwork', 10: 'weather', 11: 'weather', 14: 'vehicle' };

// Split the route into bounding boxes small enough for the APIs (TomTom caps area).
export function routeBoxes(coords, cum, { chunk = 40000, pad = 0.01, max = 6 } = {}) {
  const boxes = [];
  let start = 0;
  for (let i = 1; i < coords.length && boxes.length < max; i++) {
    if (cum[i] - cum[start] >= chunk || i === coords.length - 1) {
      let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
      for (let j = start; j <= i; j++) {
        const [x, y] = coords[j];
        w = Math.min(w, x); e = Math.max(e, x); s = Math.min(s, y); n = Math.max(n, y);
      }
      boxes.push([w - pad, s - pad, e + pad, n + pad]);
      start = i;
    }
  }
  return boxes;
}

function angleDiff(a, b) {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function parseTomTom(json) {
  return (json.incidents || []).map((f) => {
    const p = f.properties || {};
    const g = f.geometry || {};
    const pts = g.type === 'Point' ? [g.coordinates] : g.coordinates || [];
    const kind = TT_KIND[p.iconCategory] || 'hazard';
    return {
      id: `tt-${p.id || pts[0]?.join()}`,
      kind,
      source: 'TomTom',
      coords: pts[0],
      heading: pts.length > 1 ? bearing(pts[0], pts[1]) : null,
      description: p.events?.[0]?.description || '',
      road: (p.roadNumbers || [])[0] || p.from || '',
      delay: p.delay || 0,
      magnitude: p.magnitudeOfDelay ?? 0,
    };
  }).filter((h) => h.coords && !(h.kind === 'jam' && h.magnitude < 2));
}

export async function fetchTomTom(boxes, key, signal) {
  const fields = '{incidents{type,geometry{type,coordinates},properties{id,iconCategory,magnitudeOfDelay,events{description},from,roadNumbers,delay}}}';
  const all = [];
  for (const b of boxes) {
    const params = new URLSearchParams({ key, bbox: b.map((v) => v.toFixed(5)).join(','), fields, language: 'en-US', timeValidityFilter: 'present' });
    const res = await fetch(`${TOMTOM}?${params}`, { signal });
    if (res.status === 403 || res.status === 401) throw new Error('TomTom key was rejected. Check it in Settings.');
    if (!res.ok) throw new Error(`TomTom error (${res.status})`);
    all.push(...parseTomTom(await res.json()));
  }
  return all;
}

export function parseOverpass(json) {
  return (json.elements || []).map((el) => {
    const t = el.tags || {};
    const red = t.enforcement === 'traffic_signals' || t['camera:type'] === 'red_light' || t.highway === 'traffic_signals';
    return {
      id: `osm-${el.id}`,
      kind: red ? 'redlight' : 'camera',
      source: 'OpenStreetMap',
      coords: [el.lon, el.lat],
      heading: null,
      description: t.maxspeed ? `limit ${t.maxspeed}` : '',
      maxspeed: t.maxspeed || '',
    };
  }).filter((h) => Number.isFinite(h.coords[0]));
}

export async function fetchCameras(boxes, signal) {
  const parts = boxes.map(([w, s, e, n]) => {
    const bb = `(${s.toFixed(4)},${w.toFixed(4)},${n.toFixed(4)},${e.toFixed(4)})`;
    return `node["highway"="speed_camera"]${bb};node["enforcement"="maxspeed"]${bb};node["enforcement"="traffic_signals"]${bb};`;
  });
  const q = `[out:json][timeout:20];(${parts.join('')});out;`;
  const res = await fetch(OVERPASS, { method: 'POST', body: new URLSearchParams({ data: q }), signal });
  if (!res.ok) throw new Error(`Camera lookup error (${res.status})`);
  return parseOverpass(await res.json());
}

// Keep only hazards on the route (and in our direction), with their distance along it.
export function onRoute(hazards, route) {
  const seen = new Set();
  const out = [];
  for (const h of hazards) {
    if (seen.has(h.id)) continue;
    const near = nearestOnRoute(h.coords, route.coords, route.cum);
    const maxOff = h.source === 'TomTom' ? 70 : 45;
    if (near.dist > maxOff) continue;
    if (h.heading != null && angleDiff(h.heading, near.bearing) > 100) continue;
    // De-dupe cameras mapped twice a few meters apart.
    if (out.some((o) => o.kind === h.kind && Math.abs(o.along - near.along) < 60 && distance(o.coords, h.coords) < 60)) continue;
    seen.add(h.id);
    out.push({ ...h, along: near.along });
  }
  return out.sort((a, b) => a.along - b.along);
}

export async function loadHazards(route, { tomtomKey, cameras }, signal) {
  const boxes = routeBoxes(route.coords, route.cum);
  const jobs = [];
  if (tomtomKey) jobs.push(fetchTomTom(boxes, tomtomKey, signal));
  if (cameras) jobs.push(fetchCameras(boxes, signal));
  const results = await Promise.allSettled(jobs);
  const list = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []));
  const errors = results.filter((r) => r.status === 'rejected' && r.reason?.name !== 'AbortError').map((r) => r.reason.message);
  return { hazards: onRoute(list, route), errors };
}
