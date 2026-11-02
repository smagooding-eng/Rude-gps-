import { nearestOnRoute, segmentAt } from './geo.js';
import { pick, instruction, cap, spokenDistance, spokenDuration, roadLabel, QUIP_CHANCE, hazardSentence, hazardQuip, speedSentence, LEVELS } from './lines.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const TURNISH = new Set(['turn', 'end of road', 'continue', 'fork', 'off ramp', 'on ramp', 'merge', 'roundabout turn']);

/**
 * Turn-by-turn engine. Feed it positions with update(), call tick() once a
 * second, and it decides what to say and when.
 */
export class NavEngine {
  constructor({ route, destName, destCategory = 'other', getSettings, say, prefetch, onState, onReroute, onArrive, onLevel, onReport, onVote, onAskConfirm, simulated = false, now = () => Date.now(), random = Math.random }) {
    Object.assign(this, { destName, destCategory, getSettings, sayFn: say, prefetchFn: prefetch, onState, onReroute, onArrive, onLevel, onReport, onVote, onAskConfirm, simulated, now, random });
    this.ownReports = new Set();
    this.asked = new Set();
    this.quiet = false;
    this.lastInstruction = '';
    this.passedHazards = new Set();
    this.speedState = { overSince: null, underSince: null, lastOver: -Infinity, lastUnder: -Infinity };
    this.startedAt = now();
    this.speed = 0;
    this.lastSpeechAt = 0;
    this.lastFix = 0;
    this.lastReroute = -Infinity;
    this.lastSpeedWarn = -Infinity;
    this.arrived = false;
    this.cancelled = false;
    this.hazards = [];
    this.warnedHazards = new Set();
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
    // "Shut up" mode: directions only.
    if (this.quiet) return { level: 0, prof: false, units: s.units, chat: 0, realLevel: s.level };
    return { level: s.level, prof: !!s.profanity, units: s.units, chat: s.chattiness, realLevel: s.level };
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

  _destLine(kind) {
    const { level, prof } = this._s();
    if (level === 0) return '';
    return pick(`${kind}_${this.destCategory}`, level, prof, { dest: this.destName });
  }

  _instr(text, opts) {
    this.lastInstruction = text;
    this._say(text, opts);
  }

  _scheduleIdle() {
    const { chat } = this._s();
    const [lo, hi] = chat >= 2 ? [75, 150] : [180, 300];
    this.nextIdleAt = this.now() + (lo + this.random() * (hi - lo)) * 1000;
  }

  start() {
    const r = this.route;
    this._say(this._line('start', { dest: this.destName, eta: spokenDuration(r.duration) }));
    const dj = this._destLine('dest');
    if (dj) this._say(dj);
    if (r.steps[0]) this._instr(`${cap(instruction(r.steps[0]))}.`);
    this.lastFix = this.now();
  }

  setRoute(route, rerouted = false) {
    this._load(route);
    if (rerouted) {
      this._say(this._line('reroute'), { interrupt: true });
      if (route.steps[0]) this._instr(`${cap(instruction(route.steps[0]))}.`);
      this.flags.early = false;
    }
  }

  // Hazards must already be projected onto the current route (have .along).
  setHazards(list) {
    this.hazards = list || [];
  }

  _checkHazards(units, level, prof) {
    for (const h of this.hazards) {
      if (this.warnedHazards.has(h.id) || this.ownReports.has(h.reportId)) continue;
      const d = h.along - this.progress;
      if (d < 0) continue;
      const isCam = h.kind === 'camera' || h.kind === 'redlight';
      const warn = isCam ? clamp(this.speed * 25, 300, 1000) : clamp(this.speed * 35, 400, 1600);
      if (d > warn) break; // sorted by along: nothing closer remains
      this.warnedHazards.add(h.id);
      if (d < 40) continue; // too late to be useful
      if (level === 0 && h.kind === 'jam') continue;
      const chance = QUIP_CHANCE.hazard[level] || 0;
      const q = this.random() < chance ? hazardQuip(h.kind, level, prof) : '';
      this._say(`${hazardSentence(h, spokenDistance(d, units))}${q ? ` ${q}` : ''}`);
      return; // one per update
    }
    // Ask other drivers' reports "still there?" once we've driven past.
    for (const h of this.hazards) {
      if (h.along > this.progress) break;
      if (h.source !== 'Drivers' || this.asked.has(h.id) || this.ownReports.has(h.reportId)) continue;
      const past = this.progress - h.along;
      if (past < 60) continue;
      this.asked.add(h.id);
      if (past > 400) continue;
      this.onAskConfirm?.(h);
      this._say(pick('askConfirm', level, prof) || pick('askConfirm', 0, false));
      return;
    }
    // A parting shot once a camera or crash is behind us.
    if (level >= 2) {
      for (const h of this.hazards) {
        if (h.along > this.progress) break;
        if (this.passedHazards.has(h.id) || !this.warnedHazards.has(h.id) || this.progress - h.along < 120) continue;
        this.passedHazards.add(h.id);
        if (this.progress - h.along > 600 || this.random() > 0.6) continue;
        const pool = h.kind === 'camera' || h.kind === 'redlight' ? 'hazardPassed_camera' : 'hazardPassed';
        const line = pick(pool, level, prof);
        if (line) this._say(line);
        return;
      }
    }
  }

  // Posted limit at the current position (m/s) or null.
  limitAt(progress = this.progress) {
    const ms = this.route.maxspeed;
    if (!ms) return null;
    return ms[segmentAt(this.route.cum, progress)] ?? null;
  }

  _checkSpeed(t) {
    const { level, prof, units } = this._s();
    const lim = this.limitAt();
    const st = this.speedState;
    if (!lim) {
      // No posted limit known: keep the old 80 mph / 129 km/h nag (real GPS only).
      if (!this.simulated && this.speed > 35.8 && t - this.lastSpeedWarn > 180000) {
        this.lastSpeedWarn = t;
        this._say(this._line('speeding'));
      }
      st.overSince = st.underSince = null;
      return;
    }
    const over = this.speed - lim > Math.max(4, lim * 0.15);
    const under = lim >= 11 && this.speed > 1.5 && lim - this.speed > Math.max(5.4, lim * 0.35);
    st.overSince = over ? st.overSince ?? t : null;
    st.underSince = under ? st.underSince ?? t : null;

    if (over && t - st.overSince > 6000 && t - st.lastOver > 60000) {
      st.lastOver = t;
      const q = level >= 1 ? pick('overQuip', level, prof) : '';
      this._say(`${speedSentence(this.speed, lim, units)}${q ? ` ${q}` : ''}`);
      return;
    }
    const busy = (this._distToNext ?? Infinity) < 300 || t - this.startedAt < 30000 ||
      this.hazards.some((h) => h.kind === 'jam' && h.along > this.progress && h.along - this.progress < 1500);
    if (under && level >= 1 && !busy && t - st.underSince > 12000 && t - st.lastUnder > 90000) {
      st.lastUnder = t;
      this._say(`${speedSentence(this.speed, lim, units)} ${pick('underQuip', level, prof)}`);
    }
  }

  // Voice commands from the listener.
  command(name) {
    const s = this.getSettings();
    const level = s.level;
    const prof = !!s.profanity;
    const say = (pool, lvl = level) => this._say(pick(pool, lvl, prof) || pick(pool, 2, false), { interrupt: true });
    switch (name) {
      case 'quiet':
        say('cmd_quiet');
        this.quiet = true;
        break;
      case 'talk':
        this.quiet = false;
        say('cmd_talk');
        break;
      case 'nicer': {
        const next = Math.max(0, level - 1);
        this.quiet = false;
        say('cmd_nicer', Math.max(1, level));
        this.onLevel?.(next);
        break;
      }
      case 'meaner': {
        const next = Math.min(LEVELS.length - 1, level + 1);
        this.quiet = false;
        this.onLevel?.(next);
        say('cmd_meaner', next);
        break;
      }
      case 'vote_yes':
      case 'vote_no':
        this.onVote?.(name === 'vote_yes');
        break;
      case 'repeat':
        if (this.lastInstruction) this._say(this.lastInstruction, { interrupt: true });
        break;
      case 'eta': {
        const rem = Math.max(0, this.total - this.progress);
        const tt = this.route.duration * (rem / (this.total || 1));
        const base = `About ${spokenDuration(tt)} left. ${spokenDistance(rem, s.units)} to go.`;
        const q = !this.quiet && level >= 2 ? (level >= 3 ? ' Stop asking.' : ' Patience.') : '';
        this._say(`${level >= 1 && !this.quiet ? 'No. ' : ''}${base}${q}`, { interrupt: true });
        break;
      }
      case 'lost':
        say('cmd_lost', this.quiet ? 0 : level);
        if (this.lastInstruction) this._say(this.lastInstruction);
        break;
      default:
        if (name.startsWith('report_')) {
          this.onReport?.(name.slice(7));
          break;
        }
        say(`cmd_${name}`, this.quiet ? 0 : level);
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
      const da = this.random() < 0.7 ? this._destLine('destArrive') : '';
      this._say(da || this._line('arrive', { dest: this.destName }), { interrupt: true });
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
        this._instr(`Continue${road} for ${spokenDistance(d, units)}.`);
        if (q) this._say(q);
      }
    }

    if (!this.flags.prepare && d <= prepareDist && d > nowDist + 20) {
      this.flags.prepare = true;
      const q = step.type === 'arrive' ? '' : this._quip('prepare');
      this._instr(`In ${spokenDistance(d, units)}, ${instruction(step)}.${then}`);
      if (q) this._say(q);
      if (step.type !== 'arrive') this.prefetchFn?.(this._nowText(step, then));
    }

    if (!this.flags.now && d <= nowDist && step.type !== 'arrive') {
      this.flags.now = true;
      this.flags.prepare = true;
      const q = this._quip('now');
      this._instr(this._nowText(step, then), { interrupt: true });
      if (q) this._say(q);
    }

    const sNow = this._s();
    this._checkHazards(units, sNow.level, sNow.prof);
    this._checkSpeed(t);

    this._lastPrepareDist = prepareDist;
    this._distToNext = d;
    this._emit(near, remaining);
  }

  _nowText(step, then) {
    const nowWord = TURNISH.has(step.type) && step.modifier !== 'straight' ? ' now' : '';
    return `${cap(instruction(step))}${nowWord}.${then}`;
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
      const dj = this.random() < 0.35 ? this._destLine('dest') : '';
      this._say(dj || this._line('idle'));
      this._scheduleIdle();
    }
  }

  _emit(near, remaining) {
    const r = this.route;
    const step = r.steps[this.nextIdx];
    const prev = r.steps[this.nextIdx - 1];
    const after = r.steps[this.nextIdx + 1];
    const remainingTime = r.duration * (remaining / (this.total || 1));
    const nh = this.hazards.find((h) => h.along > this.progress);
    const hazardAhead = nh && nh.along - this.progress < 3000 ? { ...nh, dist: nh.along - this.progress } : null;
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
      hazardAhead,
      limit: this.limitAt(),
      speed: this.speed,
      quiet: this.quiet,
    });
  }
}
