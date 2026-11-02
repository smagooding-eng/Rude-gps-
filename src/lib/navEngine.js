import { nearestOnRoute } from './geo.js';
import { pick, instruction, cap, spokenDistance, spokenDuration, roadLabel, QUIP_CHANCE } from './lines.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const TURNISH = new Set(['turn', 'end of road', 'continue', 'fork', 'off ramp', 'on ramp', 'merge', 'roundabout turn']);

/**
 * Turn-by-turn engine. Feed it positions with update(), call tick() once a
 * second, and it decides what to say and when.
 */
export class NavEngine {
  constructor({ route, destName, getSettings, say, onState, onReroute, onArrive, simulated = false, now = () => Date.now(), random = Math.random }) {
    Object.assign(this, { destName, getSettings, sayFn: say, onState, onReroute, onArrive, simulated, now, random });
    this.speed = 0;
    this.lastSpeechAt = 0;
    this.lastFix = 0;
    this.lastReroute = -Infinity;
    this.lastSpeedWarn = -Infinity;
    this.arrived = false;
    this.cancelled = false;
    this._load(route);
    this._scheduleIdle();
  }

  _load(route) {
    this.route = route;
    this.total = route.cum[route.cum.length - 1] || route.distance;
    this.progress = 0;
    this.offCount = 0;
    this.rerouting = false;
    this._setNext(1, false);
  }

  _setNext(i, announceContinue) {
    this.nextIdx = Math.min(i, this.route.steps.length - 1);
    this.flags = { early: !announceContinue, prepare: false, now: false };
  }

  _s() {
    const s = this.getSettings();
    return { level: s.level, prof: !!s.profanity, units: s.units, chat: s.chattiness };
  }

  _say(text, opts) {
    if (!text || this.cancelled) return;
    this.lastSpeechAt = this.now();
    this.sayFn(text, opts);
  }

  _line(event, vars) {
    const { level, prof } = this._s();
    return pick(event, level, prof, vars);
  }

  _quip(kind) {
    const { level, prof } = this._s();
    const chance = QUIP_CHANCE[kind][level] || 0;
    if (this.random() >= chance) return '';
    return pick(`${kind}Quip`, level, prof);
  }

  _scheduleIdle() {
    const { chat } = this._s();
    const [lo, hi] = chat >= 2 ? [75, 150] : [180, 300];
    this.nextIdleAt = this.now() + (lo + this.random() * (hi - lo)) * 1000;
  }

  start() {
    const r = this.route;
    this._say(this._line('start', { dest: this.destName, eta: spokenDuration(r.duration) }));
    if (r.steps[0]) this._say(`${cap(instruction(r.steps[0]))}.`);
    this.lastFix = this.now();
  }

  setRoute(route, rerouted = false) {
    this._load(route);
    if (rerouted) {
      this._say(this._line('reroute'), { interrupt: true });
      if (route.steps[0]) this._say(`${cap(instruction(route.steps[0]))}.`);
      this.flags.early = false;
    }
  }

  rerouteFailed() {
    this.rerouting = false;
  }

  cancel() {
    if (!this.arrived) this._say(this._line('cancel'), { interrupt: true });
    this.cancelled = true;
  }

