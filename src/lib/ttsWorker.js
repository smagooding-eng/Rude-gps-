// Runs the on-device neural voice (Piper via ONNX) off the main thread so the map stays smooth.
import * as tts from '@diffusionstudio/vits-web';

self.onmessage = async (e) => {
  const { id, type, text, voiceId } = e.data;
  try {
    if (type === 'download') {
      const have = await tts.stored();
      if (!have.includes(voiceId)) {
        await tts.download(voiceId, (p) => self.postMessage({ type: 'progress', voiceId, loaded: p.loaded, total: p.total }));
      }
      self.postMessage({ id, type: 'ready', voiceId });
    } else if (type === 'predict') {
      const wav = await tts.predict({ text, voiceId });
      const buf = await wav.arrayBuffer();
      self.postMessage({ id, type: 'audio', buf }, [buf]);
    }
  } catch (err) {
    self.postMessage({ id, type: 'error', message: String(err?.message || err) });
  }
};
