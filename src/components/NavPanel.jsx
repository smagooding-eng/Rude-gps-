import { instruction, cap, displayDistance, displayDuration, LEVELS } from '../lib/lines.js';
import { hazardSvg, HAZARD_STYLE } from '../lib/hazardIcons.js';

const ANGLE = { straight: 0, 'slight right': 45, right: 90, 'sharp right': 135, 'slight left': -45, left: -90, 'sharp left': -135 };

export function ManeuverIcon({ step, size = 56 }) {
  if (!step) return null;
  const common = { width: size, height: size, viewBox: '0 0 48 48', className: 'maneuver' };
  if (step.type === 'arrive') {
    return (
      <svg {...common}><path d="M14 42V8M14 9h20l-4 6 4 6H14" /></svg>
    );
  }
  if (step.modifier === 'uturn') {
    return (
      <svg {...common}><path d="M30 42V20a8 8 0 0 0-16 0v4" /><path d="M8 20l6 7 6-7" /></svg>
    );
  }
  if (step.type?.includes('roundabout') || step.type?.includes('rotary')) {
    return (
      <svg {...common}><circle cx="24" cy="26" r="7" /><path d="M24 42v-9M24 19V6M18 12l6-6 6 6" /></svg>
    );
  }
  const a = ANGLE[step.modifier] ?? 0;
  return (
    <svg {...common}>
      <g transform={`rotate(${a} 24 26)`}>
        <path d="M24 42V8M14 18l10-10 10 10" />
      </g>
    </svg>
  );
}

export function HazardChip({ hazard, units }) {
  if (!hazard) return null;
  const st = HAZARD_STYLE[hazard.kind] || HAZARD_STYLE.hazard;
  return (
    <div className="hazard-chip" style={{ '--hz': st.color }}>
      <span className="hazard-dot" dangerouslySetInnerHTML={{ __html: hazardSvg(hazard.kind, 16) }} />
      <strong>{st.label}</strong>
      <span>{displayDistance(hazard.dist, units)}</span>
    </div>
  );
}

export function SpeedSign({ nav, units }) {
  if (!nav) return null;
  const conv = units === 'metric' ? 3.6 : 2.23694;
  const sp = Math.round((nav.speed || 0) * conv);
  const lim = nav.limit ? Math.round((nav.limit * conv) / 5) * 5 : null;
  const over = lim && sp > lim + Math.max(units === 'metric' ? 15 : 9, lim * 0.15);
  return (
    <div className="speed">
      <div className={`speed-now ${over ? 'over' : ''}`}>
        <b>{sp}</b>
        <span>{units === 'metric' ? 'km/h' : 'mph'}</span>
      </div>
      {lim && (
        <div className="speed-limit" aria-label={`Speed limit ${lim}`}>
          <span>LIMIT</span>
          <b>{lim}</b>
        </div>
      )}
    </div>
  );
}

export function NavBanner({ nav, units }) {
  if (!nav) return null;
  return (
    <div className="banner">
      <ManeuverIcon step={nav.step} />
      <div className="banner-text">
        <div className="banner-dist">{displayDistance(nav.distToNext, units)}</div>
        <div className="banner-instr">{cap(instruction(nav.step, false))}</div>
        {nav.then && <div className="banner-then">Then {instruction(nav.then, false)}</div>}
      </div>
    </div>
  );
}

export function NavFooter({ nav, units, settings, onLevel, onMute, onEnd, demo, onMissTurn, onDemoSpeed, demoMode, onDemoMode, listen, onMic, micSupported }) {
  const eta = nav?.eta?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return (
    <div className="footer">
      {demo && (
        <div className="demo-row">
          <span className="demo-tag">DEMO</span>
          <button className="chip" onClick={onMissTurn}>Miss a turn</button>
          <button className={`chip ${demoMode === 'fast' ? 'on' : ''}`} onClick={() => onDemoMode(demoMode === 'fast' ? 'normal' : 'fast')}>Floor it</button>
          <button className={`chip ${demoMode === 'slow' ? 'on' : ''}`} onClick={() => onDemoMode(demoMode === 'slow' ? 'normal' : 'slow')}>Grandma</button>
          {[1, 2, 4].map((m) => (
            <button key={m} className={`chip ${settings.demoMult === m ? 'on' : ''}`} onClick={() => onDemoSpeed(m)}>{m}×</button>
          ))}
        </div>
      )}
      <div className="footer-main">
        <div className="trip">
          <div className="trip-eta">{eta || '--'}</div>
          <div className="trip-sub">
            {nav ? `${displayDuration(nav.remainingTime)} · ${displayDistance(nav.remaining, units)}` : 'Calculating…'}
          </div>
        </div>
        <button className="chip level-chip" onClick={onLevel} aria-label="Change rudeness">
          {nav?.quiet ? 'Quiet' : LEVELS[settings.level].name}
        </button>
        {micSupported && (
          <button className={`icon-btn mic ${listen === 'listening' ? 'live' : ''}`} onClick={onMic} aria-label={listen === 'listening' ? 'Stop listening' : 'Talk back to the GPS'}>
            <svg viewBox="0 0 24 24" width="22" height="22"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />{listen !== 'listening' && <path d="M4 4l16 16" className="mic-off" />}</svg>
          </button>
        )}
        <button className={`icon-btn ${settings.muted ? 'muted' : ''}`} onClick={onMute} aria-label={settings.muted ? 'Unmute' : 'Mute'}>
          {settings.muted ? (
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 9h4l5-4v14l-5-4H4zM17 9l5 6M22 9l-5 6" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 9h4l5-4v14l-5-4H4zM17 8a5 5 0 0 1 0 8M19.5 5.5a8.5 8.5 0 0 1 0 13" /></svg>
          )}
        </button>
        <button className="end-btn" onClick={onEnd}>End</button>
      </div>
    </div>
  );
}
