// Tiny WebAudio sound effects, synthesized — no audio files. The context is
// created on the first player gesture, so it never blocks the page load.
let context = null;

function ensureContext() {
  if (context) return context;
  try {
    const AudioContextClass = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
  } catch {
    return null;
  }
  return context;
}

function tone(frequency, duration, type, gainValue, when = 0) {
  const ctx = ensureContext();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  const start = ctx.currentTime + when;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

function noiseBurst(duration, gainValue) {
  const ctx = ensureContext();
  if (!ctx) return;
  const length = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / length);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = gainValue;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1200;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export const sfx = {
  unlock() {
    ensureContext();
  },
  click() {
    tone(660, 0.06, 'triangle', 0.12);
  },
  chop() {
    noiseBurst(0.08, 0.25);
    tone(180, 0.07, 'square', 0.08);
  },
  sizzle() {
    noiseBurst(0.25, 0.12);
  },
  ding() {
    tone(880, 0.18, 'sine', 0.2);
    tone(1318, 0.28, 'sine', 0.16, 0.09);
  },
  wrong() {
    tone(160, 0.18, 'sawtooth', 0.1);
    tone(120, 0.22, 'sawtooth', 0.1, 0.08);
  },
  lost() {
    tone(392, 0.15, 'triangle', 0.14);
    tone(311, 0.2, 'triangle', 0.14, 0.12);
    tone(233, 0.3, 'triangle', 0.14, 0.24);
  },
};
