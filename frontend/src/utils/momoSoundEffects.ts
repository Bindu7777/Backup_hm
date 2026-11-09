// Web Audio API & Native WAV Synthesizer for Momo Bot Cute Sound Effects
// Dual-engine: Native 16-bit PCM WAV Audio + Web Audio API oscillators for 100% reliability across all browsers!

type SoundListener = (enabled: boolean) => void;

// Helper to build in-memory 16-bit PCM WAV Data URI (0 network downloads, instant playback)
function createWavDataUri(sampleRate: number, samples: Float32Array): string {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  // format chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // 16-bit
  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // PCM 16-bit samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  // Base64 encode
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// Generate pre-rendered WAV Data URIs
function buildSqueakWav(): string {
  const sr = 22050;
  const dur = 0.18;
  const len = Math.floor(sr * dur);
  const samples = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const f = 850 + 950 * Math.sin(Math.PI * (t / dur));
    phase += (2 * Math.PI * f) / sr;
    const env = t < 0.02 ? t / 0.02 : Math.exp(-(t - 0.02) * 16);
    samples[i] = (Math.sin(phase) * 0.85 + Math.sin(phase * 2) * 0.15) * env * 0.9;
  }
  return createWavDataUri(sr, samples);
}

function buildBubblePopWav(): string {
  const sr = 22050;
  const dur = 0.09;
  const len = Math.floor(sr * dur);
  const samples = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const f = 920 * Math.exp(-t * 22) + 220;
    phase += (2 * Math.PI * f) / sr;
    const env = Math.exp(-t * 28);
    samples[i] = Math.sin(phase) * env * 0.9;
  }
  return createWavDataUri(sr, samples);
}

function buildGiggleWav(): string {
  const sr = 22050;
  const dur = 0.28;
  const len = Math.floor(sr * dur);
  const samples = new Float32Array(len);
  const baseFreqs = [980, 1310, 1750];
  for (let n = 0; n < 3; n++) {
    const start = Math.floor(n * 0.08 * sr);
    const noteLen = Math.floor(0.07 * sr);
    let p = 0;
    for (let i = 0; i < noteLen && start + i < len; i++) {
      const t = i / sr;
      p += (2 * Math.PI * (baseFreqs[n] + 200 * (t / 0.07))) / sr;
      const env = t < 0.01 ? t / 0.01 : Math.exp(-(t - 0.01) * 25);
      samples[start + i] += Math.sin(p) * env * 0.8;
    }
  }
  return createWavDataUri(sr, samples);
}

function buildChimeWav(): string {
  const sr = 22050;
  const dur = 0.42;
  const len = Math.floor(sr * dur);
  const samples = new Float32Array(len);
  const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
  for (let n = 0; n < freqs.length; n++) {
    const start = Math.floor(n * 0.055 * sr);
    const noteLen = Math.floor(0.24 * sr);
    let p = 0;
    for (let i = 0; i < noteLen && start + i < len; i++) {
      const t = i / sr;
      p += (2 * Math.PI * freqs[n]) / sr;
      const env = t < 0.015 ? t / 0.015 : Math.exp(-(t - 0.015) * 11);
      samples[start + i] += Math.sin(p) * env * 0.55;
    }
  }
  return createWavDataUri(sr, samples);
}

function buildNomNomWav(): string {
  const sr = 22050;
  const dur = 0.22;
  const len = Math.floor(sr * dur);
  const samples = new Float32Array(len);
  for (let n = 0; n < 3; n++) {
    const start = Math.floor(n * 0.065 * sr);
    const noteLen = Math.floor(0.04 * sr);
    let p = 0;
    const f = 1100 + n * 120;
    for (let i = 0; i < noteLen && start + i < len; i++) {
      const t = i / sr;
      p += (2 * Math.PI * (f - 400 * (t / 0.04))) / sr;
      const env = Math.exp(-t * 60);
      samples[start + i] += Math.sin(p) * env * 0.75;
    }
  }
  return createWavDataUri(sr, samples);
}

class MomoSoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private lastFootstepTime: number = 0;
  private lastSoundTime: number = 0;
  private listeners: SoundListener[] = [];

  // Cached WAV data URIs
  private wavSqueak: string | null = null;
  private wavPop: string | null = null;
  private wavGiggle: string | null = null;
  private wavChime: string | null = null;
  private wavNomNom: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('momo_sound_enabled');
        this.soundEnabled = saved !== null ? saved === 'true' : true;
      } catch (e) {
        this.soundEnabled = true;
      }

      // Pre-initialize WAV URIs lazily
      try {
        this.wavSqueak = buildSqueakWav();
        this.wavPop = buildBubblePopWav();
        this.wavGiggle = buildGiggleWav();
        this.wavChime = buildChimeWav();
        this.wavNomNom = buildNomNomWav();
      } catch (e) {
        console.warn('WAV pre-render error:', e);
      }

      // Global user interaction unlock
      const unlockAudio = () => {
        this.unlockAudio();
        window.removeEventListener('click', unlockAudio, true);
        window.removeEventListener('touchstart', unlockAudio, true);
      };
      window.addEventListener('click', unlockAudio, true);
      window.addEventListener('touchstart', unlockAudio, true);
    }
  }

  public unlockAudio(): void {
    if (typeof window === 'undefined') return;
    try {
      const ctx = this.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch (e) {}
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  public subscribe(listener: SoundListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.soundEnabled);
      } catch (e) {}
    });
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('momo_sound_enabled', String(this.soundEnabled));
      } catch (e) {}
    }
    this.notify();
    if (this.soundEnabled) {
      this.playHamsterSqueak(true);
    }
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('momo_sound_enabled', String(enabled));
      } catch (e) {}
    }
    this.notify();
  }

  /**
   * Ultra-reliable HTML5 Audio WAV player (works on all devices & browsers)
   */
  private playWavAudio(dataUri: string | null, volume: number = 0.85): void {
    if (typeof window === 'undefined' || !dataUri) return;
    try {
      const audio = new Audio(dataUri);
      audio.volume = Math.max(0, Math.min(1, volume));
      const p = audio.play();
      if (p !== undefined) {
        p.catch(() => {});
      }
    } catch (e) {}
  }

  /**
   * Signature Hamster Squeak / Peep
   * Dual-engine: Plays WAV audio immediately + Web Audio synth
   */
  public playHamsterSqueak(force: boolean = false): void {
    if (!this.soundEnabled && !force) return;
    if (force && !this.soundEnabled) {
      this.soundEnabled = true;
      try {
        localStorage.setItem('momo_sound_enabled', 'true');
      } catch (e) {}
      this.notify();
    }

    // 1. Play HTML5 Audio WAV (instant, loud, 100% reliable)
    if (!this.wavSqueak) this.wavSqueak = buildSqueakWav();
    this.playWavAudio(this.wavSqueak, 0.85);

    // 2. Play Web Audio synth with safe linear ramps
    const ctx = this.getAudioContext();
    if (ctx) {
      const playSynth = () => {
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, now);
          osc.frequency.linearRampToValueAtTime(1750, now + 0.08);
          osc.frequency.linearRampToValueAtTime(1420, now + 0.14);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.55, now + 0.015);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.16);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.17);
        } catch (e) {}
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(playSynth).catch(() => {});
      } else {
        playSynth();
      }
    }
  }

  public playChirp(): void {
    this.playHamsterSqueak();
  }

  /**
   * Bubbly Pop Sound
   */
  public playBubblePop(force: boolean = false): void {
    if (!this.soundEnabled && !force) return;

    if (!this.wavPop) this.wavPop = buildBubblePopWav();
    this.playWavAudio(this.wavPop, 0.85);

    const ctx = this.getAudioContext();
    if (ctx) {
      const playSynth = () => {
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(850, now);
          osc.frequency.linearRampToValueAtTime(260, now + 0.07);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.5, now + 0.01);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.085);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.09);
        } catch (e) {}
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(playSynth).catch(() => {});
      } else {
        playSynth();
      }
    }
  }

  /**
   * Hamster Happy Giggle
   */
  public playCuteGiggle(force: boolean = false): void {
    if (!this.soundEnabled && !force) return;

    if (!this.wavGiggle) this.wavGiggle = buildGiggleWav();
    this.playWavAudio(this.wavGiggle, 0.85);

    const ctx = this.getAudioContext();
    if (ctx) {
      const playSynth = () => {
        try {
          const notes = [980, 1280, 1650];
          const now = ctx.currentTime;

          notes.forEach((freq, idx) => {
            const noteTime = now + idx * 0.06;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteTime);
            osc.frequency.linearRampToValueAtTime(freq * 1.15, noteTime + 0.035);

            gain.gain.setValueAtTime(0.01, noteTime);
            gain.gain.linearRampToValueAtTime(0.45, noteTime + 0.01);
            gain.gain.linearRampToValueAtTime(0.001, noteTime + 0.06);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(noteTime);
            osc.stop(noteTime + 0.065);
          });
        } catch (e) {}
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(playSynth).catch(() => {});
      } else {
        playSynth();
      }
    }
  }

  public playHappyGiggle(): void {
    this.playCuteGiggle();
  }

  /**
   * Hamster Nom-Nom / Snacking Sound
   */
  public playCuteNomNom(force: boolean = false): void {
    if (!this.soundEnabled && !force) return;

    if (!this.wavNomNom) this.wavNomNom = buildNomNomWav();
    this.playWavAudio(this.wavNomNom, 0.85);
  }

  /**
   * Celebration Chime
   */
  public playCelebrationChime(force: boolean = false): void {
    if (!this.soundEnabled && !force) return;

    if (!this.wavChime) this.wavChime = buildChimeWav();
    this.playWavAudio(this.wavChime, 0.85);

    const ctx = this.getAudioContext();
    if (ctx) {
      const playSynth = () => {
        try {
          const notes = [659.25, 783.99, 1046.5, 1318.5]; // E5, G5, C6, E6
          const now = ctx.currentTime;

          notes.forEach((freq, i) => {
            const time = now + i * 0.07;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0.01, time);
            gain.gain.linearRampToValueAtTime(0.4, time + 0.015);
            gain.gain.linearRampToValueAtTime(0.001, time + 0.32);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(time);
            osc.stop(time + 0.34);
          });
        } catch (e) {}
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(playSynth).catch(() => {});
      } else {
        playSynth();
      }
    }
  }

  public playChime(): void {
    this.playCelebrationChime();
  }

  /**
   * Spring Boing Jump
   */
  public playBoing(force: boolean = false): void {
    if (!this.soundEnabled && !force) return;

    const ctx = this.getAudioContext();
    if (ctx) {
      const playSynth = () => {
        try {
          const now = ctx.currentTime;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(360, now);
          osc.frequency.linearRampToValueAtTime(780, now + 0.14);
          osc.frequency.linearRampToValueAtTime(500, now + 0.24);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.28);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.3);
        } catch (e) {}
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(playSynth).catch(() => {});
      } else {
        playSynth();
      }
    } else {
      this.playBubblePop(force);
    }
  }

  /**
   * Soft purr on hover
   */
  public playCutePurr(): void {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastSoundTime < 600) return;
    this.lastSoundTime = nowMs;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();

      mod.frequency.value = 16;
      modGain.gain.value = 28;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.linearRampToValueAtTime(590, now + 0.22);

      mod.connect(osc.frequency);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.035);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(ctx.destination);

      mod.start(now);
      osc.start(now);
      mod.stop(now + 0.28);
      osc.stop(now + 0.28);
    } catch (e) {}
  }

  public playPurr(): void {
    this.playCutePurr();
  }

  /**
   * Footsteps
   */
  public playFootstep(): void {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - this.lastFootstepTime < 180) return;
    this.lastFootstepTime = nowMs;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450 + Math.random() * 80, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.045);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.2, now + 0.008);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.055);
    } catch (e) {}
  }

  /**
   * Random Cute Hamster Sound (Force=true guarantees sound plays even if muted)
   */
  public playRandomCuteSound(force: boolean = false): void {
    const sounds = [
      () => this.playHamsterSqueak(force),
      () => this.playCuteGiggle(force),
      () => this.playCuteNomNom(force),
      () => this.playCelebrationChime(force),
      () => this.playBubblePop(force),
      () => this.playBoing(force)
    ];
    const randomIndex = Math.floor(Math.random() * sounds.length);
    sounds[randomIndex]();
  }

  // --- Cartoon Speech Synthesizer ---
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeaking: boolean = false;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;

  public speakCute(text: string, onEnd?: () => void): void {
    if (!this.soundEnabled) {
      if (onEnd) onEnd();
      return;
    }
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    const now = Date.now();
    if (text === this.lastSpokenText && now - this.lastSpokenTime < 3500) {
      if (onEnd) onEnd();
      return;
    }
    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    try {
      window.speechSynthesis.cancel();
      this.isSpeaking = true;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.pitch = 1.92;
      utterance.rate = 1.06;
      utterance.volume = 0.95;

      if (this.voices.length === 0) {
        this.voices = window.speechSynthesis.getVoices();
      }

      const preferred =
        this.voices.find(
          (v) =>
            (v.name.includes('Shelley') ||
              v.name.includes('Sandy') ||
              v.name.includes('Flo') ||
              v.name.includes('Samantha') ||
              v.name.includes('Victoria') ||
              v.name.includes('Karen') ||
              v.name.includes('Google US English') ||
              v.name.includes('Tessa') ||
              v.name.includes('Zira')) &&
            v.lang.startsWith('en')
        ) ||
        this.voices.find((v) => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male')) ||
        this.voices.find((v) => v.lang.startsWith('en')) ||
        this.voices[0];

      if (preferred) {
        utterance.voice = preferred;
      }

      const cleanup = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      utterance.onend = cleanup;
      utterance.onerror = cleanup;

      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    } catch (e) {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }

  public speakCustomerGreeting(): void {
    this.playHamsterSqueak(true);
    setTimeout(() => {
      this.speakCute("Hi! I'm Momo! I'll help you find the right vendors for your event!");
    }, 120);
  }

  public speakGreeting(): void {
    this.playCelebrationChime(true);
    setTimeout(() => {
      this.speakCute("Hi! I'm Momo, your Happy Moments AI Assistant! Let's find your dream vendors!");
    }, 150);
  }
}

export const momoSound = new MomoSoundEngine();
