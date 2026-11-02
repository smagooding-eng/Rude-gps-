// Shared driver reports via Supabase (PostgREST). See supabase/reports.sql.
import { REPORTS } from '../config.js';
import { load, save } from './settings.js';

export const REPORT_KINDS = [
  { id: 'police', label: 'Police', kind: 'police' },
  { id: 'crash', label: 'Crash', kind: 'crash' },
  { id: 'hazard', label: 'Hazard', kind: 'hazard' },
  { id: 'traffic', label: 'Traffic', kind: 'jam' },
  { id: 'construction', label: 'Road work', kind: 'roadwork' },
  { id: 'closure', label: 'Closed', kind: 'closure' },
];
const TO_KIND = Object.fromEntries(REPORT_KINDS.map((k) => [k.id, k.kind]));

export const reportsEnabled = !!(REPORTS.url && REPORTS.key);

function headers() {
  const h = { apikey: REPORTS.key, 'Content-Type': 'application/json' };
  // Legacy anon keys are JWTs and also go in Authorization; new sb_publishable keys don't.
  if (!REPORTS.key.startsWith('sb_')) h.Authorization = `Bearer ${REPORTS.key}`;
  return h;
}

export function deviceId() {
  let id = load('rudegps.device.v1', '');
  if (!id) {
    id = (crypto.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).replace(/-/g, '');
    save('rudegps.device.v1', id);
  }
  return id;
}

export function toHazard(r) {
  return {
    id: `rp-${r.id}`,
    reportId: r.id,
    kind: TO_KIND[r.kind] || 'hazard',
    source: 'Drivers',
    coords: [r.lon, r.lat],
    heading: Number.isFinite(r.heading) ? r.heading : null,
    description: '',
    confirms: r.confirms || 0,
    createdAt: r.created_at,
  };
}

async function rpc(name, body, signal) {
  const res = await fetch(`${REPORTS.url}/rest/v1/rpc/${name}`, { method: 'POST', headers: headers(), body: JSON.stringify(body), signal });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (/slow down/i.test(text)) throw new Error('Easy, reporter. One report every 20 seconds.');
    throw new Error(`Report failed (${res.status})`);
  }
  return res.json().catch(() => null);
}

export async function fetchReports(boxes, signal) {
  if (!reportsEnabled || !boxes.length) return [];
  const now = new Date().toISOString();
  const all = [];
  for (const [w, s, e, n] of boxes) {
    const q = new URLSearchParams();
    q.set('select', 'id,kind,lat,lon,heading,created_at,confirms');
    q.append('lat', `gte.${s}`);
    q.append('lat', `lte.${n}`);
    q.append('lon', `gte.${w}`);
    q.append('lon', `lte.${e}`);
    q.append('expires_at', `gt.${now}`);
    q.set('limit', '300');
    const res = await fetch(`${REPORTS.url}/rest/v1/reports?${q}`, { headers: headers(), signal });
    if (!res.ok) throw new Error(`Driver reports error (${res.status})`);
    all.push(...(await res.json()).map(toHazard));
  }
  return all;
}

export async function addReport(type, coords, heading) {
  return rpc('add_report', { p_kind: type, p_lat: coords[1], p_lon: coords[0], p_heading: heading ?? null, p_device: deviceId() });
}

export async function voteReport(reportId, up) {
  return rpc('vote_report', { p_id: reportId, p_up: up, p_device: deviceId() });
}
