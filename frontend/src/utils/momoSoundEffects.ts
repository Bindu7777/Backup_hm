// Web Audio API Synthesizer for Momo Bot Cute Sound Effects
// 100% native, zero external audio files needed, works offline and instantly!

class MomoSoundEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private lastFootstepTime: number = 0;

  constructor() {
    // Read user sound preference from localStorage
    const saved = localStorage.getItem('momo_sound_enabled');
    this.soundEnabled = saved !== null ? saved === 'true' : true;
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

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('momo_sound_enabled', String(this.soundEnabled));
    if (this.soundEnabled) {
      this.playChirp();
    }
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    localStorage.setItem('momo_sound_enabled', String(enabled));
  }

  /**
   * Adorable high-pitched chirp / squeak
   */
  public playChirp(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Rising frequency sweep
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      // Volume envelope
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {
      // Ignore audio policy errors
    }
  }

  /**
   * Playful giggles / multi-chirp happy reaction
   */
  public playHappyGiggle(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [784, 988, 1175, 1568]; // G5, B5, D6, G6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.06;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.15, noteTime + 0.05);

        gain.gain.setValueAtTime(0.01, noteTime);
        gain.gain.linearRampToValueAtTime(0.15, noteTime + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.08);
      });
    } catch (e) {}
  }

  /**
   * Soft cute pitter-patter footsteps while walking
   */
  public playFootstep(): void {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    // Throttle footsteps so they don't overlap too closely
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

      gain.gain.setValueAtTime(0.01, now);
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
   * Springy cute "boing" jump / pickup sound
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
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(740, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.28);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.32);
    } catch (e) {}
  }

  /**
   * Magical sparkling bell chime for tips / milestones
   */
  public playChime(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const notes = [1046.5, 1318.5, 1567.98, 2093.0]; // C6, E6, G6, C7
      const now = ctx.currentTime;

      notes.forEach((freq, i) => {
        const time = now + i * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0.01, time);
        gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(time);
        osc.stop(time + 0.36);
      });
    } catch (e) {}
  }

  /**
   * Cute purr / affectionate trill
   */
  public playPurr(): void {
    if (!this.soundEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Modulator for purr vibrato
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();

      mod.frequency.value = 18; // 18Hz flutter
      modGain.gain.value = 35; // depth

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(560, now + 0.25);

      mod.connect(osc.frequency);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      mod.start(now);
      osc.start(now);
      mod.stop(now + 0.32);
      osc.stop(now + 0.32);
    } catch (e) {}
  }

  private voices: SpeechSynthesisVoice[] = [];
  private isSpeaking: boolean = false;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;

  private loadVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    this.voices = window.speechSynthesis.getVoices();
  }

  /**
   * Speak with a sweet, ultra-cute cartoon mascot voice (No duplicate voices!)
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

    // Anti-duplicate protection: Ignore identical speech within 3.5 seconds
    const now = Date.now();
    if (text === this.lastSpokenText && now - this.lastSpokenTime < 3500) {
      if (onEnd) onEnd();
      return;
    }
    this.lastSpokenText = text;
    this.lastSpokenTime = now;

    try {
      // Cancel previous speech to guarantee only one voice at a time!
      window.speechSynthesis.cancel();
      this.isSpeaking = true;

      const utterance = new SpeechSynthesisUtterance(text);
      // Ultra-cute high cartoon mascot pitch
      utterance.pitch = 1.92;
      utterance.rate = 1.06;
      utterance.volume = 0.95;

      if (this.voices.length === 0) {
        this.voices = window.speechSynthesis.getVoices();
      }

      // Prioritize the sweetest, softest, most adorable voices on macOS and Windows
      const preferred = this.voices.find(v => 
        (v.name.includes('Shelley') || // macOS Child/Cute
         v.name.includes('Sandy') ||   // macOS Child/Cute
         v.name.includes('Flo') ||     // Sweet
         v.name.includes('Samantha') || 
         v.name.includes('Victoria') || 
         v.name.includes('Karen') || 
         v.name.includes('Google US English') ||
         v.name.includes('Tessa') ||
         v.name.includes('Zira')) &&
        v.lang.startsWith('en')
      ) || this.voices.find(v => v.lang.startsWith('en') && !v.name.toLowerCase().includes('male'))
        || this.voices.find(v => v.lang.startsWith('en'))
        || this.voices[0];

      if (preferred) {
        utterance.voice = preferred;
      }

      const cleanup = () => {
        this.isSpeaking = false;
        if (onEnd) onEnd();
      };

      utterance.onend = cleanup;
      utterance.onerror = cleanup;

      // Small delay after cancel so browser speech synth doesn't clip
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 50);
    } catch (e) {
      this.isSpeaking = false;
      if (onEnd) onEnd();
    }
  }

  public speakCatchMe(): void {
    this.playChirp();
    setTimeout(() => {
      this.speakCute('Hey Hima! Hey Hima! Catch me!');
    }, 120);
  }

  public speakCaught(): void {
    this.playHappyGiggle();
    setTimeout(() => {
      this.speakCute('Yay! You caught me Hima! I love you!');
    }, 200);
  }

  public speakTooSlow(): void {
    this.playBoing();
    setTimeout(() => {
      this.speakCute('Hehe! Too slow Hima! Catch me if you can!');
    }, 120);
  }

  public speakGreeting(): void {
    this.playChime();
    setTimeout(() => {
      this.speakCute('Hi Hima! Look at my hands and legs move! I love walking around with you!');
    }, 150);
  }

  public speakStats(): void {
    this.playChime();
    setTimeout(() => {
      this.speakCute('Hima, check out WhatsApp and Instagram stats! Everything looks amazing!');
    }, 150);
  }
}

export const momoSound = new MomoSoundEngine();
