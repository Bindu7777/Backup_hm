// Soft, musical UI sounds for the greeting card and group chats, made with the
// Web Audio API (no audio files to download). Marimba taps for choices, bell
// arpeggios for celebrations, a playful "boop" for Momo. They follow the same
// on/off switch as Momo (momoSound), which is remembered per browser.

import { momoSound } from "@/utils/momoSoundEffects";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function audio(): { ctx: AudioContext; out: GainNode } | null {
  if (typeof window === "undefined" || !momoSound.isEnabled()) return null;
  try {
    if (!ctx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      ctx = new Ctx();
      master = ctx.createGain();
      master.gain.value = 0.32;
      // A touch of space: short, quiet echo.
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.11;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.16;
      const wet = ctx.createGain();
      wet.gain.value = 0.22;
      master.connect(ctx.destination);
      master.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => undefined);
    return { ctx, out: master! };
  } catch {
    return null;
  }
}

/** One note made of sine partials with a quick attack and exponential decay. */
function note(freq: number, at: number, opts: { partials?: [number, number][]; decay?: number; gain?: number } = {}) {
  const a = audio();
  if (!a) return;
  const { ctx: c, out } = a;
  const start = c.currentTime + at;
  const decay = opts.decay ?? 0.35;
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(opts.gain ?? 0.6, start + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, start + decay);
  env.connect(out);
  for (const [ratio, level] of opts.partials ?? [[1, 1]]) {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * ratio;
    g.gain.value = level;
    osc.connect(g);
    g.connect(env);
    osc.start(start);
    osc.stop(start + decay + 0.05);
  }
}

const marimba = (f: number, at = 0, gain = 0.55) =>
  note(f, at, { partials: [[1, 1], [3.93, 0.18], [9.2, 0.04]], decay: 0.42, gain });
const bell = (f: number, at = 0, gain = 0.4) =>
  note(f, at, { partials: [[1, 1], [2.76, 0.35], [5.4, 0.12]], decay: 1.3, gain });

// Notes (Hz)
const C5 = 523.25, D5 = 587.33, E5 = 659.25, G5 = 783.99, A5 = 880, C6 = 1046.5, E6 = 1318.5;

export const cardSounds = {
  /** Small tap: chips, toggles. */
  tap: () => marimba(E5, 0, 0.4),
  /** Picking something: two notes up. */
  select: () => { marimba(C5); marimba(G5, 0.07); },
  /** Un-picking: two notes down, softer. */
  unselect: () => { marimba(G5, 0, 0.35); marimba(C5, 0.07, 0.3); },
  /** Next question. */
  next: () => { marimba(D5, 0, 0.4); marimba(A5, 0.06, 0.45); },
  /** Back. */
  back: () => marimba(D5, 0, 0.3),
  /** Card finished / invite opens: bright pentatonic arpeggio. */
  celebrate: () => {
    [C5, D5, E5, G5, A5, C6].forEach((f, i) => bell(f, i * 0.085, 0.32));
    bell(E6, 0.6, 0.25);
    bell(C6, 0.6, 0.25);
  },
  /** Sparkle: saved image, etc. */
  sparkle: () => { bell(A5, 0, 0.25); bell(E6, 0.08, 0.2); },
  /** Momo's playful "boo-bip". */
  momo: () => {
    const a = audio();
    if (!a) return;
    const { ctx: c, out } = a;
    [0, 0.14].forEach((at, i) => {
      const t = c.currentTime + at;
      const osc = c.createOscillator();
      const env = c.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(i ? 700 : 520, t);
      osc.frequency.exponentialRampToValueAtTime(i ? 1050 : 760, t + 0.1);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.35, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      osc.connect(env);
      env.connect(out);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  },
  /** Chat: message sent. */
  send: () => { marimba(G5, 0, 0.35); marimba(C6, 0.05, 0.3); },
  /** Chat: new message arrived. */
  receive: () => { bell(E5, 0, 0.28); bell(A5, 0.09, 0.24); },
};

export default cardSounds;
