import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapView from './components/MapView.jsx';
import SearchBar from './components/SearchBar.jsx';
import SettingsSheet from './components/SettingsSheet.jsx';
import { NavBanner, NavFooter, HazardChip, SpeedSign } from './components/NavPanel.jsx';
import { loadHazards } from './lib/hazards.js';
import { Listener, listenSupported } from './lib/listener.js';
import { RESPECT_CATEGORIES } from './lib/extraLines.js';
import { fetchRoute } from './lib/routing.js';
import { NavEngine } from './lib/navEngine.js';
import { Simulator } from './lib/simulator.js';
import { voice } from './lib/voice.js';
import { bearing, distance, pointAlong } from './lib/geo.js';
import { LEVELS, pick, displayDistance, displayDuration, spokenDuration, spokenDistance } from './lib/lines.js';
import { useSettings, load, save } from './lib/settings.js';

const ONBOARD_KEY = 'rudegps.onboarded.v1';

function useSystemDark() {
  const [q] = useState(() => (typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null));
  const [dark, setDark] = useState(q?.matches ?? false);
  useEffect(() => {
    if (!q) return undefined;
    const fn = (e) => setDark(e.matches);
    q.addEventListener('change', fn);
    return () => q.removeEventListener('change', fn);
  }, [q]);
  return dark;
}

