// Roast generator: frames x comparisons x nicknames, so every category has
// thousands of combinations instead of a handful of fixed lines.
// Frames use {sim} (a comparison: "a goose who stole a minivan"), {name}
// (a nickname: "you magnificent traffic cone") and {Name} (capitalized).

const SIMS = [
  'a shopping cart in a windstorm', 'a Roomba on its third espresso', 'a goose who stole a minivan', 'a raccoon who found the keys',
  'a lawn chair in a hurricane', 'a pigeon reading a paper map', 'a bowling ball with opinions', 'a tumbleweed with a learner\'s permit',
  'a toddler steering a grocery cart', 'a deer wearing sunglasses at night', 'a golf cart in a demolition derby', 'a parade float with road rage',
  'a confused weather balloon', 'a beach ball in a parking garage', 'a fridge on roller skates', 'a cat chasing a laser pointer',
  'a squirrel with a deadline', 'a microwave trying to parallel park', 'a pinball with a license', 'a hamster on a highway',
  'a sleepwalking moose', 'a pool noodle in a current', 'an inflatable tube man in a storm', 'a rotisserie chicken that learned to drive',
  'a remote control car with a dying battery', 'a duck on a frozen pond', 'a stack of pancakes with ambition', 'a lost tourist with a tuba',
  'a shopping mall Santa on his day off', 'a vending machine having a breakdown', 'a lawnmower with a grudge', 'a turtle late for brunch',
  'a bumper car in a library', 'a runaway office chair', 'a jellyfish in rush hour', 'a soggy cardboard box',
  'a robot vacuum stuck under a couch', 'a garden gnome behind the wheel', 'a houseplant with road rage', 'a snail on a caffeine crash',
  'an ice cream truck with no brakes', 'a drunk bumblebee', 'a horse that just learned about cars', 'a grandma in a monster truck',
  'a skateboarding possum', 'a hot air balloon in a tunnel', 'a sofa rolling downhill', 'a penguin on a waterslide',
  'a mall walker in a Ferrari', 'a confused mail truck', 'a GPS from 2003', 'a magician who forgot the trick',
  'a carnival ride with no operator', 'a cow on a scooter', 'a clown car that lost the circus', 'a goat in a revolving door',
  'a boat that thinks it\'s a car', 'a wind-up toy with commitment issues', 'a forklift in a ballet', 'a raccoon in a trench coat',
  'a lost Uber driver on his first day', 'a skeleton driving a hearse', 'a parade balloon off its rope', 'a puppy chasing its tail',
  'a pinata that got loose', 'a dazed seagull', 'a lawn flamingo with a dream', 'a wobbly shopping trolley in the rain',
  'a bouncy castle on the interstate', 'a teenager at a four-way stop', 'a spaceship with no pilot', 'a bowling pin in a hurry',
  'a sock in a dryer', 'a frisbee caught in the wind', 'a sentient traffic cone', 'a mime stuck in an invisible lane',
  'a tired sloth in a race car', 'a hula hoop rolling downhill', 'a mattress strapped to nothing', 'a slow-motion car commercial',
  'a reality show contestant', 'a chicken crossing for no reason', 'a pothole with wheels', 'a confused bat at noon',
  'a crab trying to merge', 'a wet bar of soap', 'a karaoke singer on the wrong song', 'a paper airplane in a fan',
  'a nervous intern', 'a balloon animal with anxiety', 'a toaster on a skateboard', 'a cloud with a steering wheel',
];

const ADJ = [
  'magnificent', 'chaotic', 'confused', 'budget', 'off-brand', 'sleep-deprived', 'overconfident', 'underqualified',
  'deeply average', 'lukewarm', 'decaffeinated', 'malfunctioning', 'bargain-bin', 'wobbly', 'half-charged', 'unsupervised',
  'chronically late', 'spectacularly mediocre', 'self-appointed', 'part-time', 'freshly licensed', 'slightly damp', 'clearance-rack',
  'beta-version', 'store-brand', 'unpaid', 'well-meaning', 'turbo-confused', 'dollar-store', 'semi-professional',
  'blinker-allergic', 'lane-curious', 'overcaffeinated', 'directionally challenged', 'tragically optimistic', 'pre-owned',
  'lightly used', 'emotionally loud', 'tiny', 'enormous', 'majestic', 'certified', 'gently used', 'expired',
];

