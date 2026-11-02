// Posted speed limits along a route from OpenStreetMap (Overpass).
// Uses the OSM node ids OSRM returns for each route point: every pair of
// consecutive nodes belongs to one OSM way, and that way's maxspeed tag is the limit.

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const MPH = 0.44704;

export function parseMaxspeed(v) {
  if (!v) return null;
  const m = String(v).trim().match(/^(\d+(?:\.\d+)?)\s*(mph|km\/h|kmh|kph)?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  if (!n) return null;
  return m[2] && /mph/i.test(m[2]) ? n * MPH : n / 3.6;
}

export function limitsFromWays(nodes, ways) {
  const pair = new Map();
  for (const w of ways) {
    const v = parseMaxspeed(w.tags?.maxspeed);
    if (!v || !w.nodes) continue;
    for (let i = 0; i < w.nodes.length - 1; i++) {
      pair.set(`${w.nodes[i]}-${w.nodes[i + 1]}`, v);
      pair.set(`${w.nodes[i + 1]}-${w.nodes[i]}`, v);
    }
  }
  const out = [];
  for (let i = 0; i < nodes.length - 1; i++) out.push(pair.get(`${nodes[i]}-${nodes[i + 1]}`) ?? null);
  // Fill short gaps (unmapped bits between two segments with the same limit).
  for (let i = 1; i < out.length; i++) {
    if (out[i] != null || out[i - 1] == null) continue;
    let j = i;
    while (j < out.length && out[j] == null && j - i < 6) j++;
    if (j < out.length && out[j] === out[i - 1]) for (let k = i; k < j; k++) out[k] = out[i - 1];
  }
  return out.some((v) => v != null) ? out : null;
}

export async function fetchSpeedLimits(route, signal) {
  if (!route.nodes?.length) return null;
  const unique = [...new Set(route.nodes)].slice(0, 6000);
  const ways = [];
  for (let i = 0; i < unique.length; i += 1500) {
    const ids = unique.slice(i, i + 1500).join(',');
    const q = `[out:json][timeout:25];node(id:${ids});way(bn)[highway][maxspeed];out body;`;
    const res = await fetch(OVERPASS, { method: 'POST', body: new URLSearchParams({ data: q }), signal });
    if (!res.ok) throw new Error(`Speed limit lookup error (${res.status})`);
    ways.push(...((await res.json()).elements || []));
  }
  return limitsFromWays(route.nodes, ways);
}