export default function App() {
  const [settings, update] = useSettings();
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [onboarded, setOnboarded] = useState(() => load(ONBOARD_KEY, false));
  const [gps, setGps] = useState(null);
  const [gpsError, setGpsError] = useState('');
  const [manualStart, setManualStart] = useState(null);
  const [simPos, setSimPos] = useState(null);
  const [dest, setDest] = useState(null);
  const [route, setRoute] = useState(null);
  const [phase, setPhase] = useState('browse'); // browse | preview | nav | arrived
  const [nav, setNav] = useState(null);
  const [demo, setDemo] = useState(false);
  const [follow, setFollow] = useState(true);
  const [caption, setCaption] = useState(null);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previewQuip, setPreviewQuip] = useState('');
  const [hazards, setHazards] = useState([]);
  const [listen, setListen] = useState('off');
  const [demoMode, setDemoMode] = useState('normal');
  const listenerRef = useRef(null);
  const hazardTimer = useRef(null);
  const hazardCtrl = useRef(null);
  const routeRef = useRef(null);
  routeRef.current = route;

  const engineRef = useRef(null);
  const simRef = useRef(null);
  const demoRef = useRef(false);
  const destRef = useRef(null);
  const tickRef = useRef(null);
  const wakeRef = useRef(null);
  const prevFix = useRef(null);
  const planCtrl = useRef(null);
  destRef.current = dest;

  const systemDark = useSystemDark();
  const theme = settings.mapTheme === 'auto' ? (systemDark ? 'night' : 'day') : settings.mapTheme;

  // Hospitals, funerals, places of worship: the GPS drops the act for the trip.
  const respectful = !!dest && RESPECT_CATEGORIES.has(dest.category);
  const respectRef = useRef(false);
  respectRef.current = respectful;
  const effLevel = respectful ? 0 : settings.level;

  useEffect(() => {
    voice.configure({
      voiceURI: settings.voiceURI,
      rate: settings.rate,
      muted: settings.muted,
      engine: settings.voiceEngine,
      aiKey: settings.aiKey,
      aiVoice: settings.aiVoice,
      level: effLevel,
      onAiError: (msg) => setToast(`${msg} Using the phone voice for now.`),
    });
  }, [settings.voiceURI, settings.rate, settings.muted, settings.voiceEngine, settings.aiKey, settings.aiVoice, effLevel]);

  // What the engine sees: the real settings, with the level forced to Nice on respectful trips.
  const engineSettings = useCallback(() => {
    const s = settingsRef.current;
    return respectRef.current ? { ...s, level: 0, profanity: false } : s;
  }, []);

  /* ---------- Speech + captions ---------- */
  const speak = useCallback((text, opts) => {
    voice.speak(text, opts);
    setCaption({ text, id: Date.now() + Math.random() });
  }, []);

  useEffect(() => {
    if (!caption) return undefined;
    const t = setTimeout(() => setCaption(null), Math.min(14000, 4000 + caption.text.length * 60));
    return () => clearTimeout(t);
  }, [caption]);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(''), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  /* ---------- Real GPS ---------- */
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('No GPS in this browser. Tap the map to set a start point.');
      return undefined;
    }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        const coords = [p.coords.longitude, p.coords.latitude];
        const prev = prevFix.current;
        let heading = Number.isFinite(p.coords.heading) ? p.coords.heading : null;
        let speed = Number.isFinite(p.coords.speed) ? p.coords.speed : null;
        if (prev) {
          const moved = distance(prev.coords, coords);
          const dt = (p.timestamp - prev.timestamp) / 1000;
          if (heading == null) heading = moved > 4 ? bearing(prev.coords, coords) : prev.heading;
          if (speed == null && dt > 0) speed = moved / dt;
        }
        const fix = { coords, accuracy: p.coords.accuracy, speed: speed ?? 0, heading, timestamp: p.timestamp };
        prevFix.current = fix;
        setGps(fix);
        setGpsError('');
        if (engineRef.current && !demoRef.current) engineRef.current.update(fix);
      },
      (err) => {
        setGpsError(err.code === 1 ? 'Location is blocked. Tap the map to set a start point.' : "Can't get a GPS fix yet.");
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  /* ---------- Wake lock ---------- */
  const acquireWake = useCallback(async () => {
    try {
      wakeRef.current = await navigator.wakeLock?.request('screen');
    } catch {
      /* not supported or denied */
    }
  }, []);
  const releaseWake = useCallback(() => {
    wakeRef.current?.release?.().catch(() => {});
    wakeRef.current = null;
  }, []);
  useEffect(() => {
    const fn = () => {
      if (document.visibilityState === 'visible' && phase === 'nav') acquireWake();
    };
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, [phase, acquireWake]);

  /* ---------- Hazards ---------- */
  const refreshHazards = useCallback(async (r) => {
    const s = settingsRef.current;
    if (!r || (!s.tomtomKey && !s.cameras)) {
      setHazards([]);
      engineRef.current?.setHazards([]);
      return;
    }
    hazardCtrl.current?.abort();
    const ctrl = new AbortController();
    hazardCtrl.current = ctrl;
    try {
      const { hazards: list, errors } = await loadHazards(r, { tomtomKey: s.tomtomKey, cameras: s.cameras }, ctrl.signal);
      if (ctrl.signal.aborted || routeRef.current !== r) return;
      setHazards(list);
      engineRef.current?.setHazards(list);
      if (errors.length) setToast(errors[0]);
    } catch {
      /* network hiccup: keep the old list */
    }
  }, []);

  /* ---------- Planning ---------- */
  const startPoint = gps?.coords || manualStart;

  const plan = useCallback(
    async (place) => {
      setDest(place);
      const from = gps?.coords || manualStart;
      if (!from) {
        setToast('I need a starting point. Allow location, or tap the map.');
        return;
      }
      planCtrl.current?.abort();
      const ctrl = new AbortController();
      planCtrl.current = ctrl;
      setPhase('preview');
      setRoute(null);
      setLoading(true);
      try {
        const r = await fetchRoute(from, place.coords, ctrl.signal);
        setRoute(r);
        routeRef.current = r;
        refreshHazards(r);
        const s = settingsRef.current;
        const respect = RESPECT_CATEGORIES.has(place.category);
        setPreviewQuip(
          s.level === 0 || respect ? '' : pick('preview', s.level, s.profanity, { eta: spokenDuration(r.duration), dist: spokenDistance(r.distance, s.units) }),
        );
      } catch (e) {
        if (e.name === 'AbortError') return;
        setToast(e.message || 'Routing failed.');
        setPhase('browse');
      } finally {
        if (planCtrl.current === ctrl) setLoading(false);
      }
    },
    [gps, manualStart, refreshHazards],
  );

  const onMapClick = useCallback(
    (coords) => {
      if (phase === 'nav' || phase === 'arrived') return;
      if (!gps && !manualStart) {
        setManualStart(coords);
        setToast('Start set. Now search or tap the map for a destination.');
        return;
      }
      plan({ id: `pin-${coords.join()}`, name: 'Dropped pin', label: `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}`, coords, category: 'pin' });
    },
    [phase, gps, manualStart, plan],
  );

  const clearTrip = useCallback(() => {
    planCtrl.current?.abort();
    setDest(null);
    setRoute(null);
    setPhase('browse');
    setPreviewQuip('');
    setLoading(false);
    hazardCtrl.current?.abort();
    setHazards([]);
  }, []);

  /* ---------- Navigation ---------- */
  const stopRunning = useCallback(() => {
    simRef.current?.stop();
    simRef.current = null;
    clearInterval(tickRef.current);
    tickRef.current = null;
    clearInterval(hazardTimer.current);
    hazardTimer.current = null;
    listenerRef.current?.stop();
    releaseWake();
  }, [releaseWake]);

  const handleReroute = useCallback(async (from) => {
    const d = destRef.current;
    if (!d) return;
    try {
      const r = await fetchRoute(from, d.coords);
      if (!engineRef.current) return;
      setRoute(r);
      routeRef.current = r;
      engineRef.current.setRoute(r, true);
      simRef.current?.setRoute(r, from);
      refreshHazards(r);
    } catch {
      engineRef.current?.rerouteFailed();
      setToast("Couldn't reroute. I'll try again in a few seconds.");
    }
  }, [refreshHazards]);

  const handleArrive = useCallback(() => {
    stopRunning();
    setPhase('arrived');
  }, [stopRunning]);

  const startNav = useCallback(
    (isDemo) => {
      if (!route || !dest) return;
      voice.unlock();
      const destName = dest.name === 'Dropped pin' ? 'your pin' : dest.name;
      const eng = new NavEngine({
        route,
        destName,
        destCategory: dest.category || 'other',
        getSettings: engineSettings,
        say: speak,
        prefetch: (t) => voice.prefetch(t),
        onLevel: (lvl) => {
          update({ level: lvl });
          setToast(`Rudeness: ${LEVELS[lvl].name}`);
        },
        onState: setNav,
        onReroute: handleReroute,
        onArrive: handleArrive,
        simulated: isDemo,
      });
      engineRef.current = eng;
      demoRef.current = isDemo;
      setDemo(isDemo);
      setNav(null);
      setFollow(true);
      setPhase('nav');
      eng.setHazards(hazards);
      eng.start();
      if (respectRef.current) setToast('No jokes on this trip. Drive safe.');
      if (settingsRef.current.tomtomKey) {
        hazardTimer.current = setInterval(() => refreshHazards(routeRef.current), 5 * 60 * 1000);
      }
      if (isDemo) {
        const sim = new Simulator((pos) => {
          setSimPos(pos);
          engineRef.current?.update(pos);
        });
        simRef.current = sim;
        sim.setMode(demoMode);
        sim.start(route, settingsRef.current.demoMult);
      } else if (gps) {
        eng.update(gps);
      }
      tickRef.current = setInterval(() => engineRef.current?.tick(), 1000);
      acquireWake();
    },
    [route, dest, gps, speak, handleReroute, handleArrive, acquireWake, engineSettings, hazards, refreshHazards, update, demoMode],
  );

  const toggleMic = useCallback(() => {
    if (listenerRef.current?.on) {
      listenerRef.current.stop();
      return;
    }
    voice.unlock();
    listenerRef.current = new Listener({
      onCommand: (cmd) => engineRef.current?.command(cmd),
      onState: (st) => {
        setListen(st);
        if (st === 'denied') setToast('Microphone is blocked. Allow it in your browser settings to talk back.');
      },
      isSpeaking: () => voice.speaking,
    });
    listenerRef.current.start();
  }, []);

  const endNav = useCallback(() => {
    engineRef.current?.cancel();
    engineRef.current = null;
    demoRef.current = false;
    stopRunning();
    setDemo(false);
    setSimPos(null);
    setNav(null);
    setFollow(true);
    clearTrip();
  }, [stopRunning, clearTrip]);

  const finishArrived = useCallback(() => {
    engineRef.current = null;
    demoRef.current = false;
    setDemo(false);
    setSimPos(null);
    setNav(null);
    setFollow(true);
    clearTrip();
  }, [clearTrip]);

  useEffect(() => () => stopRunning(), [stopRunning]);

  /* ---------- Derived view state ---------- */
  const position = demo ? simPos : gps || (manualStart ? { coords: manualStart, heading: null, speed: 0 } : null);
  const heading = phase === 'nav' && nav && (demo || (position?.speed ?? 0) > 2) ? nav.routeBearing : position?.heading ?? null;

  const traveled = useMemo(() => {
    if (phase !== 'nav' || !route || !nav) return null;
    const out = [];
    for (let i = 0; i < route.coords.length && route.cum[i] <= nav.progress; i++) out.push(route.coords[i]);
    out.push(pointAlong(route.coords, route.cum, nav.progress).coords);
    return out;
  }, [phase, route, nav]);

  const cycleLevel = () => {
    const next = (settings.level + 1) % LEVELS.length;
    update({ level: next });
    setToast(`Rudeness: ${LEVELS[next].name}`);
  };

  /* ---------- Render ---------- */
  return (
    <div className={`app theme-${theme}`}>
      <MapView
        theme={theme}
        position={position}
        heading={heading}
        route={route}
        traveled={traveled}
        destination={dest}
        hazards={phase === 'nav' || phase === 'preview' ? hazards : []}
        manualStart={gps ? null : manualStart}
        mode={phase === 'arrived' ? 'nav' : phase}
        follow={follow}
        onMapClick={onMapClick}
        onUserGesture={() => setFollow(false)}
      />

      {(phase === 'browse' || phase === 'preview') && (
        <div className="top">
          <SearchBar near={startPoint} onSelect={plan} onSettings={() => setShowSettings(true)} value={dest?.name !== 'Dropped pin' ? dest?.name : ''} onClear={clearTrip} />
          {phase === 'browse' && !dest && (
            <div className="hint-pill">
              {gpsError && !manualStart
                ? gpsError
                : !gps && !manualStart
                  ? 'Finding you… or tap the map to set a start.'
                  : 'Search, or tap the map to drop a destination.'}
            </div>
          )}
        </div>
      )}

      {phase === 'nav' && (
        <div className="top">
          <NavBanner nav={nav} units={settings.units} />
          <div className="top-row">
            <SpeedSign nav={nav} units={settings.units} />
            <HazardChip hazard={nav?.hazardAhead} units={settings.units} />
          </div>
        </div>
      )}

      {caption && (phase === 'nav' || phase === 'arrived') && (
        <div key={caption.id} className="caption" data-level={settings.level}>
          <span className="caption-dot" />
          {caption.text}
        </div>
      )}

      {!follow && position && phase !== 'preview' && (
        <button className="recenter" onClick={() => setFollow(true)}>
          <svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 3 19 20 12 16 5 20Z" /></svg>
          Re-center
        </button>
      )}

      {phase === 'preview' && (
        <div className="card preview">
          <div className="card-head">
            <div>
              <h3>{dest?.name}</h3>
              {dest?.label && <p className="sub">{dest.label}</p>}
            </div>
            <button className="icon-btn ghost" onClick={clearTrip} aria-label="Cancel">
              <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          {loading && <p className="quip">Calculating the route you'll ignore…</p>}
          {route && (
            <>
              <div className="stats">
                <span className="big">{displayDuration(route.duration)}</span>
                <span>{displayDistance(route.distance, settings.units)}</span>
                <button className="chip level-chip" onClick={() => setShowSettings(true)}>{LEVELS[settings.level].name}</button>
              </div>
              {previewQuip && <p className="quip">“{previewQuip}”</p>}
              {respectful && <p className="quip">No jokes on this trip. Just directions.</p>}
              {hazards.length > 0 && (
                <p className="sub hazard-count">
                  {hazards.length} {hazards.length === 1 ? 'alert' : 'alerts'} on this route
                </p>
              )}
              <div className="actions">
                <button className="btn primary" onClick={() => startNav(false)} disabled={!gps}>
                  {gps ? "Let's go" : 'Needs live GPS'}
                </button>
                <button className="btn secondary" onClick={() => startNav(true)}>Demo drive</button>
              </div>
            </>
          )}
        </div>
      )}

      {phase === 'nav' && (
        <NavFooter
          nav={nav}
          units={settings.units}
          settings={settings}
          demo={demo}
          onLevel={cycleLevel}
          onMute={() => update({ muted: !settings.muted })}
          onEnd={endNav}
          onMissTurn={() => simRef.current?.missTurn()}
          demoMode={demoMode}
          onDemoMode={(m) => {
            setDemoMode(m);
            simRef.current?.setMode(m);
          }}
          listen={listen}
          onMic={toggleMic}
          micSupported={listenSupported}
          onDemoSpeed={(m) => {
            update({ demoMult: m });
            simRef.current?.setMultiplier(m);
          }}
        />
      )}

      {phase === 'arrived' && (
        <div className="card arrived">
          <div className="flag">🏁</div>
          <h3>You made it{dest?.name && dest.name !== 'Dropped pin' ? ` to ${dest.name}` : ''}.</h3>
          <p className="sub">Somehow.</p>
          <button className="btn primary wide" onClick={finishArrived}>Done</button>
        </div>
      )}

      {toast && <div className="toast" role="status">{toast}</div>}

      {showSettings && <SettingsSheet settings={settings} update={update} onClose={() => setShowSettings(false)} />}

      {!onboarded && (
        <div className="onboard">
          <div className="onboard-card">
            <div className="logo">
              <svg viewBox="0 0 64 64" width="64" height="64"><rect x="4" y="4" width="56" height="56" rx="14" /><path d="M32 13 46 49 32 41 18 49Z" /></svg>
            </div>
            <h1>Rude GPS</h1>
            <p className="tag">Turn-by-turn directions with a terrible attitude.</p>
            <ul>
              <li>It insults your driving. It never hides the directions.</li>
              <li>Set your destination before you drive. Eyes on the road.</li>
              <li>Directions can be wrong. Road signs and the law always win.</li>
            </ul>
            <button
              className="btn primary wide"
              onClick={() => {
                voice.unlock();
                save(ONBOARD_KEY, true);
                setOnboarded(true);
              }}
            >
              Fine. Let's go.
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
