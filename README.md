# Rude GPS

Turn-by-turn directions with a terrible attitude. Installable PWA built with React + Vite, OpenStreetMap maps, free routing, and the browser's built-in voice.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # drives a fake car through a route and checks what gets said
```

On a laptop, search a destination (or tap the map), then hit **Demo drive**. The fake car drives the route at 1×/2×/4×, and **Miss a turn** sends it off-route so you can hear the reroute roasts. If the browser blocks location, tap the map once to set a start point.

Real GPS on a phone needs HTTPS, so test live driving from the deployed site.

## Deploy

**GitHub Pages (automatic):** every push to `main` builds, tests and publishes to `https://smagooding-eng.github.io/RudeGPS/` via `.github/workflows/pages.yml`. If the first run fails at the Pages step, set Settings → Pages → Source to **GitHub Actions** and re-run.

### Render (alternative, free static site)

`render.yaml` is included. In Render: **New → Blueprint**, pick this repo, done. Or create a Static Site with build command `npm install && npm run build` and publish directory `dist`.

## How it works

| File | Job |
| --- | --- |
| `src/lib/navEngine.js` | Turn-by-turn brain: snaps you to the route, decides when to speak (early / prepare / now), detects off-route, arrival, stopped, speeding, GPS loss, idle chatter |
| `src/lib/lines.js` | Every spoken line, the 5 rudeness levels, profanity pools, instruction wording, distance phrasing |
| `src/lib/routing.js` | OSRM route fetch + parsing |
| `src/lib/geocode.js` | Photon place search |
| `src/lib/simulator.js` | Demo drive |
| `src/lib/voice.js` | Web Speech wrapper |
| `src/components/*` | Map, search, nav banner/footer, settings sheet |

Rule baked into the engine: the plain instruction is always spoken first. The insult comes after it, never instead of it.

**Rudeness levels:** Nice, Sassy, Snarky, Savage, Unhinged. Profanity is off by default and only adds lines at Savage and Unhinged. Add or edit lines in `POOLS` in `src/lib/lines.js`.

## Before a real launch

- **Routing:** `router.project-osrm.org` is a demo server with no uptime promise and a light-use policy. Swap `OSRM` in `routing.js` for a self-hosted OSRM/Valhalla or a hosted API (OpenRouteService, Stadia, Mapbox).
- **Search:** `photon.komoot.io` is a shared public instance. Self-host Photon or use a paid geocoder at scale.
- **Tiles:** OpenFreeMap is free with no key and allows commercial use; keep the attribution.
- **iOS:** web apps can't navigate with the screen locked. The app holds a wake lock to keep the screen on while navigating. Background navigation would need a native wrapper (Capacitor).
- **Voices:** quality depends on the device's installed voices. Premium custom voices would mean pre-recorded audio or a TTS API.