const NOUN = [
  'traffic cone', 'shopping cart', 'speed bump', 'pothole', 'crash test dummy', 'lawn chair', 'golf cart', 'tumbleweed',
  'goose', 'raccoon', 'pigeon', 'potato', 'toaster', 'pool noodle', 'windshield wiper', 'backseat driver',
  'bumper sticker', 'hood ornament', 'parking cone', 'cul-de-sac', 'roundabout', 'detour sign', 'learner\'s permit',
  'hubcap', 'air freshener', 'cup holder', 'hazard light', 'dashboard bobblehead', 'tire swing', 'road cone',
  'turnip', 'muffin', 'noodle', 'meatball', 'sea cucumber', 'traffic jam', 'unpaid toll', 'hand-me-down minivan',
  'parallel parking disaster', 'U-turn enthusiast', 'cone collector', 'lane drifter', 'brake tapper', 'menace',
];

const NAME_PREFIX = ['you', 'you absolute', 'my dear', 'you sweet', 'listen,'];

// Profanity-only flavor.
const X_ADJ = ['damn', 'hot mess of a', 'dumbass', 'half-assed', 'goddamn'];
const X_NOUN = ['jackass', 'dumbass', 'disaster of a driver', 'hot mess', 'clown'];

// Frames by pool. m = Sassy/Snarky (levels 1-2), h = Savage/Unhinged (3-4), x = profanity add-ons.
const FRAMES = {
  prepareQuip: {
    m: ['Take this one better than {sim} would.', "Try not to turn like {sim}. It's a low bar.", 'Signal first, {name}.', 'Easy does it, {name}.', "You've got this. Probably. Unlike {sim}."],
    h: ['Last turn you looked like {sim}. Redemption arc starts now.', 'Do not take this turn like {sim}. I am begging you.', 'Wheel, {name}. The round thing.', "{Name}, I've seen {sim} handle corners better.", 'This is a turn, {name}, not an interpretive dance.', 'Make it clean, {name}. For once.'],
    x: ['Don\'t screw this up, {name}.', 'Turn like a human, not {sim}, damn it.'],
  },
  nowQuip: {
    m: ['Now, {name}.', 'This one, {name}.'],
    h: ['Now, {name}! Now!', 'Turn, {name}. Today.', "Go, {name}, before you become {sim}."],
    x: ['Turn the damn wheel, {name}.', 'Move it, {name}.'],
  },
  continueQuip: {
    m: ['Straight for a while. Even {sim} could manage it.', 'Relax, {name}. I will tell you when.'],
    h: ['Straight road, {name}. Do not turn it into a plot twist.', 'Hold the wheel and try not to drift like {sim}.', "Just straight, {name}. I'll pretend that's hard for you."],
    x: ['Straight. Don\'t find a way to screw it up, {name}.'],
  },
  reroute: {
    m: ['Recalculating. You took that like {sim}.', 'New route, {name}.', 'Recalculating. Missed it like {sim}.'],
    h: ['Recalculating, {name}. You missed that like {sim}.', 'Incredible, {name}. Truly. Recalculating.', 'You turned like {sim}. Recalculating.', 'Recalculating. I want you to know I saw that, {name}.', 'Bold move, {name}. Wrong, but bold. Recalculating.'],
    x: ['What the hell was that, {name}? Recalculating.', 'Recalculating, {name}. Damn.'],
  },
  arrive: {
    m: ['Arrived. Nice work, {name}. Mostly.', 'You made it, {name}.'],
    h: ['You made it, {name}. {Sim} would have been faster, but here we are.', 'Arrived. I have aged, {name}.', 'Destination reached, {name}. Somehow.', 'We are here. I need a nap, {name}.'],
    x: ['We made it, {name}. Holy hell.'],
  },
  idle: {
    m: ['Just checking in, {name}. Still driving like {sim}.', 'You are doing fine, {name}. Ish.', 'Fun fact: {sim} has a better driving record than you. Probably.'],
    h: ['I have watched {sim} with more lane discipline, {name}.', 'Somewhere, {sim} is driving better than you right now.', "Thinking about how I could have been a calculator, {name}. Instead I'm watching you.", 'I like to imagine {sim} taking over. It calms me.', 'Do you ever look at {sim} and think, same?'],
    x: ['Damn, {name}, you drive like {sim}.'],
  },
  stopped: {
    m: ['Parked, {name}? Okay.', 'We stopped. Like {sim}. Peacefully.'],
    h: ['Not moving, {name}. Even {sim} gets somewhere eventually.', 'Stopped again, {name}. Are we living here now?'],
    x: ['Still not moving, {name}. Hell.'],
  },
  overQuip: {
    m: ['Ease off, {name}.', 'Easy, {name}. You are not {sim}.', 'Slow down, {name}. The road will still be there.'],
    h: ['Slow down, {name}. You are driving like {sim} with a deadline.', 'Cool it, {name}. Even {sim} respects speed limits.', 'You are flying like {sim}, {name}. Stop.', 'Slow down, {name}. I refuse to explain this to an insurance adjuster.'],
    x: ['Slow the hell down, {name}.', 'Slow your ass down, {name}.'],
  },
  underQuip: {
    m: ['A little faster, {name}. The limit is right there.', 'We are moving like {sim}.'],
    h: ['Pick it up, {name}. {Sim} is passing us.', 'At this pace, {name}, we arrive next season.', 'You are driving like {sim} on a Sunday, {name}.', 'Speed limit, {name}. Look it up.'],
    x: ['Move it, {name}, damn it.', 'Hit the gas, {name}. Holy crap.'],
  },
  hazardQuip: {
    m: ['Careful, {name}.', 'Eyes up, {name}.'],
    h: ['Try not to hit it like {sim}, {name}.', 'Pay attention, {name}. I know. Rare.', 'Do not become the next report, {name}.'],
    x: ['Watch it, {name}, damn it.'],
  },
  hazardQuip_camera: {
    m: ['Smile, {name}.', 'Camera ahead, {name}. Look normal.'],
    h: ['Slow down, {name}, or that camera takes your picture like {sim}.', 'Camera, {name}. Your face is not ready.'],
    x: ['Slow the hell down, {name}. It takes pictures.'],
  },
  hazardQuip_police: {
    m: ['Be cool, {name}.', 'Act natural, {name}.'],
    h: ['Act natural, {name}. Not like {sim}.', 'Drive like you have nothing to hide, {name}.'],
    x: ['Be cool, {name}. Damn.'],
  },
  hazardQuip_crash: {
    m: ['Careful, {name}.'],
    h: ['Someone drove like {sim}. Learn from it, {name}.', 'Do not rubberneck, {name}.'],
    x: ['Eyes on the damn road, {name}.'],
  },
  hazardQuip_jam: {
    m: ['Traffic, {name}. Patience.'],
    h: ['Traffic, {name}. Finally a speed you can handle.', 'Brake lights ahead, {name}. Brace yourself.'],
    x: ['Traffic, {name}. Shit.'],
  },
  hazardQuip_work: {
    m: ['Merge nicely, {name}.'],
    h: ['Cones ahead, {name}. Your natural enemy.', 'Zipper merge, {name}. Not like {sim}.'],
    x: ['Cones, {name}. Don\'t hit them, damn it.'],
  },
  cmd_insult: {
    m: ['Rude, {name}.', 'Said the person driving like {sim}.'],
    h: ['Says the person driving like {sim}.', 'Big talk from {sim}.', 'I would insult you back, {name}, but your driving already did.'],
    x: ['Shut it, {name}. You drive like {sim}.'],
  },
  reported: {
    m: ['Reported. Good job, {name}.'],
    h: ['Reported. First useful thing today, {name}.', 'Reported, {name}. Look at you, contributing.'],
  },
};

