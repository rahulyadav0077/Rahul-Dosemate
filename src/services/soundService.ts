// DoseMate Web Audio Alarm Synthesizer Service
// High reliability sound synthesis without relying on external audio files

class SoundService {
  private audioCtx: AudioContext | null = null;
  private loopInterval: number | null = null;
  private isPlaying = false;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Pre-warm audio on user interaction to comply with browser autoplay policy
  public unlockAudio(): void {
    try {
      const ctx = this.getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch {
      // ignore
    }
  }

  // Play a single sequence note
  private playTone(frequency: number, type: OscillatorType, duration: number, delay: number, volume: number) {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);

      const normalizedVol = Math.max(0, Math.min(1, volume / 100)) * 0.4;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(normalizedVol, ctx.currentTime + delay + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + duration + 0.05);
    } catch (e) {
      console.warn('Audio synthesis error:', e);
    }
  }

  // Play a short motif based on the chosen sound type
  private playMotif(soundType: 'chime' | 'digital' | 'melodic' | 'bell', volume: number) {
    switch (soundType) {
      case 'chime':
        // Pleasant hospital/medical chime: C5 (523), E5 (659), G5 (784), C6 (1046)
        this.playTone(523.25, 'sine', 0.4, 0.0, volume);
        this.playTone(659.25, 'sine', 0.4, 0.15, volume);
        this.playTone(783.99, 'sine', 0.5, 0.30, volume);
        this.playTone(1046.5, 'sine', 0.8, 0.45, volume);
        break;

      case 'digital':
        // Digital beeps
        this.playTone(880, 'square', 0.15, 0.0, volume * 0.7);
        this.playTone(880, 'square', 0.15, 0.2, volume * 0.7);
        this.playTone(880, 'square', 0.15, 0.4, volume * 0.7);
        this.playTone(1174.66, 'square', 0.35, 0.65, volume * 0.8);
        break;

      case 'bell':
        // Resonant bell tone
        this.playTone(740, 'triangle', 0.8, 0.0, volume);
        this.playTone(1480, 'sine', 0.6, 0.02, volume * 0.6);
        this.playTone(880, 'triangle', 0.9, 0.4, volume);
        this.playTone(1760, 'sine', 0.7, 0.42, volume * 0.6);
        break;

      case 'melodic':
      default:
        // Gentle marimba motif
        this.playTone(440, 'sine', 0.3, 0.0, volume);
        this.playTone(554.37, 'sine', 0.3, 0.18, volume);
        this.playTone(659.25, 'sine', 0.3, 0.36, volume);
        this.playTone(880, 'sine', 0.6, 0.54, volume);
        break;
    }
  }

  // Start continuous alarm
  public startAlarm(
    soundType: 'chime' | 'digital' | 'melodic' | 'bell' = 'chime',
    volume: number = 80,
    maxDurationSeconds: number = 120
  ): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.unlockAudio();

    // Play immediately
    this.playMotif(soundType, volume);

    // Loop interval (every 2.2 seconds)
    this.loopInterval = window.setInterval(() => {
      if (!this.isPlaying) return;
      this.playMotif(soundType, volume);
    }, 2200);

    // Auto-silence safety timeout (e.g. 2 minutes)
    if (maxDurationSeconds > 0) {
      window.setTimeout(() => {
        if (this.isPlaying) {
          this.stopAlarm();
        }
      }, maxDurationSeconds * 1000);
    }
  }

  // Stop the alarm sound immediately
  public stopAlarm(): void {
    this.isPlaying = false;
    if (this.loopInterval !== null) {
      window.clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
  }

  // Preview / Test sound once
  public previewSound(soundType: 'chime' | 'digital' | 'melodic' | 'bell', volume: number = 80): void {
    this.unlockAudio();
    this.playMotif(soundType, volume);
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const soundService = new SoundService();
