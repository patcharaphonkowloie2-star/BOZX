// Retro Sound and Music Synthesizer for "Dan E san - Golden Fields"
// Uses the Web Audio API to generate bright, cheerful Isan-style folk phin tones and happy percussion.

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private bgmVolumeNode: GainNode | null = null;
  private sfxVolumeNode: GainNode | null = null;
  private bgmIntervalId: any = null;
  private isMuted: boolean = false;
  // Bright G-Major Pentatonic scale (cheerful Isan folk style)
  private notes: number[] = [196, 220, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88, 587.33, 659.25, 784.00, 880.00];
  private sequence: number[] = [5, 6, 7, 5, 8, 7, 6, 5, 7, 8, 9, 7, 8, 6, 7, 5]; // Happy major progression
  private seqIndex: number = 0;
  private isBgmPlaying: boolean = false;

  constructor() {
    // Lazy initialized on first click
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);

      this.bgmVolumeNode = this.ctx.createGain();
      this.bgmVolumeNode.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.bgmVolumeNode.connect(this.masterVolume);

      this.sfxVolumeNode = this.ctx.createGain();
      this.sfxVolumeNode.gain.setValueAtTime(0.65, this.ctx.currentTime);
      this.sfxVolumeNode.connect(this.masterVolume);
    } catch (e) {
      console.warn("Web Audio API not supported", e);
    }
  }

  setVolumes(bgmVol: number, sfxVol: number) {
    this.init();
    if (!this.ctx) return;
    
    if (this.bgmVolumeNode) {
      this.bgmVolumeNode.gain.setValueAtTime(bgmVol * 0.35, this.ctx.currentTime);
    }
    if (this.sfxVolumeNode) {
      this.sfxVolumeNode.gain.setValueAtTime(sfxVol * 0.65, this.ctx.currentTime);
    }
  }

  toggleMute(): boolean {
    this.init();
    if (!this.ctx || !this.masterVolume) return this.isMuted;
    this.isMuted = !this.isMuted;
    this.masterVolume.gain.setValueAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime);
    return this.isMuted;
  }

  getMutedStatus() {
    return this.isMuted;
  }

  // Play a happy soft click SFX
  playClick() {
    this.init();
    if (!this.ctx || !this.sfxVolumeNode || this.isMuted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // Play cartoon springy jump sound
  playJump() {
    this.init();
    if (!this.ctx || !this.sfxVolumeNode || this.isMuted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(520, this.ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);
  }

  // Play shiny bubble sound when delicious items are collected
  playCollect() {
    this.init();
    if (!this.ctx || !this.sfxVolumeNode || this.isMuted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    // Shiny C major arpeggio
    osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.06); // E5
    osc.frequency.setValueAtTime(783.99, this.ctx.currentTime + 0.12); // G5
    osc.frequency.exponentialRampToValueAtTime(1046.50, this.ctx.currentTime + 0.35); // C6

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(329.63, this.ctx.currentTime); // E4
    osc2.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc.start();
    osc2.start();
    
    osc.stop(this.ctx.currentTime + 0.4);
    osc2.stop(this.ctx.currentTime + 0.4);
  }

  // Play a funny cartoon slip/bubble bump sound instead of scary scream
  playHit() {
    this.init();
    if (!this.ctx || !this.sfxVolumeNode || this.isMuted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxVolumeNode);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  // Play a sweet, pleasant victory / retry arpeggio
  playGameOver() {
    this.init();
    if (!this.ctx || !this.sfxVolumeNode || this.isMuted) return;
    this.stopBgm();
    
    const notes = [392, 440, 523.25, 659.25]; // G4, A4, C5, E5
    const times = [0, 0.15, 0.3, 0.45];
    
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + times[idx]);
      
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime + times[idx]);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + times[idx] + 0.4);
      
      osc.connect(gain);
      gain.connect(this.sfxVolumeNode!);
      
      osc.start(this.ctx.currentTime + times[idx]);
      osc.stop(this.ctx.currentTime + times[idx] + 0.45);
    });
  }

  // Play a happy, fast-paced Isan folk phin track with woodblock percussion
  startBgm() {
    this.init();
    if (!this.ctx || !this.bgmVolumeNode || this.isBgmPlaying || this.isMuted) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    this.isBgmPlaying = true;
    const tempo = 120; // Lively, happy Isan tempo (120 BPM)
    const stepDuration = 60 / tempo; // Seconds per beat

    const playStep = () => {
      if (!this.ctx || !this.bgmVolumeNode || !this.isBgmPlaying) return;

      const noteIdx = this.sequence[this.seqIndex];
      const freq = this.notes[noteIdx % this.notes.length];

      // Play "Bright Happy Phin pluck"
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      // Bright pluck release
      osc.frequency.linearRampToValueAtTime(freq * 1.005, this.ctx.currentTime + 0.22);
      
      gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.bgmVolumeNode);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.26);

      // Play Upbeat Woodblock Percussion on beats
      if (this.seqIndex % 2 === 0) {
        const wb = this.ctx.createOscillator();
        const wbGain = this.ctx.createGain();
        wb.type = 'sine';
        wb.frequency.setValueAtTime(600, this.ctx.currentTime);
        wb.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
        wbGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        wbGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
        wb.connect(wbGain);
        wbGain.connect(this.bgmVolumeNode);
        wb.start();
        wb.stop(this.ctx.currentTime + 0.06);
      }

      // Play sweet chime bell every 4 beats
      if (this.seqIndex % 4 === 0) {
        const chime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
        chimeGain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        chime.connect(chimeGain);
        chimeGain.connect(this.bgmVolumeNode);
        chime.start();
        chime.stop(this.ctx.currentTime + 0.36);
      }

      this.seqIndex = (this.seqIndex + 1) % this.sequence.length;
    };

    // Use interval to trigger upbeat folk steps
    this.bgmIntervalId = setInterval(playStep, stepDuration * 1000);
  }

  stopBgm() {
    if (this.bgmIntervalId) {
      clearInterval(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
    this.isBgmPlaying = false;
  }
}

export const audioManager = new SoundManager();
