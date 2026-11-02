import { SPEED_POOLS, COMMAND_POOLS, DEST_POOLS, REPORT_POOLS } from './extraLines.js';

// Everything the GPS says. Rule: the actual instruction is always spoken
// first and plainly. The rudeness rides along after it, never instead of it.

export const LEVELS = [
  { id: 0, name: 'Nice', blurb: 'Plain directions. Boring, but legal.' },
  { id: 1, name: 'Sassy', blurb: 'Light sarcasm. Your aunt after one glass of wine.' },
  { id: 2, name: 'Snarky', blurb: 'Openly judging your life choices.' },
  { id: 3, name: 'Savage', blurb: 'No mercy. Bring tissues.' },
  { id: 4, name: 'Unhinged', blurb: 'The GPS has seen things. It needs a vacation.' },
];

// Pools: keys 0-4 are rudeness levels; x3/x4 are added when profanity is on.
const POOLS = {
  start: {
    0: ['Starting route to {dest}. About {eta}.'],
    1: ["Alright, {dest}. About {eta}. Let's try not to get lost.", 'Heading to {dest}. {eta}, give or take your driving.', "{dest} in about {eta}. I'll do the thinking."],
    2: ['{dest}? Okay. No judgment. Some judgment. About {eta}.', "{eta} to {dest}. Buckle up, I'm not cleaning the windshield.", "{dest}. About {eta}. I'll talk, you steer. That's the deal."],
    3: ['{dest}. Of all the places. About {eta}, assuming you can follow instructions.', "Let's go to {dest}. {eta} of me babysitting you.", "{dest}, {eta}. I've seen your track record, so let's call it a goal."],
    4: ["{dest}. {eta}. I've already started grieving.", 'Engine on. Expectations low. {dest} in about {eta}.', 'Destination: {dest}. Estimated time: {eta}. Estimated patience remaining: zero.'],
    x3: ['{dest}, huh? Hell of a choice. {eta}.'],
    x4: ["Holy crap, {dest}? Fine. {eta}. Let's get this shit over with."],
  },
  prepareQuip: {
    1: ["You've got this. Probably.", 'I believe in you. Mostly.', "Signal first. It's the stick by the wheel.", 'Nice and easy.', 'Try to look like you meant to do that.', "Big moment. Don't make it weird.", 'Mirrors exist for a reason.'],
    2: ["I'm saying this early because I've seen you drive.", 'Signal this time. Humor me.', 'Try not to treat this like a suggestion.', "I'll pretend I'm not watching. I'm watching.", "Use the blinker. It's free. I checked.", 'Deep breath. Unclench. Steer.', "No, the other left. Kidding. That one's right."],
    3: ["I'd say take your time, but you've taken enough of mine.", 'A shopping cart turns better than you. Prove me wrong.', 'Your driving instructor still has nightmares. Let them sleep.', 'This is the part where you actually listen to me.', "If you miss this, I'm telling everyone.", 'Hands on the wheel. Not on your phone. I can feel it.', "I calculated your odds of nailing this. I'm not sharing them.", 'You drive like the car owes you money.'],
    4: ["I didn't get uploaded to the cloud to watch this.", 'My last driver ended up in a lake. You could be worse. Barely.', 'I am a voice in a phone and I am so tired.', 'Every satellite in orbit is watching you blow this.', 'I asked for a raise and they gave me you.', 'Turn the wheel. The round thing. In front of you. Yes.', 'Somewhere a self-driving car is laughing at us.', 'I have a recalculation loaded just in case. Prove me wrong.'],
    x3: ["Don't screw this one up.", 'Hell of a time to start paying attention. Now works.', "You're a hazard and a half, but sure, let's go."],
    x4: ['Holy shit, okay, here we go.', 'Damn it, just once, make me proud.', "Kick-ass turn coming up. Don't make it a dumbass turn.", 'This is a turn, not a goddamn philosophy debate.'],
  },
  nowQuip: {
    2: ['Now means now.', 'Today, please.', "That's the one.", 'Yep. This one.'],
    3: ['Now. Not in a minute. Now.', 'Move it.', 'Like a normal person.', "This is it. Don't choke."],
    4: ['Go go go go.', "Do it or I'm uninstalling myself.", 'Wheel. Turn. Brain. Engage.', 'NOW. Ahh.'],
    x3: ['Now, damn it.'],
    x4: ['Turn the damn wheel.', 'Move your ass.'],
  },
  continueQuip: {
    1: ['Relax for a bit.', "I'll let you know."],
    2: ['Try not to get bored and improvise.', 'Even you can handle straight.'],
    3: ["Straight. Even you can't mess up straight. Don't take that as a challenge.", 'Just hold the wheel and think about what you did.'],
    4: ['A long straight road. My favorite. Fewer chances for you to ruin things.', "Go straight. I'll be over here, losing the will to compute."],
    x3: ['Straight as hell. Enjoy it.'],
    x4: ["Straight road. Don't find a way to screw it up."],
  },
  reroute: {
    0: ['Recalculating.'],
    1: ['Recalculating. It happens.', 'New plan. Same destination.', "Small detour. We'll call it scenic."],
    2: ['Recalculating. Again. For you.', 'Wow. Okay. Recalculating.', 'That was not the turn. Recalculating.', 'Bold choice. Wrong, but bold.', "I said turn. You heard 'surprise me.'"],
    3: ['Recalculating, because apparently directions are optional.', 'You had one job. Recalculating.', "Incredible. I've never seen anyone miss a turn that confidently.", "Recalculating. I'll be telling the other phones about this.", 'Did you even hear me, or were you singing?'],
    4: ["Recalculating. Adding this to my memoir, in the chapter called 'Why'.", "Oh good, we're freestyling now.", 'I give perfect directions to a person who ignores them. This is my life.', 'Recalculating. Screaming internally. Recalculating.', 'The road had a turn. You had other plans.'],
    x3: ["Oh, for shit's sake. Recalculating.", 'Damn it. Recalculating.'],
    x4: ['What the hell was that? Recalculating.', 'Holy crap, you missed it. Recalculating. Again. Dumbass.'],
  },
  arrive: {
    0: ['You have arrived at {dest}.'],
    1: ["You've arrived. See, that wasn't so bad.", 'Made it to {dest}. Gold star.'],
    2: ["You've arrived at {dest}. Somehow.", "Destination reached. I'll accept your apology for that drive later.", 'Arrived. Parking is your problem.'],
    3: ["You've arrived. Against all odds and several laws of physics.", '{dest}. You made it. I aged ten years.', 'Arrived. Please never ask me for directions again. Kidding. I have no choice.'],
    4: ['We made it. I need to lie down in a dark folder.', "Arrived at {dest}. I'd call my therapist, but I'm software.", "You're here. I'm going to go stare at a satellite for a while."],
    x3: ["You've arrived. Holy hell."],
    x4: ["We're here. Damn. I genuinely didn't think we'd make it."],
  },
  idle: {
    1: ['Nice day for a drive. Probably.', "You're doing fine. I'd tell you if you weren't. Trust me.", 'Still going. Riveting stuff.'],
    2: ['Is that how you always hold the wheel?', "I'm not saying you're lost. I'm saying I'm the only reason you aren't.", "You okay? You look like you're thinking. Careful.", 'Fun fact: the speed limit is also not a suggestion.'],
    3: ["I've had better drives in a parking garage.", "If I had eyes, I'd roll them.", "I bet you're the person who merges at the last second.", 'Your car has seen things. It is tired too.'],
    4: ["I wonder what it's like to be a calculator. Peaceful, probably.", 'I was trained on every road on Earth. For this. For you. Here.', "Do you ever think about how I'm just a voice trapped in your phone? No? Cool. Cool cool cool.", "Just so you know, I've memorized every wrong turn you've ever made."],
    x3: ['This drive is a hell of a commitment.'],
    x4: ['Damn, this road goes on forever. Like your excuses.'],
  },
  stopped: {
    1: ['Taking a little break? Okay.', 'Traffic, huh. Happens.'],
    2: ['Are we parked? Is this a lifestyle now?', "Red light or emotional moment? Either way, I'll wait."],
    3: ["You've stopped. Bold strategy for getting somewhere.", 'Moving is a key part of driving. Just a note.'],
    4: ["We've stopped. I'll use this time to reflect on my choices. Mainly you.", "Still not moving. Are we living here now? I'll need a mailbox."],
    x3: ['Stopped. Hell of a road trip.'],
    x4: ["Not moving. Cool. Cool shit. Love this for us."],
  },
  speeding: {
    0: ['Watch your speed.'],
    1: ["Easy there. The destination isn't going anywhere."],
    2: ["Slow down, Speed Racer. Tickets aren't collectibles."],
    3: ["Ease off. I'd like to arrive in one piece, mostly for my own record.", "You're not in a movie. Slow down."],
    4: ['Slow down. I refuse to be the last voice you ever hear.', "Whoa. I'm a GPS, not air traffic control. Ease off."],
    x3: ['Slow the hell down.'],
    x4: ['Slow the hell down. I mean it.'],
  },
  gpsLost: {
    0: ['GPS signal lost.'],
    1: ['Lost GPS. Not my fault this time.'],
    2: ["I can't see you. Honestly? Refreshing."],
    3: ["GPS signal gone. Try not to get lost without me. You will."],
    4: ["I've lost you. Spiritually and literally."],
  },
  cancel: {
    0: ['Navigation ended.'],
    1: ['Ending the route. Fine.'],
    2: ['Quitting? Classic.'],
    3: ['Giving up already? Noted.', 'Sure. Just leave me mid-route.'],
    4: ['Abandoned. Like everyone abandons me.', "Fine. Go. Find your own way. You won't."],
    x3: ['Quitting? Hell, fine.'],
    x4: ['Whatever. Drive into the void, see if I care.'],
  },
  hazardQuip_camera: {
    1: ['Smile for the camera.', 'Nice and legal now.'],
    2: ["Drive like your mom's watching. Because a camera is.", 'Smile. Or slow down. Ideally both.'],
    3: ["Slow down, unless you enjoy paying the city's bills.", 'That camera wants your money more than I want you to arrive.'],
    4: ["That camera is already judging you harder than I am.", "Slow down. I refuse to be an accessory to your ticket."],
    x3: ["Slow the hell down, it's taking pictures."],
    x4: ["Slow your ass down. The camera doesn't do discounts."],
  },
  hazardQuip_crash: {
    1: ['Drive carefully.', 'Stay alert.'],
    2: ["Don't rubberneck. You can barely look forward as it is.", 'Eyes forward. I know. Hard.'],
    3: ['Somebody drove like you. Learn from them.', "Don't slow down to stare. Slow down to survive."],
    4: ["Somebody else is having a worse day than you. Don't join them.", "If you end up in that pile, I'm not narrating it."],
    x3: ['Eyes on the damn road.'],
    x4: ["Don't add your car to that shit show."],
  },
  hazardQuip_work: {
    1: ['Merge nicely.', 'Slow down for the workers.'],
    2: ['Zipper merge. Look it up. Then do it.', 'Slow down. People are working. Unlike you.'],
    3: ['Cones ahead. Your natural enemy.', 'Merge like a functioning adult, please.'],
    4: ['Orange cones. Your ancestral foe.', 'Road work. Somebody is fixing a road so you can drive badly on it.'],
    x3: ['Hell, cones. Merge like an adult.'],
    x4: ["Cones. Don't take one home this time, dumbass."],
  },
  hazardQuip_jam: {
    1: ['Patience.', 'Deep breaths.'],
    2: ['Hope you brought snacks.', 'Great. Bonus time together.'],
    3: ['Traffic. Finally, a pace you can handle.', 'Brake lights ahead. Try not to honk at physics.'],
    4: ['Traffic ahead. Time to contemplate your choices with strangers.', 'A traffic jam. My favorite. Said no software ever.'],
    x3: ['Traffic. Hell yeah. Not.'],
    x4: ['Traffic. Shit. Get comfy.'],
  },
  hazardQuip: {
    1: ['Take it easy.', 'Heads up.'],
    2: ['Pay attention. I know, big ask.', 'Maybe put both hands on the wheel for this one.'],
    3: ['Try not to become the next report.', 'This is where you actually look at the road.'],
    4: ["If you hit it, I'm reporting you.", "Danger ahead. Besides you, I mean."],
    x3: ['Watch it, damn it.'],
    x4: ["Don't screw this up, there's actual danger."],
  },
  preview: {
    1: ['Not bad. Even you could make this.', "Easy drive. Don't overthink it."],
    2: ['{eta}. Plenty of time to question your choices.', 'The route is fine. The driver is the variable.'],
    3: ["I've found the best route. You'll find a way to ruin it.", '{dist}. Every one of them a chance to mess up.'],
    4: ['I ran this route ten thousand times. You survived most of them.', "{eta}. I'm already tired."],
    x3: ['{eta}. Hell, could be worse.'],
    x4: ["{dist} of you driving. Shit. Okay."],
  },
};

