import { useEffect, useState } from 'react';
import { LEVELS, pick } from '../lib/lines.js';
import { voice, AI_VOICES, NATURAL_VOICES, synthesize, prepareNatural } from '../lib/voice.js';
import { MAP_THEMES } from '../lib/mapTheme.js';
import { listenSupported } from '../lib/listener.js';

export default function SettingsSheet({ settings, update, onClose, voiceProgress }) {
  const [voices, setVoices] = useState(voice.list());
  const [aiStatus, setAiStatus] = useState('');
  useEffect(() => voice.onVoicesChanged(() => setVoices(voice.list())), []);
  const best = voice.best();

  const sample = () => {
    const lvl = settings.level;
    return lvl === 0
      ? 'In 500 feet, turn left onto Main Street.'
      : `In 500 feet, turn left onto Main Street. ${pick('prepareQuip', lvl, settings.profanity) || ''}`;
  };

  const test = async () => {
    voice.unlock();
    if (settings.voiceEngine === 'natural') {
      setAiStatus('Getting the voice ready…');
      try {
        await prepareNatural(settings.naturalVoice);
        setAiStatus('');
      } catch {
        setAiStatus("Couldn't download the voice. Check your connection.");
        return;
      }
    }
    if (settings.voiceEngine === 'ai' && settings.aiKey) {
      setAiStatus('Generating…');
      try {
        await synthesize('Testing.', { key: settings.aiKey, voice: settings.aiVoice, level: settings.level });
        setAiStatus('Key works.');
      } catch (e) {
        setAiStatus(e.message);
        return;
      }
    }
    voice.speak(sample(), { interrupt: true });
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
          <label className="label">Voice</label>
          <div className="seg">
            <button className={settings.voiceEngine === 'natural' ? 'on' : ''} onClick={() => update({ voiceEngine: 'natural' })}>Natural</button>
            <button className={settings.voiceEngine === 'device' ? 'on' : ''} onClick={() => update({ voiceEngine: 'device' })}>Phone</button>
            <button className={settings.voiceEngine === 'ai' ? 'on' : ''} onClick={() => update({ voiceEngine: 'ai' })}>AI actor</button>
          </div>

          {settings.voiceEngine === 'natural' && (
            <>
              <select id="naturalVoice" className="mt" value={settings.naturalVoice} onChange={(e) => update({ naturalVoice: e.target.value })}>
                {NATURAL_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
              <p className="hint">
                A free AI voice that runs on your phone. No key, no account, works offline after a one-time
                download of about 60 MB per voice (use Wi-Fi). Until it&rsquo;s downloaded, the phone voice fills in.
                {voiceProgress != null && ` Downloading: ${Math.round(voiceProgress * 100)}%.`}
              </p>
              {aiStatus && <p className="hint">{aiStatus}</p>}
            </>
          )}

          {settings.voiceEngine === 'natural' ? null : settings.voiceEngine !== 'ai' ? (
            <>
              <select id="voice" value={settings.voiceURI} onChange={(e) => update({ voiceURI: e.target.value })} className="mt">
                <option value="">Best available{best ? ` (${best.name})` : ''}</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                ))}
              </select>
              <p className="hint">
                iPhone tip: Settings → Accessibility → Spoken Content → Voices → English, then download an
                &ldquo;Enhanced&rdquo; or &ldquo;Premium&rdquo; voice. It shows up here and sounds far better.
              </p>
            </>
          ) : (
            <>
              <p className="hint">
                A real voice actor that gets more theatrical as the rudeness goes up. Paste your own OpenAI API key
                (platform.openai.com → API keys). It stays on this phone only and costs a few cents per long drive.
                If a clip is slow or there&rsquo;s no signal, the Natural voice covers so you never miss a turn.
                Try Ash, Coral or Ballad at Savage or Unhinged.
              </p>
              <input
                id="aiKey"
                className="text-in"
                type="password"
                autoComplete="off"
                placeholder="sk-…"
                value={settings.aiKey}
                onChange={(e) => update({ aiKey: e.target.value.trim() })}
                aria-label="OpenAI API key"
              />
              <label className="label mt" htmlFor="aiVoice">AI voice</label>
              <select id="aiVoice" value={settings.aiVoice} onChange={(e) => update({ aiVoice: e.target.value })}>
                {AI_VOICES.map((v) => (
                  <option key={v} value={v}>{v[0].toUpperCase() + v.slice(1)}</option>
                ))}
              </select>
              {aiStatus && <p className="hint">{aiStatus}</p>}
            </>
          )}

          <div className="row tight">
            <label className="label" htmlFor="rate">Speed</label>
            <input id="rate" type="range" min="0.7" max="1.4" step="0.05" value={settings.rate} onChange={(e) => update({ rate: Number(e.target.value) })} />
            <span className="val">{settings.rate.toFixed(2)}×</span>
          </div>
          <button className="btn secondary wide" onClick={test} disabled={!voice.supported && settings.voiceEngine !== 'ai'}>
            Test the attitude
          </button>
        </section>

        <section>
          <label className="label">Hazard alerts</label>
          <div className="row">
            <div>
              <div className="sub-strong">Speed &amp; red-light cameras</div>
              <p className="hint">From OpenStreetMap. Free, no setup.</p>
            </div>
            <button className={`toggle ${settings.cameras ? 'on' : ''}`} role="switch" aria-checked={settings.cameras} onClick={() => update({ cameras: !settings.cameras })}>
              <span />
            </button>
          </div>
          <div className="sub-strong mt">Crashes, closures, road work, hazards, traffic</div>
          <p className="hint">
            Live from TomTom Traffic. Get a free key at developer.tomtom.com (no credit card, 2,500 lookups a month,
            roughly one per 5 minutes of driving) and paste it here.
          </p>
          <input
            id="tomtomKey"
            className="text-in"
            type="password"
            autoComplete="off"
            placeholder="TomTom API key"
            value={settings.tomtomKey}
            onChange={(e) => update({ tomtomKey: e.target.value.trim() })}
            aria-label="TomTom API key"
          />
        </section>

        {listenSupported && (
          <section>
            <label className="label">Talk back</label>
            <p className="hint">
              Tap the mic while driving, then say things like &ldquo;shut up&rdquo;, &ldquo;talk to me&rdquo;,
              &ldquo;repeat that&rdquo;, &ldquo;are we there yet&rdquo;, &ldquo;be nicer&rdquo; or &ldquo;roast me&rdquo;.
              It only reacts to those, so normal conversation in the car is ignored.
            </p>
          </section>
        )}

        <section>
          <label className="label">Units</label>
          <div className="seg">
            <button className={settings.units === 'imperial' ? 'on' : ''} onClick={() => update({ units: 'imperial' })}>Miles / feet</button>
            <button className={settings.units === 'metric' ? 'on' : ''} onClick={() => update({ units: 'metric' })}>Kilometers / meters</button>
          </div>
        </section>

        <section>
          <label className="label">Map</label>
          <div className="seg wrap">
            {MAP_THEMES.map((t) => (
              <button key={t.id} className={settings.mapTheme === t.id ? 'on' : ''} onClick={() => update({ mapTheme: t.id })}>{t.name}</button>
            ))}
          </div>
        </section>

        <p className="fine">
          Map data © OpenStreetMap contributors. Tiles by OpenFreeMap. Routing by OSRM. Search by Photon.
          Incidents by TomTom. Speed limits and cameras from OpenStreetMap and can be missing or out of date.
          Directions can be wrong. Road signs win every argument.
        </p>
      </div>
    </div>
  );
}
