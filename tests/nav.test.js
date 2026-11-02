// Drives a fake car through a synthetic OSRM route and checks what gets said.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOsrm } from '../src/lib/routing.js';
import { NavEngine } from '../src/lib/navEngine.js';
import { offset, pointAlong } from '../src/lib/geo.js';
import { instruction, spokenDistance, pick } from '../src/lib/lines.js';

// Start, 2.5 km east on Main St, left onto N Oak Ave for 600 m, right onto Elm St 300 m, arrive.
function line(from, brg, meters, stepM = 50) {
  const pts = [];
  for (let d = stepM; d <= meters; d += stepM) pts.push(offset(from, brg, d));
  return pts;
}
const A = [-73.99, 40.73];
const seg1 = line(A, 90, 2500);
const B = seg1.at(-1);
const seg2 = line(B, 0, 600);
const C = seg2.at(-1);
const seg3 = line(C, 90, 300);
const D = seg3.at(-1);
const coords = [A, ...seg1, ...seg2, ...seg3];
const osrm = {
  code: 'Ok',
  routes: [{
    distance: 3400, duration: 300,
    geometry: { type: 'LineString', coordinates: coords },
    legs: [{ steps: [
      { name: 'Main St', maneuver: { type: 'depart', location: A, bearing_after: 90 }, distance: 2500 },
      { name: 'N Oak Ave', maneuver: { type: 'turn', modifier: 'left', location: B, bearing_after: 0 }, distance: 600 },
      { name: 'Elm St', maneuver: { type: 'turn', modifier: 'right', location: C, bearing_after: 90 }, distance: 300 },
      { name: 'Elm St', maneuver: { type: 'arrive', modifier: 'right', location: D }, distance: 0 },
    ] }],
  }],
};

function drive({ level = 3, profanity = false, missTurn = false } = {}) {
  let t = 0;
  const said = [];
  let route = parseOsrm(osrm);
  let rerouteAt = null;
  let arrived = false;
  const eng = new NavEngine({
    route, destName: 'Joe\'s Pizza',
    getSettings: () => ({ level, profanity, units: 'imperial', chattiness: 1 }),
    say: (s) => said.push(s),
    onReroute: (from) => { rerouteAt = from; },
    onArrive: () => { arrived = true; },
    now: () => t, random: () => 0, simulated: true,
  });
  eng.start();
  const speed = 15;
  let d = 0;
  let detour = null;
  for (let i = 0; i < 600 && !arrived; i++) {
    t += 1000;
    let pos;
    if (detour) {
      detour = offset(detour, 0 + 180, speed); // keep going wrong way (south)
      pos = detour;
    } else {
      d += speed;
      pos = pointAlong(route.coords, route.cum, d).coords;
      if (missTurn && !rerouteAt && d > 2520 && d < 2540) { detour = offset(B, 90, 30); pos = detour; }
    }
    eng.update({ coords: pos, speed, accuracy: 5 });
    eng.tick();
    if (rerouteAt) {
      // Fake the reroute server: straight back to Oak via a U-turn-ish path is overkill; reuse original route from start.
      eng.setRoute(route, true);
      d = 2400; detour = null; rerouteAt = null; missTurn = false;
    }
  }
  return { said, arrived };
}

test('instructions read naturally', () => {
  const r = parseOsrm(osrm);
  assert.equal(instruction(r.steps[0]), 'head east on Main Street');
  assert.equal(instruction(r.steps[1]), 'turn left onto North Oak Avenue');
  assert.equal(instruction(r.steps[1], false), 'turn left onto N Oak Ave');
  assert.equal(instruction(r.steps[3]), 'your destination is on the right');
  assert.equal(instruction({ type: 'turn', modifier: 'right', name: 'St Louis Ave' }), 'turn right onto Saint Louis Avenue');
  assert.equal(instruction({ type: 'roundabout', exit: 2, name: 'Elm St' }), 'at the roundabout, take the second exit onto Elm Street');
  assert.equal(instruction({ type: 'off ramp', modifier: 'slight right', destinations: 'I 95 North: Boston' }), 'take the exit on the right toward I 95 North');
  assert.equal(spokenDistance(400, 'imperial'), 'a quarter mile');
  assert.equal(spokenDistance(800, 'imperial'), 'half a mile');
  assert.equal(spokenDistance(120, 'imperial'), '400 feet');
  assert.equal(spokenDistance(400, 'metric'), '400 meters');
});

test('steps are anchored along the route', () => {
  const r = parseOsrm(osrm);
  assert.ok(Math.abs(r.steps[1].along - 2500) < 5);
  assert.ok(Math.abs(r.steps[2].along - 3100) < 5);
});

test('full drive announces every maneuver in order and arrives', () => {
  const { said, arrived } = drive({ level: 0 });
  console.log('\n  ' + said.join('\n  '));
  assert.ok(arrived);
  const prep = said.findIndex((s) => /^In .*turn left onto North Oak Avenue/.test(s));
  const now = said.findIndex((s) => /^Turn left onto North Oak Avenue now/.test(s));
  const prep2 = said.findIndex((s) => /turn right onto Elm Street/.test(s));
  const arr = said.findIndex((s) => /arrived/.test(s));
  assert.ok(said.some((s) => /^Continue on Main St for/.test(s)) === false, 'no continue right after depart');
  assert.ok(prep > 0 && now > prep && prep2 > now && arr > prep2, 'order: prepare, now, next, arrive');
});

test('savage level keeps the instruction first, then the roast', () => {
  const { said } = drive({ level: 3 });
  const i = said.findIndex((x) => x.startsWith('In ') && x.includes('North Oak'));
  assert.match(said[i], /^In [\w ]+, turn left onto North Oak Avenue\.$/);
  assert.ok(said[i + 1] && !said[i + 1].startsWith('Turn'), 'roast follows the instruction as its own line');
});

test('missing a turn triggers a reroute roast', () => {
  const { said, arrived } = drive({ level: 4, missTurn: true });
  console.log('\n  ' + said.join('\n  '));
  assert.ok(said.some((s) => /ecalculating|freestyling|other plans|my life|route|detour|plan/i.test(s)));
  assert.ok(arrived);
});

test('profanity only appears when enabled', () => {
  const swears = /\b(shit|damn|hell|ass|dumbass|jackass|crap|goddamn|half-assed)\b/i;
  for (let i = 0; i < 200; i++) assert.doesNotMatch(pick('reroute', 4, false), swears);
  let hit = false;
  for (let i = 0; i < 200; i++) if (swears.test(pick('reroute', 4, true))) hit = true;
  assert.ok(hit);
  for (let lvl = 0; lvl <= 2; lvl++) for (let i = 0; i < 100; i++) assert.doesNotMatch(pick('prepareQuip', lvl, true) || '', swears);
});
