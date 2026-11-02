import { nearestOnRoute, pointAlong, offset } from './geo.js';

// Fake "drive" along a route so you can test from the couch.
export class Simulator {
  constructor(onPosition, onDone) {
    this.onPosition = onPosition;
    this.onDone = onDone;
    this.timer = null;
    this.mult = 1;
  }

  start(route, mult = 1) {
    this.mult = mult;
    this.setRoute(route);
    this.d = 0;
    this.stop();
    this.timer = setInterval(() => this._step(), 1000);
    this._emit(pointAlong(route.coords, route.cum, 0));
  }

  setRoute(route, fromCoords) {
    this.route = route;
    this.total = route.cum[route.cum.length - 1];
    // Average speed of the route, kept within sane city/highway bounds.
    this.speed = Math.max(9, Math.min(29, route.distance / Math.max(1, route.duration)));
    this.detour = null;
    this.d = fromCoords ? nearestOnRoute(fromCoords, route.coords, route.cum).along : 0;
  }

  setMultiplier(m) {
    this.mult = m;
  }

  // Drive off at an angle until the engine reroutes us.
  missTurn() {
    if (!this.last) return;
    this.detour = { pos: this.last.coords, bearing: (this.last.heading + 75) % 360 };
  }

  _step() {
    const move = this.speed * this.mult;
    if (this.detour) {
      this.detour.pos = offset(this.detour.pos, this.detour.bearing, move);
      this._emit({ coords: this.detour.pos, bearing: this.detour.bearing });
      return;
    }
    this.d = Math.min(this.total, this.d + move);
    this._emit(pointAlong(this.route.coords, this.route.cum, this.d));
    if (this.d >= this.total) {
      this.stop();
      this.onDone?.();
    }
  }

  _emit(p) {
    this.last = { coords: p.coords, heading: p.bearing, speed: this.speed * this.mult, accuracy: 5, timestamp: Date.now() };
    this.onPosition(this.last);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }
}
