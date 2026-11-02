// Geometry helpers. Coordinates are [lon, lat] everywhere (GeoJSON order).

const R = 6371008.8;
const toRad = (d) => (d * Math.PI) / 180;
const toDeg = (r) => (r * 180) / Math.PI;

export function distance(a, b) {
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function bearing(a, b) {
  const p1 = toRad(a[1]);
  const p2 = toRad(b[1]);
  const dl = toRad(b[0] - a[0]);
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function cumulative(coords) {
  const out = [0];
  for (let i = 1; i < coords.length; i++) out.push(out[i - 1] + distance(coords[i - 1], coords[i]));
  return out;
}

// Move a point `meters` in direction `deg`.
export function offset(p, deg, meters) {
  const d = meters / R;
  const th = toRad(deg);
  const p1 = toRad(p[1]);
  const l1 = toRad(p[0]);
  const p2 = Math.asin(Math.sin(p1) * Math.cos(d) + Math.cos(p1) * Math.sin(d) * Math.cos(th));
  const l2 = l1 + Math.atan2(Math.sin(th) * Math.sin(d) * Math.cos(p1), Math.cos(d) - Math.sin(p1) * Math.sin(p2));
  return [toDeg(l2), toDeg(p2)];
}

// Closest point on the route polyline to p.
export function nearestOnRoute(p, coords, cum) {
  const kx = Math.cos(toRad(p[1])) * 111320;
  const ky = 110574;
  let best = { index: 0, t: 0, dist: Infinity };
  for (let i = 0; i < coords.length - 1; i++) {
    const ax = (coords[i][0] - p[0]) * kx;
    const ay = (coords[i][1] - p[1]) * ky;
    const bx = (coords[i + 1][0] - p[0]) * kx;
    const by = (coords[i + 1][1] - p[1]) * ky;
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let t = len2 ? -(ax * dx + ay * dy) / len2 : 0;
    t = Math.max(0, Math.min(1, t));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    const dist = Math.hypot(cx, cy);
    if (dist < best.dist) best = { index: i, t, dist };
  }
  if (coords.length === 1) return { index: 0, t: 0, dist: distance(p, coords[0]), along: 0, bearing: 0 };
  const i = best.index;
  return {
    ...best,
    along: cum[i] + best.t * (cum[i + 1] - cum[i]),
    bearing: bearing(coords[i], coords[i + 1]),
  };
}

// Point at distance d along the route, with the bearing of that segment.
export function pointAlong(coords, cum, d) {
  if (d <= 0) return { coords: coords[0], bearing: bearing(coords[0], coords[1] || coords[0]) };
  const total = cum[cum.length - 1];
  if (d >= total) {
    const n = coords.length;
    return { coords: coords[n - 1], bearing: bearing(coords[n - 2] || coords[n - 1], coords[n - 1]) };
  }
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= d) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo] || 1;
  const t = (d - cum[lo]) / seg;
  const a = coords[lo];
  const b = coords[hi];
  return { coords: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], bearing: bearing(a, b) };
}