  update(pos) {
    if (this.arrived || this.cancelled) return;
    const t = this.now();
    const { units } = this._s();
    this.lastFix = t;
    this.gpsLostWarned = false;
    this.speed = pos.speed ?? this.speed;

    const r = this.route;
    const near = nearestOnRoute(pos.coords, r.coords, r.cum);

    // Off-route detection (ignore junk fixes).
    const limit = clamp((pos.accuracy || 10) * 1.5, 40, 100);
    if (!this.rerouting && (pos.accuracy ?? 0) <= 75 && near.dist > limit) {
      this.offCount += 1;
      if (this.offCount >= (near.dist > 120 ? 2 : 3) && t - this.lastReroute > 10000) {
        this.rerouting = true;
        this.lastReroute = t;
        this.offCount = 0;
        this.onReroute?.(pos.coords);
        return;
      }
    } else if (near.dist <= limit) {
      this.offCount = 0;
    }
    if (this.rerouting) return;

    this.progress = near.along;
    const remaining = Math.max(0, this.total - this.progress);

    if (remaining < 25) {
      this.arrived = true;
      this._say(this._line('arrive', { dest: this.destName }), { interrupt: true });
      this._emit(near, remaining);
      this.onArrive?.();
      return;
    }

    // Advance past maneuvers we've driven through.
    const steps = r.steps;
    while (this.nextIdx < steps.length - 1 && steps[this.nextIdx].along <= this.progress + 3) {
      this._setNext(this.nextIdx + 1, true);
    }

    const step = steps[this.nextIdx];
    const d = step.along - this.progress;
    const prepareDist = clamp(this.speed * 20, 200, 1200);
    const nowDist = clamp(this.speed * 4, 25, 120);
    const after = steps[this.nextIdx + 1];
    const then = after && after.type !== 'arrive' && after.along - step.along < 150 ? ` Then ${instruction(after)}.` : '';

    if (!this.flags.early) {
      this.flags.early = true;
      if (d > Math.max(1500, prepareDist * 2.5)) {
        const prev = steps[this.nextIdx - 1];
        const road = prev && (prev.name || prev.ref) ? ` on ${prev.name || prev.ref}` : '';
        const q = this._quip('continue');
        this._say(`Continue${road} for ${spokenDistance(d, units)}.${q ? ` ${q}` : ''}`);
      }
    }

    if (!this.flags.prepare && d <= prepareDist && d > nowDist + 20) {
      this.flags.prepare = true;
      const q = step.type === 'arrive' ? '' : this._quip('prepare');
      this._say(`In ${spokenDistance(d, units)}, ${instruction(step)}.${then}${q ? ` ${q}` : ''}`);
    }

    if (!this.flags.now && d <= nowDist && step.type !== 'arrive') {
      this.flags.now = true;
      this.flags.prepare = true;
      const nowWord = TURNISH.has(step.type) && step.modifier !== 'straight' ? ' now' : '';
      const q = this._quip('now');
      this._say(`${cap(instruction(step))}${nowWord}.${then}${q ? ` ${q}` : ''}`, { interrupt: true });
    }

    // Speeding nag (real GPS only). ~80 mph / 129 km/h.
    if (!this.simulated && this.speed > 35.8 && t - this.lastSpeedWarn > 180000) {
      this.lastSpeedWarn = t;
      this._say(this._line('speeding'));
    }

    this._lastPrepareDist = prepareDist;
    this._distToNext = d;
    this._emit(near, remaining);
  }

  tick() {
    if (this.arrived || this.cancelled || this.rerouting) return;
    const t = this.now();
    const { level, chat } = this._s();

    if (!this.simulated && t - this.lastFix > 15000 && !this.gpsLostWarned) {
      this.gpsLostWarned = true;
      this._say(this._line('gpsLost'));
    }

    const remaining = this.total - this.progress;
    if (this.speed < 0.8) {
      this.stoppedSince ??= t;
      if (!this.stoppedWarned && level >= 1 && t - this.stoppedSince > 75000 && remaining > 150) {
        this.stoppedWarned = true;
        this._say(this._line('stopped'));
      }
    } else {
      this.stoppedSince = null;
      this.stoppedWarned = false;
    }

    if (
      level >= 1 && chat > 0 && t >= this.nextIdleAt && t - this.lastSpeechAt > 30000 &&
      this.speed > 3 && (this._distToNext ?? 0) > (this._lastPrepareDist ?? 200) + 400
    ) {
      this._say(this._line('idle'));
      this._scheduleIdle();
    }
  }

  _emit(near, remaining) {
    const r = this.route;
    const step = r.steps[this.nextIdx];
    const prev = r.steps[this.nextIdx - 1];
    const after = r.steps[this.nextIdx + 1];
    const remainingTime = r.duration * (remaining / (this.total || 1));
    this.onState?.({
      step,
      then: after && after.type !== 'arrive' && after.along - step.along < 150 ? after : null,
      distToNext: Math.max(0, step.along - this.progress),
      currentRoad: roadLabel(prev),
      remaining,
      remainingTime,
      eta: new Date(this.now() + remainingTime * 1000),
      routeBearing: near.bearing,
      progress: this.progress,
    });
  }
}
