import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOsrm } from '../src/lib/routing.js';
import { NavEngine } from '../src/lib/navEngine.js';
import { offset, pointAlong } from '../src/lib/geo.js';
import { matchCommand } from '../src/lib/listener.js';
import { parseTomTom, parseOverpass, onRoute, routeBoxes } from '../src/lib/hazards.js';
import { recolor } from '../src/lib/mapTheme.js';
import { categorize } from '../src/lib/geocode.js';

// Straight 5 km road heading east with a 45 mph (72 km/h) limit.
const A = [-73.99, 40.73];
const coords = [A];
for (let d = 50; d <= 5000; d += 50) coords.push(offset(A, 90, d));
const D = coords.at(-1);
const osrm = {
  code: 'Ok',
  routes: [{
    distance: 5000, duration: 300,
    geometry: { coordinates: coords },
    legs: [{
      annotation: { maxspeed: coords.slice(1).map(() => ({ speed: 45, unit: 'mph' })) },
      steps: [
        { name: 'Main St', maneuver: { type: 'depart', location: A, bearing_after: 90 }, distance: 5000 },
        { name: 'Main St', maneuver: { type: 'arrive', location: D }, distance: 0 },
      ],
    }],
  }],
};

function run({ level = 3, speed = 20, category = 'other', hazards = [], seconds = 200, commands = {} } = {}) {
  let t = 0;
  const said = [];
  const route = parseOsrm(osrm);
  const settings = { level, profanity: false, units: 'imperial', chattiness: 0 };
  const eng = new NavEngine({
    route, destName: 'Taco Hut', destCategory: category,
    getSettings: () => settings, say: (s) => said.push(s), onLevel: (l) => { settings.level = l; },
    now: () => t, random: () => 0, simulated: true,
  });
  eng.setHazards(onRoute(hazards, route));
  eng.start();
  let d = 0;
  for (let i = 0; i < seconds; i++) {
    t += 1000;
    d = Math.min(d + speed, 5000);
    if (commands[i]) eng.command(commands[i]);
    eng.update({ coords: pointAlong(route.coords, route.cum, d).coords, speed, accuracy: 5 });
    eng.tick();
    if (eng.arrived) break;
  }
  return { said, eng };
}

test('OSRM speed limits are parsed to m/s', () => {
  const r = parseOsrm(osrm);
  assert.equal(r.maxspeed.length, r.coords.length - 1);
  assert.ok(Math.abs(r.maxspeed[0] - 20.1168) < 0.01);
});

