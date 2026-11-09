// Web Audio API Synthesizer for Momo Bot Cute Sound Effects
// 100% native Web Audio API, zero external audio files needed, works offline and instantly!

type SoundListener = (enabled: boolean) => void;

class MomoSoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private lastFootstepTime: number = 0;
  private lastSoundTime: number = 0;
  private listeners: SoundListener[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('momo_sound_enabled');
        this.soundEnabled = saved !== null ? saved === 'true' : true;
      } catch (e) {
        this.soundEnabled = true;
      }
    }
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
      this.playHamsterSqueak();
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
   * Signature Hamster Squeak / Peep
   * High-pitched, warm, friendly upward chirp
   */
  public playHamsterSqueak(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Sweet rising sweep from 850Hz to 1650Hz
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(1750, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(1420, now + 0.14);

      // Volume envelope with gentle attack & decay
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {}
  }

  /**
   * Backward-compatible alias for playHamsterSqueak
   */
  public playChirp(): void {
    this.playHamsterSqueak();
  }

  /**
   * Playful Bubbly Pop
   * Perfect for speech bubbles, minimizing/opening, and button taps
   */
  public playBubblePop(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Bubbly downward drop
      osc.frequency.setValueAtTime(820, now);
      osc.frequency.exponentialRampToValueAtTime(280, now + 0.07);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  /**
   * Hamster Happy Giggle
   * 4 rapid, cheerful, bouncy squeaks
   */
  public playCuteGiggle(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [880, 1108, 1318, 1760]; // A5, C#6, E6, A6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.055;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.14, noteTime + 0.035);

        gain.gain.setValueAtTime(0.001, noteTime);
        gain.gain.linearRampToValueAtTime(0.14, noteTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.06);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.065);
      });
    } catch (e) {}
  }

  /**
   * Alias for playCuteGiggle
   */
  public playHappyGiggle(): void {
    this.playCuteGiggle();
  }

  /**
   * Adorable Hamster Nom-Nom / Snacking Sound
   * Rapid little cute nibbles
   */
  public playCuteNomNom(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [0, 0.075, 0.15].forEach((offset, idx) => {
        const t = now + offset;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        const baseFreq = 1250 + idx * 90;
        osc.frequency.setValueAtTime(baseFreq, t);
        osc.frequency.exponentialRampToValueAtTime(580, t + 0.035);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t);
        osc.stop(t + 0.045);
      });
    } catch (e) {}
  }

  /**
   * Celebration Chime / Magical Glissando
   * Played when matching vendors, finding deals, or completing requests
   */
  public playCelebrationChime(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [659.25, 783.99, 1046.5, 1318.5, 1567.98]; // E5, G5, C6, E6, G6
      const now = ctx.currentTime;

      notes.forEach((freq, i) => {
        const time = now + i * 0.065;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.001, time);
        gain.gain.linearRampToValueAtTime(0.14, time + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.34);
      });
    } catch (e) {}
  }

  /**
   * Alias for playCelebrationChime
   */
  public playChime(): void {
    this.playCelebrationChime();
  }

  /**
   * Cute Boing / Spring Jump Sound
   */
  public playBoing(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(340, now);
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.16);
      osc.frequency.exponentialRampToValueAtTime(520, now + 0.26);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.17, now + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  /**
   * Soft affectionate purr / trill (gentle on hover)
   */
  public playCutePurr(): void {
    if (!this.soundEnabled) return;
    // Throttle purrs to avoid audio mud
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

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.035);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

      osc.connect(gain);
      gain.connect(ctx.destination);

      mod.start(now);
      osc.start(now);
      mod.stop(now + 0.28);
      osc.stop(now + 0.28);
    } catch (e) {}
  }

  /**
   * Alias for playCutePurr
   */
  public playPurr(): void {
    this.playCutePurr();
  }

  /**
   * Soft cute pitter-patter footsteps
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
      const filter = ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.value = 1400;
      filter.Q.value = 3;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.045);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.055);
    } catch (e) {}
  }

  /**
   * Random Cute Hamster Sound
   * Plays a different delightful cute sound every time the customer taps Momo!
   */
  public playRandomCuteSound(): void {
    const sounds = [
      () => this.playHamsterSqueak(),
      () => this.playCuteGiggle(),
      () => this.playCuteNomNom(),
      () => this.playCelebrationChime(),
      () => this.playBubblePop(),
      () => this.playBoing()
    ];
    const randomIndex = Math.floor(Math.random() * sounds.length);
    sounds[randomIndex]();
  }

  // --- Cartoon Speech Synthesizer ---
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeaking: boolean = false;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;

  /**
   * Speak with a sweet, ultra-cute cartoon mascot voice
   */
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

  /**
   * Sweet customer greeting
   */
  public speakCustomerGreeting(): void {
    this.playHamsterSqueak();
    setTimeout(() => {
      this.speakCute("Hi! I'm Momo! I'll help you find the right vendors for your event!");
    }, 120);
  }

  public speakGreeting(): void {
    this.playCelebrationChime();
    setTimeout(() => {
      this.speakCute("Hi! I'm Momo, your Happy Moments AI Assistant! Let's find your dream vendors!");
    }, 150);
  }
}

export const momoSound = new MomoSoundEngine();