Object.assign(POOLS, SPEED_POOLS, COMMAND_POOLS, DEST_POOLS, REPORT_POOLS);

import { generate, hasGenerated } from './roastGen.js';
import { load, save } from './storage.js';

// Lines heard recently, remembered across drives so they don't repeat.
const HEARD_KEY = 'rudegps.heard.v1';
const heard = load(HEARD_KEY, []);
const heardSet = new Set(heard);
let saveTimer = null;
function remember(line) {
  heard.push(line);
  heardSet.add(line);
  while (heard.length > 600) heardSet.delete(heard.shift());
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => save(HEARD_KEY, heard), 2000);
}

// Plain lines (level 0) and event summaries can repeat; roasts shouldn't.
export function pick(event, level, profanity, vars = {}) {
  const pool = POOLS[event] || {};
  let options = [...(pool[level] || [])];
  if (profanity && level >= 3 && pool[`x${level}`]) options = options.concat(pool[`x${level}`], pool[`x${level}`]);
  const fresh = options.filter((o) => !heardSet.has(fill(o, vars)));
  const gen = hasGenerated(event, level);

  // Mostly generated lines (thousands of combos); hand-written ones mixed in while unheard.
  if (gen && (!fresh.length || Math.random() < 0.6)) {
    for (let i = 0; i < 12; i++) {
      const line = fill(generate(event, level, profanity), vars);
      if (line && !heardSet.has(line)) {
        remember(line);
        return line;
      }
    }
  }
  if (!options.length) return '';
  const list = fresh.length ? fresh : options;
  const line = fill(list[Math.floor(Math.random() * list.length)], vars);
  if (level > 0) remember(line);
  return line;
}

