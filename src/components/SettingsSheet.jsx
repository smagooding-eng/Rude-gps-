import { useEffect, useState } from 'react';
import { LEVELS, pick } from '../lib/lines.js';
import { voice } from '../lib/voice.js';

export default function SettingsSheet({ settings, update, onClose }) {
  const [voices, setVoices] = useState(voice.list());
  useEffect(() => voice.onVoicesChanged(() => setVoices(voice.list())), []);

  const test = () => {
    voice.unlock();
    const lvl = settings.level;
    const line = lvl === 0
      ? 'In 500 feet, turn left onto Main Street.'
      : `In 500 feet, turn left onto Main Street. ${pick('prepareQuip', lvl, settings.profanity) || ''}`;
    voice.speak(line, { interrupt: true });
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Settings">
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h2>Attitude adjustment</h2>
          <button className="icon-btn ghost" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <section>
          <label className="label">Rudeness</label>
          <div className="levels">
            {LEVELS.map((l) => (
              <button key={l.id} className={`level ${settings.level === l.id ? 'on' : ''}`} data-level={l.id} onClick={() => update({ level: l.id })}>
                {l.name}
              </button>
            ))}
          </div>
          <p className="hint">{LEVELS[settings.level].blurb}</p>
        </section>

        <section className="row">
          <div>
            <div className="label">Profanity</div>
            <p className="hint">Kicks in at Savage and Unhinged.</p>
          </div>
          <button className={`toggle ${settings.profanity ? 'on' : ''}`} role="switch" aria-checked={settings.profanity} onClick={() => update({ profanity: !settings.profanity })}>
            <span />
          </button>
        </section>

        <section>
          <label className="label">Unprompted commentary</label>
          <div className="seg">
            {['Off', 'Normal', 'Chatty'].map((n, i) => (
              <button key={n} className={settings.chattiness === i ? 'on' : ''} onClick={() => update({ chattiness: i })}>{n}</button>
            ))}
          </div>
        </section>

        <section>
          <label className="label" htmlFor="voice">Voice</label>
          <select id="voice" value={settings.voiceURI} onChange={(e) => update({ voiceURI: e.target.value })}>
            <option value="">Device default</option>
            {voices.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
            ))}
          </select>
          <div className="row tight">
            <label className="label" htmlFor="rate">Speed</label>
            <input id="rate" type="range" min="0.7" max="1.4" step="0.05" value={settings.rate} onChange={(e) => update({ rate: Number(e.target.value) })} />
            <span className="val">{settings.rate.toFixed(2)}×</span>
          </div>
          <button className="btn secondary wide" onClick={test} disabled={!voice.supported}>
            {voice.supported ? 'Test the attitude' : 'Speech not supported in this browser'}
          </button>
        </section>

        <section>
          <label className="label">Units</label>
          <div className="seg">
            <button className={settings.units === 'imperial' ? 'on' : ''} onClick={() => update({ units: 'imperial' })}>Miles / feet</button>
            <button className={settings.units === 'metric' ? 'on' : ''} onClick={() => update({ units: 'metric' })}>Kilometers / meters</button>
          </div>
        </section>

        <section>
          <label className="label">Map</label>
          <div className="seg">
            {['auto', 'light', 'dark'].map((t) => (
              <button key={t} className={settings.mapTheme === t ? 'on' : ''} onClick={() => update({ mapTheme: t })}>{t[0].toUpperCase() + t.slice(1)}</button>
            ))}
          </div>
        </section>

        <p className="fine">
          Map data © OpenStreetMap contributors. Tiles by OpenFreeMap. Routing by OSRM. Search by Photon.
          Directions can be wrong. Road signs win every argument.
        </p>
      </div>
    </div>
  );
}
