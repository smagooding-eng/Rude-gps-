// Small inline SVG glyphs for hazard markers and the alert banner.
export const HAZARD_STYLE = {
  police: { color: '#3b82f6', label: 'Police' },
  crash: { color: '#ff3b5c', label: 'Crash' },
  closure: { color: '#ff3b5c', label: 'Road closed' },
  lane: { color: '#ff8a3b', label: 'Lane closed' },
  roadwork: { color: '#ff8a3b', label: 'Road work' },
  hazard: { color: '#ffb020', label: 'Hazard' },
  vehicle: { color: '#ffb020', label: 'Stalled vehicle' },
  weather: { color: '#5bb8ff', label: 'Bad conditions' },
  jam: { color: '#c0392b', label: 'Traffic jam' },
  camera: { color: '#b98cff', label: 'Speed camera' },
  redlight: { color: '#b98cff', label: 'Red light camera' },
};

const GLYPH = {
  police: '<path d="M12 3.5 19 6v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6Z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="m12 8 1.2 2.5 2.7.3-2 1.9.5 2.7L12 14.1l-2.4 1.3.5-2.7-2-1.9 2.7-.3Z" fill="#fff"/>',
  crash: '<path d="M12 5 21 19H3Z" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round"/><path d="M12 10v4M12 16.5v.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
  closure: '<circle cx="12" cy="12" r="7.5" fill="none" stroke="#fff" stroke-width="2.2"/><path d="M8 12h8" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>',
  lane: '<path d="M8 5v14M16 5v3M16 11v3M16 17v2" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
  roadwork: '<path d="M12 4 17.5 19h-11Z" fill="#fff"/><path d="M8.6 13h6.8" stroke="currentColor" stroke-width="2"/><path d="M4 19.5h16" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
  hazard: '<path d="M12 5v9M12 17.5v.5" stroke="#fff" stroke-width="2.8" stroke-linecap="round"/>',
  vehicle: '<path d="M5 15v-3l2-4h10l2 4v3Z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><circle cx="8" cy="16" r="1.6" fill="#fff"/><circle cx="16" cy="16" r="1.6" fill="#fff"/>',
  weather: '<path d="M7 15a4 4 0 0 1 .5-8 5 5 0 0 1 9.5 1.5A3.3 3.3 0 0 1 16.5 15Z" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/><path d="M9 18v1.5M13 18v1.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  jam: '<path d="M6 8h12M6 12h12M6 16h12" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>',
  camera: '<rect x="4" y="8" width="13" height="9" rx="2" fill="none" stroke="#fff" stroke-width="2"/><path d="m17 11 4-2v7l-4-2" fill="none" stroke="#fff" stroke-width="2" stroke-linejoin="round"/>',
  redlight: '<rect x="8" y="3.5" width="8" height="17" rx="3" fill="none" stroke="#fff" stroke-width="2"/><circle cx="12" cy="8" r="2" fill="#fff"/><circle cx="12" cy="13" r="1.4" fill="#fff" opacity=".5"/><circle cx="12" cy="17" r="1.4" fill="#fff" opacity=".5"/>',
};

export function hazardSvg(kind, size = 24) {
  const k = GLYPH[kind] ? kind : 'hazard';
  const color = (HAZARD_STYLE[k] || HAZARD_STYLE.hazard).color;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="color:${color}">${GLYPH[k]}</svg>`;
}