// Destination frames ({place} is a short spoken name for the category).
const PLACE = {
  fastfood: 'the drive-thru', coffee: 'the coffee shop', bar: 'the bar', restaurant: 'dinner', gym: 'the gym',
  superstore: 'the big store', mall: 'the mall', gas: 'the gas station', carwash: 'the car wash', bank: 'the bank',
  government: 'the government office', school: 'school', airport: 'the airport', casino: 'the casino', liquor: 'the liquor store',
  beach: 'the beach', park: 'the park', hotel: 'the hotel', movies: 'the movies', library: 'the library', zoo: 'the zoo',
  dealership: 'the dealership', haircut: 'the barber', work: 'work', police: 'the police station', pin: 'a random pin',
};
const DEST_FRAMES = {
  m: ['Off to {place}, {name}.', 'Going to {place}. Very on brand, {name}.', '{place_cap}. Bold choice, {name}.'],
  h: ['{place_cap}, {name}? Of course.', 'Driving to {place} like {sim}. Love that for you.', 'Ah, {place}. Where people like you go, {name}.', '{place_cap}. I have questions, {name}. I will not ask them.'],
  x: ['{place_cap}? Hell yeah, {name}. Sure.'],
};
const DEST_ARRIVE_FRAMES = {
  m: ['{place_cap}. Enjoy, {name}.', 'Arrived at {place}, {name}.'],
  h: ['{place_cap}, {name}. Try not to park like {sim}.', 'You reached {place}, {name}. Somehow.'],
};

