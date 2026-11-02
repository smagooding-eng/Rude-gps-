// Two voice engines:
//  - device: the phone's built-in speech (free, instant, offline). Auto-picks the best installed voice.
//  - ai: OpenAI text-to-speech with acting directions per rudeness level. Uses the
//    user's own API key, stored only on their device. Falls back to device speech
//    if a clip is slow, the key fails, or there's no signal.

const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
const OPENAI_TTS = 'https://api.openai.com/v1/audio/speech';

export const AI_VOICES = ['ash', 'coral', 'onyx', 'nova', 'sage', 'ballad', 'verse', 'echo', 'alloy', 'fable', 'shimmer'];

const BASE_DIRECTION = 'You are the voice of a car navigation app. Read every direction, street name and distance clearly and at a natural pace; the attitude rides on top and never makes a direction hard to understand.';
export const ACTING = [
  'Calm, clear, friendly, professional.',
  'Dry and lightly sarcastic, a hint of an eye-roll in the voice.',
  'Deadpan snark. Exasperated, with small audible sighs and a judgmental tone.',
  'Openly fed up and roasting the driver. Biting, theatrical contempt and sharp comic timing.',
  'Unhinged and dramatic, on the edge of a breakdown. Over-the-top exasperation, sudden bursts of intensity, great comic timing.',
];

let opts = { engine: 'device', voiceURI: '', rate: 1, pitch: 1, muted: false, aiKey: '', aiVoice: 'ash', level: 2, onAiError: null };

/* ---------------- Device voices ---------------- */

function scoreVoice(v) {
  let s = 0;
  if (/natural|neural|premium|enhanced|siri/i.test(v.name)) s += 100;
  if (/google/i.test(v.name)) s += 50;
  if (/^en[-_]US/i.test(v.lang)) s += 30;
  else if (/^en/i.test(v.lang)) s += 15;
  if (/compact|novelty|whisper|bad news|bells|bubbles|cellos|zarvox|trinoids|organ|jester|superstar|wobble|boing|albert|bahh|hysterical|junior|ralph|fred|kathy/i.test(v.name)) s -= 200;
  return s;
}

function englishVoices() {
  if (!synth) return [];
  return synth.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('en'));
}

export function bestVoice() {
  return [...englishVoices()].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
}

function speakDevice(text, interrupt) {
  if (!synth) return;
  if (interrupt) synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const v = synth.getVoices().find((x) => x.voiceURI === opts.voiceURI) || bestVoice();
  if (v) {
    u.voice = v;
    u.lang = v.lang;
  } else {
    u.lang = 'en-US';
  }
  u.rate = opts.rate;
  u.pitch = opts.pitch;
  synth.speak(u);
}

/* ---------------- AI voice ---------------- */

let ctx = null;
let current = null; // playing AudioBufferSourceNode
let queue = []; // [{text, clip: Promise<AudioBuffer|null>, urgent}]
let playing = false;
let generation = 0;
const cache = new Map();

function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
}

function cacheKey(text) {
  return `${opts.aiVoice}|${opts.level}|${text}`;
}

export async function synthesize(text, { key = opts.aiKey, voice = opts.aiVoice, level = opts.level, signal } = {}) {
  const res = await fetch(OPENAI_TTS, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini-tts',
      voice,
      input: text,
      instructions: `${BASE_DIRECTION} Delivery: ${ACTING[level] || ACTING[2]}`,
      response_format: 'mp3',
    }),
    signal,
  });
  if (!res.ok) {
    let msg = `Voice service error (${res.status})`;
    if (res.status === 401) msg = 'OpenAI key was rejected. Check it in Settings.';
    else if (res.status === 429) msg = 'OpenAI says the key is out of credit or rate limited.';
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  const bytes = await res.arrayBuffer();
  const ac = audioCtx();
  return new Promise((resolve, reject) => ac.decodeAudioData(bytes, resolve, reject));
}

let lastErrorAt = 0;
function clip(text) {
  const k = cacheKey(text);
  if (!cache.has(k)) {
    const p = synthesize(text).catch((e) => {
      cache.delete(k);
      if (Date.now() - lastErrorAt > 60000) {
        lastErrorAt = Date.now();
        opts.onAiError?.(e.message);
      }
      return null;
    });
    cache.set(k, p);
    if (cache.size > 80) cache.delete(cache.keys().next().value);
  }
  return cache.get(k);
}

function timeout(ms) {
  return new Promise((r) => setTimeout(() => r('timeout'), ms));
}

async function pump() {
  if (playing) return;
  playing = true;
  const gen = generation;
  while (queue.length && gen === generation) {
    const item = queue.shift();
    const buf = await (item.urgent ? Promise.race([item.clip, timeout(1500)]) : Promise.race([item.clip, timeout(6000)]));
    if (gen !== generation) break;
    if (!buf || buf === 'timeout') {
      // Too slow or failed: say it with the device voice so the direction isn't lost.
      await new Promise((resolve) => {
        if (!synth) return resolve();
        const u = new SpeechSynthesisUtterance(item.text);
        const v = synth.getVoices().find((x) => x.voiceURI === opts.voiceURI) || bestVoice();
        if (v) u.voice = v;
        u.rate = opts.rate;
        u.onend = resolve;
        u.onerror = resolve;
        synth.speak(u);
        setTimeout(resolve, 15000);
      });
      continue;
    }
    await new Promise((resolve) => {
      const ac = audioCtx();
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = opts.rate;
      src.connect(ac.destination);
      src.onended = resolve;
      current = src;
      src.start();
    });
    current = null;
  }
  playing = false;
  if (queue.length && gen !== generation) pump();
}

function stopAi() {
  generation += 1;
  queue = [];
  try {
    current?.stop();
  } catch {
    /* already stopped */
  }
  current = null;
  playing = false;
}

/* ---------------- Public API ---------------- */

export const voice = {
  supported: !!synth,

  configure(next) {
    opts = { ...opts, ...next };
    if (opts.muted) this.cancel();
  },

  get speaking() {
    return playing || !!synth?.speaking || !!synth?.pending;
  },

  get usingAi() {
    return opts.engine === 'ai' && !!opts.aiKey;
  },

  // iOS only allows audio after a user gesture; call this from a tap.
  unlock() {
    if (synth) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      synth.speak(u);
    }
    const ac = audioCtx();
    if (ac) {
      ac.resume?.();
      const b = ac.createBuffer(1, 1, 22050);
      const s = ac.createBufferSource();
      s.buffer = b;
      s.connect(ac.destination);
      s.start();
    }
  },

  list() {
    return englishVoices();
  },

  best: bestVoice,

  onVoicesChanged(cb) {
    if (!synth) return () => {};
    synth.addEventListener('voiceschanged', cb);
    return () => synth.removeEventListener('voiceschanged', cb);
  },

  speak(text, { interrupt = false } = {}) {
    if (opts.muted || !text) return;
    if (!this.usingAi) {
      speakDevice(text, interrupt);
      return;
    }
    if (interrupt) {
      stopAi();
      synth?.cancel();
    }
    queue.push({ text, clip: clip(text), urgent: interrupt });
    pump();
  },

  // Warm the cache for a line we know is coming (e.g. the "turn now" call).
  prefetch(text) {
    if (this.usingAi && text && !opts.muted) clip(text);
  },

  cancel() {
    stopAi();
    synth?.cancel();
  },
};
