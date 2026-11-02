import { useCallback, useState } from 'react';

const KEY = 'rudegps.settings.v1';

export const DEFAULTS = {
  level: 2,
  profanity: false,
  chattiness: 1,
  voiceURI: '',
  rate: 1,
  units: 'imperial',
  mapTheme: 'auto',
  muted: false,
  demoMult: 1,
};

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: settings just won't persist */
  }
}

export function useSettings() {
  const [settings, setSettings] = useState(() => ({ ...DEFAULTS, ...load(KEY, {}) }));
  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      save(KEY, next);
      return next;
    });
  }, []);
  return [settings, update];
}