test('speeding gets called out with the actual numbers', () => {
  const { said } = run({ speed: 31 }); // ~69 mph in a 45
  const line = said.find((s) => s.startsWith("You're doing"));
  assert.match(line, /^You're doing 69 in a 45\. .+/);
});

test('crawling gets roasted too, but not at the limit', () => {
  const slow = run({ speed: 8, seconds: 400 }); // ~18 mph in a 45
  assert.ok(slow.said.some((s) => /^You're doing 18 in a 45\. .+/.test(s)));
  const fine = run({ speed: 20 });
  assert.ok(!fine.said.some((s) => s.startsWith("You're doing")));
});

test('destination jokes play at start and arrival', () => {
  const { said } = run({ category: 'fastfood', speed: 25 });
  assert.ok(said.some((s) => /drive-thru|fast food|arteries|cardiologist|cholesterol/i.test(s)), said.join('\n'));
});

test('hazards are warned once with a roast attached', () => {
  const cam = { elements: [{ id: 1, lat: offset(A, 90, 2500)[1], lon: offset(A, 90, 2500)[0], tags: { highway: 'speed_camera' } }] };
  const { said } = run({ hazards: parseOverpass(cam), speed: 20 });
  const w = said.filter((s) => s.startsWith('Speed camera ahead'));
  assert.equal(w.length, 1);
  assert.match(w[0], /^Speed camera ahead in [\w ]+\. .+/);
});

test('"shut up" switches to directions only, "talk to me" brings it back', () => {
  const { said, eng } = run({ commands: { 5: 'quiet' }, seconds: 20, speed: 31 });
  assert.equal(eng.quiet, true);
  const after = said.slice(said.findIndex((s) => /directions only/i.test(s)) + 1);
  for (const s of after) assert.match(s, /^(You're doing \d+ in a \d+\.|In |Continue|Speed|Head|Turn)/);
  eng.command('talk');
  assert.equal(eng.quiet, false);
});

test('"roast me" raises the level', () => {
  const { eng } = run({ level: 2, commands: { 2: 'meaner' }, seconds: 5 });
  assert.equal(eng.getSettings().level, 3);
});

test('voice command matching', () => {
  assert.equal(matchCommand('oh my god shut up'), 'quiet');
  assert.equal(matchCommand('Are we there yet'), 'eta');
  assert.equal(matchCommand('can you repeat that'), 'repeat');
  assert.equal(matchCommand('roast me'), 'meaner');
  assert.equal(matchCommand('what should we eat tonight'), null);
});

test('TomTom incidents parse and filter to our direction of travel', () => {
  const p1 = offset(A, 90, 1000);
  const json = {
    incidents: [
      { geometry: { type: 'LineString', coordinates: [p1, offset(p1, 90, 200)] }, properties: { id: 'a', iconCategory: 1, events: [{ description: 'Accident' }] } },
      { geometry: { type: 'LineString', coordinates: [p1, offset(p1, 270, 200)] }, properties: { id: 'b', iconCategory: 9 } },
      { geometry: { type: 'Point', coordinates: offset(A, 0, 3000) }, properties: { id: 'c', iconCategory: 8 } },
      { geometry: { type: 'Point', coordinates: p1 }, properties: { id: 'd', iconCategory: 6, magnitudeOfDelay: 1 } },
    ],
  };
  const list = onRoute(parseTomTom(json), parseOsrm(osrm));
  assert.deepEqual(list.map((h) => h.kind), ['crash']);
});

test('route boxes cover long routes in chunks', () => {
  const r = parseOsrm(osrm);
  const b = routeBoxes(r.coords, r.cum, { chunk: 2000 });
  assert.equal(b.length, 3);
});

test('map recolor touches roads, water and adds sky + 3D buildings', () => {
  const style = {
    sources: { openmaptiles: { type: 'vector' } },
    layers: [
      { id: 'background', type: 'background', paint: {} },
      { id: 'water', type: 'fill', 'source-layer': 'water', paint: {} },
      { id: 'road_primary', type: 'line', 'source-layer': 'transportation', paint: {} },
      { id: 'road_primary_casing', type: 'line', 'source-layer': 'transportation', paint: {} },
      { id: 'place_city', type: 'symbol', 'source-layer': 'place', layout: { 'text-field': '{name}' }, paint: {} },
    ],
  };
  const pal = { bg: '#000', water: '#00f', minor: '#111', major: '#222', highway: '#333', rail: '#444', path: '#555', casing: '#666', label: '#777', labelMajor: '#888', halo: '#999', building3d: '#aaa', sky: {} };
  const out = recolor(style, pal);
  assert.equal(out.layers[0].paint['background-color'], '#000');
  assert.equal(out.layers[1].paint['fill-color'], '#00f');
  assert.equal(out.layers[3].paint['line-color'], '#666');
  assert.ok(out.layers.some((l) => l.type === 'fill-extrusion'));
  assert.ok(out.sky);
  assert.equal(style.layers[0].paint['background-color'], undefined, 'original untouched');
});

test('destination categories', () => {
  assert.equal(categorize({ osm_key: 'amenity', osm_value: 'fast_food', name: 'Taco Hut' }), 'fastfood');
  assert.equal(categorize({ osm_key: 'amenity', osm_value: 'hospital' }), 'medical');
  assert.equal(categorize({ osm_key: 'office', osm_value: 'government', name: 'DMV' }), 'government');
});
