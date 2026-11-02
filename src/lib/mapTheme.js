// Custom "Rude" map looks, built by recoloring OpenFreeMap's Liberty style
// before it renders. Classic OpenFreeMap light/dark are kept as options.

export const BASE = {
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

export const MAP_THEMES = [
  { id: 'auto', name: 'Auto' },
  { id: 'night', name: 'Night' },
  { id: 'day', name: 'Day' },
  { id: 'light', name: 'Classic' },
  { id: 'dark', name: 'Classic dark' },
];

const PALETTES = {
  night: {
    bg: '#15171c',
    land: '#191c22',
    park: '#17241d',
    wood: '#162119',
    water: '#0d2232',
    waterLine: '#123247',
    building: '#20232a',
    building3d: '#272b33',
    minor: '#2b2f37',
    major: '#3d424d',
    highway: '#6d5a48',
    casing: '#101216',
    rail: '#3a3e47',
    path: '#24272e',
    boundary: '#4a3f5c',
    label: '#aeb3bd',
    labelMajor: '#d8dbe2',
    halo: '#15171c',
    poiOpacity: 0.55,
    sky: { 'sky-color': '#0b0d12', 'horizon-color': '#1d2230', 'fog-color': '#15171c' },
  },
  day: {
    bg: '#ebe8e1',
    land: '#e6e3db',
    park: '#cfe0c2',
    wood: '#c3d8b5',
    water: '#a7cbe2',
    waterLine: '#8fbbd6',
    building: '#dad5cb',
    building3d: '#d6d0c4',
    minor: '#ffffff',
    major: '#fff4c8',
    highway: '#ffc98c',
    casing: '#c7c0b2',
    rail: '#b9b3a8',
    path: '#d6d1c6',
    boundary: '#a596b8',
    label: '#4a4d55',
    labelMajor: '#22242a',
    halo: '#ffffff',
    poiOpacity: 0.8,
    sky: { 'sky-color': '#b9d7ee', 'horizon-color': '#eef3f6', 'fog-color': '#ebe8e1' },
  },
};

const roadColor = (p) => [
  'match', ['get', 'class'],
  ['motorway', 'trunk'], p.highway,
  ['primary', 'secondary'], p.major,
  ['rail', 'transit'], p.rail,
  ['path', 'track', 'pedestrian', 'footway', 'cycleway', 'bridleway', 'steps'], p.path,
  p.minor,
];

const BIG_PLACES = ['city', 'state', 'country', 'continent'];

export function styleUrl(themeId) {
  return themeId === 'dark' ? BASE.dark : BASE.liberty;
}

// Returns a transformStyle function for map.setStyle, or undefined for classic themes.
export function styleTransform(themeId) {
  const p = PALETTES[themeId];
  if (!p) return undefined;
  return (_prev, next) => recolor(next, p);
}

export function recolor(style, p) {
  const s = { ...style, layers: style.layers.map((l) => ({ ...l, paint: { ...(l.paint || {}) }, layout: { ...(l.layout || {}) } })) };
  let has3d = false;

  for (const l of s.layers) {
    const sl = l['source-layer'] || '';
    const id = l.id || '';
    switch (l.type) {
      case 'background':
        l.paint['background-color'] = p.bg;
        break;
      case 'fill':
        if (sl === 'water') l.paint['fill-color'] = p.water;
        else if (sl === 'park') l.paint['fill-color'] = p.park;
        else if (sl === 'landcover') l.paint['fill-color'] = ['match', ['get', 'class'], ['wood', 'forest', 'grass', 'farmland', 'wetland'], p.wood, p.land];
        else if (sl === 'landuse') l.paint['fill-color'] = p.land;
        else if (sl === 'building') l.paint['fill-color'] = p.building;
        else if (sl === 'aeroway') l.paint['fill-color'] = p.minor;
        delete l.paint['fill-pattern'];
        if ('fill-outline-color' in l.paint) l.paint['fill-outline-color'] = p.bg;
        break;
      case 'fill-extrusion':
        has3d = true;
        l.paint['fill-extrusion-color'] = p.building3d;
        l.paint['fill-extrusion-opacity'] = 0.85;
        break;
      case 'line':
        if (sl === 'transportation') {
          l.paint['line-color'] = id.includes('casing') ? p.casing : roadColor(p);
        } else if (sl === 'waterway' || sl === 'water') {
          l.paint['line-color'] = p.waterLine;
        } else if (sl === 'boundary') {
          l.paint['line-color'] = p.boundary;
          l.paint['line-opacity'] = 0.6;
        } else if (sl === 'aeroway') {
          l.paint['line-color'] = p.minor;
        }
        delete l.paint['line-pattern'];
        break;
      case 'symbol':
        if (sl === 'poi') {
          l.minzoom = Math.max(l.minzoom || 0, 15);
          l.paint['icon-opacity'] = p.poiOpacity;
          l.paint['text-opacity'] = p.poiOpacity;
        }
        if (l.layout['text-field'] !== undefined) {
          const big = sl === 'place' && BIG_PLACES.some((c) => id.includes(c));
          l.paint['text-color'] = big ? p.labelMajor : p.label;
          l.paint['text-halo-color'] = p.halo;
          l.paint['text-halo-width'] = 1.4;
          l.paint['text-halo-blur'] = 0.4;
        }
        break;
      default:
        break;
    }
  }

  // Add 3D buildings if the base style has none.
  const src = Object.keys(s.sources || {}).find((k) => s.sources[k].type === 'vector');
  if (!has3d && src) {
    const firstSymbol = s.layers.findIndex((l) => l.type === 'symbol');
    const layer = {
      id: 'rude-3d-buildings',
      type: 'fill-extrusion',
      source: src,
      'source-layer': 'building',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': p.building3d,
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 6],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.85,
      },
    };
    s.layers.splice(firstSymbol < 0 ? s.layers.length : firstSymbol, 0, layer);
  }

  s.sky = { ...p.sky, 'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.6, 'atmosphere-blend': 0 };
  return s;
}