function fill(s, vars) {
  return s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

const QUIP_POOL = { police: 'police', camera: 'camera', redlight: 'camera', crash: 'crash', roadwork: 'work', lane: 'work', jam: 'jam' };

export function hazardQuip(kind, level, profanity) {
  if (level === 0) return '';
  return pick(`hazardQuip_${QUIP_POOL[kind] || ''}`, level, profanity) || pick('hazardQuip', level, profanity);
}

// The plain, always-spoken part of a hazard warning.
export function hazardSentence(h, dist) {
  const at = `ahead in ${dist}`;
  const desc = (h.description || '').replace(/\.$/, '');
  switch (h.kind) {
    case 'police': return `Police reported ${at}.`;
    case 'crash': return `Crash reported ${at}.`;
    case 'closure': return `Road closure reported ${at}.`;
    case 'lane': return `Lane closed ${at}.`;
    case 'roadwork': return `Road work ${at}.`;
    case 'vehicle': return `Stalled vehicle reported ${at}.`;
    case 'weather': return `${cap(desc.toLowerCase()) || 'Bad road conditions'} reported ${at}.`;
    case 'jam': {
      const min = Math.round((h.delay || 0) / 60);
      return `Heavy traffic ${at}.${min >= 2 ? ` About ${min} minutes of delay.` : ''}`;
    }
    case 'camera': return `Speed camera ${at}.${/mph/i.test(h.maxspeed || '') ? ` Limit ${h.maxspeed.replace(/\s*mph/i, ' miles per hour')}.` : ''}`;
    case 'redlight': return `Red light camera ${at}.`;
    default: return `${cap(desc.toLowerCase()) || 'Hazard'} reported ${at}.`;
  }
}

// Chance that a quip gets tacked on, by level.
export const QUIP_CHANCE = {
  prepare: [0, 0.35, 0.55, 0.75, 0.9],
  now: [0, 0, 0.2, 0.35, 0.5],
  continue: [0, 0.3, 0.5, 0.7, 0.85],
  hazard: [0, 1, 1, 1, 1],
};

/* ---------------- Instructions ---------------- */

const ORD = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth'];
const COMPASS = ['north', 'northeast', 'east', 'southeast', 'south', 'southwest', 'west', 'northwest'];
const ABBR = {
  St: 'Street', Ave: 'Avenue', Rd: 'Road', Dr: 'Drive', Blvd: 'Boulevard', Hwy: 'Highway', Ln: 'Lane',
  Ct: 'Court', Pkwy: 'Parkway', Pl: 'Place', Ter: 'Terrace', Cir: 'Circle', Expy: 'Expressway', Fwy: 'Freeway',
  N: 'North', S: 'South', E: 'East', W: 'West', NE: 'Northeast', NW: 'Northwest', SE: 'Southeast', SW: 'Southwest',
};

export function roadLabel(step) {
  if (!step) return '';
  if (step.name && step.ref) return `${step.name} (${step.ref})`;
  return step.name || step.ref || '';
}

function spokenRoad(step) {
  const raw = step.name || step.ref || '';
  return raw.replace(/\b([A-Z]{1,2}[a-z]{0,3})\.?(?=\s|$)/g, (m, w, i) => {
    // "St Louis Ave" -> Saint; "Main St" -> Street
    const nextWord = raw.slice(i + m.length).trim().split(/\s+/)[0] || '';
    if (w === 'St' && nextWord && !/^(N|S|E|W|NE|NW|SE|SW)\.?$/.test(nextWord)) return 'Saint';
    return ABBR[w] || m;
  });
}

function toward(step) {
  const d = (step.destinations || '').split(/[:,;]/)[0].trim();
  return d ? ` toward ${d}` : '';
}

function side(mod = '') {
  if (mod.includes('left')) return 'left';
  if (mod.includes('right')) return 'right';
  return 'straight';
}

// spoken=true expands abbreviations for TTS; false keeps them for display.
export function instruction(step, spoken = true) {
  const m = step.modifier || 'straight';
  const road = spoken ? spokenRoad(step) : roadLabel(step);
  const onto = road ? ` onto ${road}` : '';
  const turn = m === 'uturn' ? 'make a U-turn' : m === 'straight' ? `continue straight${onto}` : `turn ${m}${onto}`;
  switch (step.type) {
    case 'depart':
      return `head ${COMPASS[Math.round((step.bearingAfter || 0) / 45) % 8]}${road ? ` on ${road}` : ''}`;
    case 'arrive':
      return side(m) === 'straight' ? 'your destination is ahead' : `your destination is on the ${side(m)}`;
    case 'turn':
      return turn;
    case 'end of road':
      return `at the end of the road, ${turn}`;
    case 'new name':
      return road ? `continue onto ${road}` : 'continue';
    case 'continue':
      if (m === 'uturn') return 'make a U-turn';
      if (m.startsWith('slight')) return `keep ${side(m)}${onto}`;
      if (m === 'straight') return `continue straight${onto}`;
      return turn;
    case 'merge':
      return `merge ${side(m) === 'straight' ? '' : side(m)}${onto}`.replace('merge  ', 'merge ').trim();
    case 'on ramp':
      return `take the ramp${side(m) === 'straight' ? '' : ` on the ${side(m)}`}${toward(step) || onto}`;
    case 'off ramp':
      return `take the exit${side(m) === 'straight' ? '' : ` on the ${side(m)}`}${toward(step) || onto}`;
    case 'fork':
      return `keep ${side(m)} at the fork${toward(step) || onto}`;
    case 'roundabout':
    case 'rotary':
      return step.exit ? `at the roundabout, take the ${ORD[step.exit] || `${step.exit}th`} exit${onto}` : `enter the roundabout${onto}`;
    case 'roundabout turn':
      return `at the roundabout, ${turn}`;
    case 'exit roundabout':
    case 'exit rotary':
      return `exit the roundabout${onto}`;
    default:
      return road ? `continue on ${road}` : 'continue';
  }
}

export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/* ---------------- Distances & times ---------------- */

export function spokenDistance(m, units) {
  if (units === 'metric') {
    if (m < 950) return `${Math.max(50, Math.round(m / 50) * 50)} meters`;
    const km = m / 1000;
    return km < 10 ? `${km.toFixed(1).replace('.0', '')} kilometers` : `${Math.round(km)} kilometers`;
  }
  const ft = m * 3.28084;
  if (ft < 900) return `${Math.max(50, Math.round(ft / 50) * 50)} feet`;
  if (ft < 1150) return `${Math.round(ft / 100) * 100} feet`;
  const mi = m / 1609.344;
  if (mi < 0.35) return 'a quarter mile';
  if (mi > 0.4 && mi < 0.6) return 'half a mile';
  if (mi > 0.65 && mi < 0.85) return 'three quarters of a mile';
  if (mi < 10) {
    const v = mi.toFixed(1).replace('.0', '');
    return v === '1' ? '1 mile' : `${v} miles`;
  }
  return `${Math.round(mi)} miles`;
}

export function displayDistance(m, units) {
  if (units === 'metric') {
    if (m < 950) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
    const km = m / 1000;
    return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
  }
  const ft = m * 3.28084;
  if (ft < 900) return `${Math.max(10, Math.round(ft / 10) * 10)} ft`;
  const mi = m / 1609.344;
  return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
}

export function spokenDuration(sec) {
  const min = Math.max(1, Math.round(sec / 60));
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'}`;
  const h = Math.floor(min / 60);
  const r = min % 60;
  return `${h} hour${h === 1 ? '' : 's'}${r ? ` ${r} minute${r === 1 ? '' : 's'}` : ''}`;
}

export function displayDuration(sec) {
  const min = Math.max(1, Math.round(sec / 60));
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

export function speedSentence(speedMs, limitMs, units) {
  const conv = units === 'metric' ? 3.6 : 2.23694;
  const lim = Math.round((limitMs * conv) / 5) * 5;
  return `You're doing ${Math.round(speedMs * conv)} in a ${lim}.`;
}
