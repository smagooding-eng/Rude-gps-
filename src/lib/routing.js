import { cumulative, distance } from './geo.js';

// Public OSRM demo server. Fine for a prototype; for launch, self-host OSRM
// or switch to OpenRouteService / Valhalla (see README).
const OSRM = 'https://router.project-osrm.org/route/v1/driving';

export async function fetchRoute(from, to, signal) {
  const url = `${OSRM}/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson&steps=true&annotations=maxspeed`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Routing service error (${res.status})`);
  return parseOsrm(await res.json());
}

export function parseOsrm(data) {
  if (data.code !== 'Ok' || !data.routes?.length) throw new Error('No drivable route found');
  const r = data.routes[0];
  const coords = r.geometry.coordinates;
  const cum = cumulative(coords);
  const steps = [];
  let from = 0;
  for (const leg of r.legs) {
    for (const s of leg.steps) {
      const loc = s.maneuver.location;
      let best = from;
      let bestD = Infinity;
      for (let i = from; i < coords.length; i++) {
        const d = distance(loc, coords[i]);
        if (d < bestD) {
          bestD = d;
          best = i;
          if (d < 0.5) break;
        }
      }
      from = best;
      steps.push({
        type: s.maneuver.type,
        modifier: s.maneuver.modifier,
        exit: s.maneuver.exit,
        bearingAfter: s.maneuver.bearing_after,
        name: s.name || '',
        ref: s.ref || '',
        destinations: s.destinations || '',
        distance: s.distance,
        along: cum[best],
        location: loc,
      });
    }
  }
  // Posted speed limits per geometry segment (m/s), null where unknown.
  let maxspeed = null;
  const ann = r.legs.flatMap((l) => l.annotation?.maxspeed || []);
  if (ann.length === coords.length - 1) {
    maxspeed = ann.map((m) => {
      if (!m || m.unknown || m.none || !Number.isFinite(m.speed)) return null;
      return m.unit === 'mph' ? m.speed * 0.44704 : m.speed / 3.6;
    });
    if (!maxspeed.some((v) => v != null)) maxspeed = null;
  }
  return { coords, cum, distance: r.distance, duration: r.duration, steps, maxspeed };
}
