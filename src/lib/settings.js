import { useCallback, useState } from 'react';
import { load, save } from './storage.js';

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
  voiceEngine: 'natural', // natural | device | ai
  naturalVoice: 'en_US-hfc_male-medium',
  voiceV2: true,
  aiKey: '',
  aiVoice: 'ash',
  tomtomKey: '',
  cameras: true,
};

export { load, save };

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    const stored = load(KEY, {});
    // One-time move to the new natural voice for anyone still on the old default.
    if (!stored.voiceV2 && stored.voiceEngine !== 'ai') {
      stored.voiceEngine = 'natural';
      stored.voiceV2 = true;
    }
    return { ...DEFAULTS, ...stored };
  });
  const update = useCallback((patch) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      save(KEY, next);
      return next;
    });
  }, []);
  return [settings, update];
}
