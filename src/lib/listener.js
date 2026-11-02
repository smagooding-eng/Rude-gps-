// Hands-free commands via the browser's speech recognition.
// Listens continuously while on, restarts itself after silence, and ignores
// what it hears while the GPS itself is talking.

const SR = typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

export const listenSupported = !!SR;

// Ordered: first match wins.
const COMMANDS = [
  ['quiet', /\b(shut up|shut it|be quiet|quiet|stop talking|zip it|silence|hush|enough)\b/],
  ['talk', /\b(you can talk|talk to me|speak up|unmute|i miss you|say something)\b/],
  ['nicer', /\b(be nice|nicer|be nicer|calm down|chill|tone it down|be polite)\b/],
  ['meaner', /\b(roast me|meaner|be mean|be meaner|go harder|bring it|do your worst|unhinged)\b/],
  ['repeat', /\b(repeat|say that again|say again|what did you say|come again|what was that)\b/],
  ['eta', /\b(are we there yet|how long|how much longer|how far|eta|when do we get there)\b/],
  ['thanks', /\b(thank you|thanks|good job|nice job|love you)\b/],
  ['insult', /\b(i hate you|screw you|you suck|stupid gps|dumb gps|idiot|go to hell|f\W*(ck|uck) you)\b/],
  ['lost', /\b(i'?m lost|where am i|where are we)\b/],
];

export function matchCommand(text) {
  const t = ` ${text.toLowerCase()} `;
  for (const [name, re] of COMMANDS) if (re.test(t)) return name;
  return null;
}

export class Listener {
  constructor({ onCommand, onState, isSpeaking }) {
    this.onCommand = onCommand;
    this.onState = onState;
    this.isSpeaking = isSpeaking;
    this.on = false;
    this.rec = null;
    this.lastCmdAt = 0;
  }

  start() {
    if (!SR || this.on) return;
    this.on = true;
    this._spawn();
    this.onState?.('listening');
  }

  stop() {
    this.on = false;
    try {
      this.rec?.abort();
    } catch {
      /* already stopped */
    }
    this.rec = null;
    this.onState?.('off');
  }

  _spawn() {
    const rec = new SR();
    rec.lang = 'en-US';
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;
    rec.onresult = (e) => {
      if (this.isSpeaking?.()) return;
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        for (let a = 0; a < r.length; a++) {
          const cmd = matchCommand(r[a].transcript || '');
          if (cmd && Date.now() - this.lastCmdAt > 2500) {
            this.lastCmdAt = Date.now();
            this.onCommand?.(cmd, r[a].transcript);
            return;
          }
        }
      }
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        this.on = false;
        this.onState?.('denied');
      }
    };
    rec.onend = () => {
      // Browsers end recognition after silence; keep it going while switched on.
      if (this.on) setTimeout(() => this.on && this._spawn(), 300);
    };
    this.rec = rec;
    try {
      rec.start();
    } catch {
      /* start can throw if called too fast; onend will retry */
    }
  }
}
