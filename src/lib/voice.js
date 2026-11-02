// Thin wrapper over the Web Speech API.
const synth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;

let opts = { voiceURI: '', rate: 1, pitch: 1, muted: false };

export const voice = {
  supported: !!synth,

  configure(next) {
    opts = { ...opts, ...next };
    if (opts.muted && synth) synth.cancel();
  },

  // iOS only allows speech after a user gesture; call this from a tap.
  unlock() {
    if (!synth) return;
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    synth.speak(u);
  },

  list() {
    if (!synth) return [];
    return synth.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('en'));
  },

  onVoicesChanged(cb) {
    if (!synth) return () => {};
    synth.addEventListener('voiceschanged', cb);
    return () => synth.removeEventListener('voiceschanged', cb);
  },

  speak(text, { interrupt = false } = {}) {
    if (!synth || opts.muted || !text) return;
    if (interrupt) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = synth.getVoices().find((x) => x.voiceURI === opts.voiceURI);
    if (v) {
      u.voice = v;
      u.lang = v.lang;
    } else {
      u.lang = 'en-US';
    }
    u.rate = opts.rate;
    u.pitch = opts.pitch;
    synth.speak(u);
  },

  cancel() {
    synth?.cancel();
  },
};