const rnd = (a, r) => a[Math.floor(r() * a.length)];
const capFirst = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function nickname(r, prof) {
  if (prof && r() < 0.35) return `you ${rnd(X_ADJ, r)} ${rnd(X_NOUN, r)}`;
  const pre = rnd(NAME_PREFIX, r);
  return `${pre} ${rnd(ADJ, r)} ${rnd(NOUN, r)}`;
}

function framesFor(pool, level, prof) {
  let set = FRAMES[pool];
  if (!set && pool.startsWith('dest_')) set = DEST_FRAMES;
  if (!set && pool.startsWith('destArrive_')) set = DEST_ARRIVE_FRAMES;
  if (!set) return [];
  let f = level >= 3 ? [...(set.h || []), ...(set.m || [])] : [...(set.m || [])];
  if (prof && level >= 3 && set.x) f = f.concat(set.x);
  return f;
}

export function hasGenerated(pool, level) {
  return level >= 1 && framesFor(pool, level, false).length > 0;
}

export function generate(pool, level, prof, r = Math.random) {
  const frames = framesFor(pool, level, prof);
  if (!frames.length) return '';
  const cat = pool.replace(/^dest(Arrive)?_/, '');
  const place = PLACE[cat] || 'there';
  const frame = rnd(frames, r);
  const sim = rnd(SIMS, r);
  let name = nickname(r, prof && level >= 3);
  // Nicer nicknames at lower levels.
  if (level <= 1) name = name.replace(/^you absolute /, 'you ').replace(/^listen, /, 'friend, ');
  const out = frame
    .replace(/\{sim\}/g, sim)
    .replace(/\{Sim\}/g, capFirst(sim))
    .replace(/\{place_cap\}/g, capFirst(place))
    .replace(/\{place\}/g, place)
    .replace(/\{Name\}/g, capFirst(name))
    .replace(/\{name\}/g, name);
  // "listen, ..." reads oddly mid-sentence; drop the comma form there.
  return out.replace(/, listen, /g, ', you ').replace(/^Listen, (.)/, (m, c) => `Listen, ${c}`);
}

export const GEN_STATS = { sims: SIMS.length, names: NAME_PREFIX.length * ADJ.length * NOUN.length };
