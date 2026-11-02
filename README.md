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

**GitHub Pages (automatic):** every push to `main` builds, tests and publishes to `https://smagooding-eng.github.io/Rude-gps-/` via `.github/workflows/pages.yml`. If the first run fails at the Pages step, set Settings → Pages → Source to **GitHub Actions** and re-run.

### Render (alternative, free static site)

`render.yaml` is included. In Render: **New → Blueprint**, pick this repo, done. Or create a Static Site with build command `npm install && npm run build` and publish directory `dist`.

## Features

- **Roasts with directions:** 5 rudeness levels, optional profanity. The plain instruction always comes first.
- **Speed roasts:** uses OpenStreetMap speed limits from the route (OSRM `maxspeed` annotations). Well over the limit or crawling well under it gets called out with the actual numbers. Falls back to the old 80 mph nag where no limit is mapped.
- **Destination jokes:** fast food, coffee, bars, gym, DMV, airport, work and ~20 more categories. Hospitals, funeral homes, cemeteries and places of worship switch the GPS to plain directions for that trip.
- **Hazard alerts:** speed and red-light cameras from OpenStreetMap (free, no key) plus crashes, closures, road work, hazards and heavy traffic from TomTom (free key, 2,500 lookups/month). Each warning comes with a roast, and some get a follow-up once you pass.
- **Talk back:** tap the mic and say "shut up", "talk to me", "repeat that", "are we there yet", "be nicer", "roast me" and a few more. Uses the browser's speech recognition.
- **Voices:** auto-picks the best installed phone voice, or an "AI actor" (OpenAI `gpt-4o-mini-tts`) with acting directions per rudeness level, using the user's own key stored on-device. Falls back to the phone voice if a clip is slow.
- **Map looks:** Night and Day restyles of OpenFreeMap with 3D buildings, sky, and a glowing route. Classic styles are still available.

Waze and Google Maps police reports aren't available to third-party apps (Waze's feed is limited to government partners, and Google has no API for user reports), so they're not used.

## How it works

| File | Job |
| --- | --- |
| `src/lib/navEngine.js` | Turn-by-turn brain: snaps you to the route, decides when to speak (early / prepare / now), detects off-route, arrival, stopped, speeding, GPS loss, idle chatter |
| `src/lib/lines.js` | Every spoken line, the 5 rudeness levels, profanity pools, instruction wording, distance phrasing |
| `src/lib/extraLines.js` | Speed, destination, hazard follow-up and voice-command lines |
| `src/lib/hazards.js` | TomTom incidents + OSM cameras, filtered to the route and direction of travel |
| `src/lib/listener.js` | Voice commands |
| `src/lib/mapTheme.js` | Night/Day map restyle |
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
