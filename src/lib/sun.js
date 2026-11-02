// Is the sun up? Solar elevation from date + position (NOAA approximation).
const rad = Math.PI / 180;

export function sunElevation(date, lat, lon) {
  const ms = date.getTime();
  const jd = ms / 86400000 + 2440587.5;
  const n = jd - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * rad;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;
  const eps = (23.439 - 0.0000004 * n) * rad;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
  const ra = Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda));
  const gmst = (18.697374558 + 24.06570982441908 * n) % 24;
  const lst = (gmst * 15 + lon) * rad;
  const ha = lst - ra;
  const el = Math.asin(Math.sin(lat * rad) * Math.sin(dec) + Math.cos(lat * rad) * Math.cos(dec) * Math.cos(ha));
  return el / rad;
}

// Day map from just before sunrise to just after sunset. Without a location, 7am–7pm local.
export function isDaytime(date = new Date(), coords = null) {
  if (coords) return sunElevation(date, coords[1], coords[0]) > -3;
  const h = date.getHours();
  return h >= 7 && h < 19;
}
