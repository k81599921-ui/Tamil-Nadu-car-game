import { CarModelId, RadioStationId } from '../types/game';

// Frequencies in Hz (Base Sa = C4 = 261.63 Hz)
const HAMSADHWANI = [261.63, 293.66, 329.63, 392.0, 493.88, 523.25, 587.33, 659.25];
const MOHANAM = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
const KUTHU_BASS = [65.41, 65.41, 77.78, 87.31, 98.0, 87.31, 77.78, 98.0];
const KUTHU_LEAD = [523.25, 622.25, 587.33, 523.25, 392.0, 466.16, 523.25, 698.46];

// Curated Carnatic melodic phrases (index into scale, -1 = sustain/rest)
const MARABU_PHRASES: number[][] = [
  [0, 1, 2, 3, 4, 5, -1, 4, 3, 2, 1, 0, -1, -1, 2, 3],
  [3, 4, 5, 6, 7, 5, -1, 5, 4, 3, 4, 2, -1, 1, 2, 0],
  [0, 2, 3, 5, -1, 4, 5, 6, 5, 4, 3, 2, 3, 1, 0, -1],
  [5, -1, 4, 3, 2, 3, 4, 5, 7, 6, 5, 3, 2, 1, 0, -1],
];

const NILGIRI_PHRASES: number[][] = [
  [0, -1, 2, -1, 3, 4, 5, -1, 4, -1, 3, 2, 1, -1, 0, -1],
  [3, -1, 5, -1, 6, -1, 5, 4, 3, -1, 2, -1, 1, 2, 3, -1],
  [5, -1, 4, 3, 2, -1, 3, 4, 3, -1, 2, 1, 0, -1, -1, -1],
];

class IsaiAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freqBins = new Uint8Array(32);

  // Drone nodes for Carnatic / Flute stations
  private droneGain: GainNode | null = null;
  private droneOscs: OscillatorNode[] = [];

  // Continuous car engine & drift nodes
  private engineGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private driftGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private station: RadioStationId = 'marabu';
  private muted = false;
  private musicVolume = 0.68;
  private sfxVolume = 0.58;
  private carModel: CarModelId = 'kaveri_gt';
  private isPlayingDriving = false;

  // Sequencer scheduling
  private seqTimer: number | null = null;
  private stepIndex = 0;
  private phraseIndex = 0;
  private lastNoteFreq = 261.63;
  private nextNoteTime = 0;

  public init(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.18;

    const masterGain = ctx.createGain();
    masterGain.gain.value = this.muted ? 0 : 0.9;
    this.masterGain = masterGain;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.75;
    this.analyser = analyser;

    const musicGain = ctx.createGain();
    musicGain.gain.value = this.musicVolume;
    this.musicGain = musicGain;

    const sfxGain = ctx.createGain();
    sfxGain.gain.value = this.sfxVolume;
    this.sfxGain = sfxGain;

    musicGain.connect(compressor);
    sfxGain.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Pre-build reusable white noise buffer for Thavil, hi-hats, ocean, and tire drift
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;

    this.setupDrone(ctx, musicGain);
    this.setupCarEngine(ctx, sfxGain);
    this.startSequencer();
  }

  private setupDrone(ctx: AudioContext, destination: AudioNode): void {
    const droneGain = ctx.createGain();
    droneGain.gain.value = this.station === 'marabu' ? 0.07 : this.station === 'nilgiri' ? 0.045 : 0;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 680;

    // Gentle Tanpura shimmer LFO
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.22;
    lfoGain.gain.value = 220;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const freqs = [130.81, 196.0, 261.63]; // Sa - Pa - Sa
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 1 ? 'triangle' : 'sawtooth';
      osc.frequency.value = f;
      osc.detune.value = (idx - 1) * 4;
      osc.connect(filter);
      osc.start();
      this.droneOscs.push(osc);
    });

    filter.connect(droneGain);
    droneGain.connect(destination);
    this.droneGain = droneGain;
  }

  private setupCarEngine(ctx: AudioContext, destination: AudioNode): void {
    const engineGain = ctx.createGain();
    engineGain.gain.value = 0;

    const engineFilter = ctx.createBiquadFilter();
    engineFilter.type = 'lowpass';
    engineFilter.frequency.value = 260;
    engineFilter.Q.value = 2.8;

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 55;

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 110;

    osc1.connect(engineFilter);
    osc2.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(destination);

    osc1.start();
    osc2.start();

    this.engineOsc1 = osc1;
    this.engineOsc2 = osc2;
    this.engineFilter = engineFilter;
    this.engineGain = engineGain;

    // Continuous drift tire screech channel
    if (this.noiseBuffer) {
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = this.noiseBuffer;
      noiseSrc.loop = true;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 1350;
      bandpass.Q.value = 4.5;

      const driftGain = ctx.createGain();
      driftGain.gain.value = 0;

      noiseSrc.connect(bandpass);
      bandpass.connect(driftGain);
      driftGain.connect(destination);
      noiseSrc.start();
      this.driftGain = driftGain;
    }
  }

  private startSequencer(): void {
    if (this.seqTimer !== null || !this.ctx) return;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.seqTimer = window.setInterval(() => this.scheduleNotes(), 45);
  }

  private scheduleNotes(): void {
    if (!this.ctx || !this.musicGain) return;
    if (this.ctx.state !== 'running') return;

    const lookAhead = 0.14;
    while (this.nextNoteTime < this.ctx.currentTime + lookAhead) {
      this.triggerStep(this.stepIndex, this.nextNoteTime);
      const stepDuration =
        this.station === 'turbo'
          ? 60 / 132 / 2 // 132 BPM eighth notes
          : this.station === 'marabu'
            ? 60 / 98 / 2 // 98 BPM Carnatic Adi Tala pulse
            : 60 / 78 / 2; // 78 BPM Serene Nilgiri flute
      this.nextNoteTime += stepDuration;
      this.stepIndex = (this.stepIndex + 1) % 16;
      if (this.stepIndex === 0) {
        this.phraseIndex = (this.phraseIndex + 1) % 4;
      }
    }
  }

  private triggerStep(step: number, time: number): void {
    if (this.station === 'off' || this.muted || this.musicVolume <= 0.01) return;

    if (this.station === 'marabu') {
      this.playMarabuStep(step, time);
    } else if (this.station === 'turbo') {
      this.playTurboStep(step, time);
    } else if (this.station === 'nilgiri') {
      this.playNilgiriStep(step, time);
    }
  }

  // Station 1: Traditional Tamil Nadaswaram + Thavil + Miruthangam
  private playMarabuStep(step: number, time: number): void {
    if (!this.ctx || !this.musicGain) return;
    const scale = this.phraseIndex % 2 === 0 ? HAMSADHWANI : MOHANAM;
    const phrase = MARABU_PHRASES[this.phraseIndex % MARABU_PHRASES.length];
    const deg = phrase[step];

    if (deg >= 0) {
      const freq = scale[deg];
      this.playNadaswaramNote(freq, this.lastNoteFreq, time, 0.34);
      this.lastNoteFreq = freq;
    }

    // Thavil & Miruthangam Adi Tala rhythmic cycle
    if (step === 0 || step === 6 || step === 10) {
      this.playThavilBass(time, step === 0 ? 0.28 : 0.2);
    }
    if (step === 3 || step === 4 || step === 8 || step === 12 || step === 14) {
      this.playMiruthangamTone(time, step === 8 ? 392.0 : 261.63, 0.14);
    }
    if (step % 2 === 1) {
      this.playPercTick(time, 2400, 0.035);
    }
  }

  private playNadaswaramNote(
    freq: number,
    prevFreq: number,
    time: number,
    duration: number
  ): void {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc2.detune.value = 6;

    // Characteristic Carnatic gamaka glide into target swara
    const glideStart = Math.abs(freq - prevFreq) < 180 ? prevFreq : freq * 0.96;
    osc1.frequency.setValueAtTime(glideStart, time);
    osc1.frequency.exponentialRampToValueAtTime(freq, time + 0.045);
    osc2.frequency.setValueAtTime(glideStart, time);
    osc2.frequency.exponentialRampToValueAtTime(freq, time + 0.045);

    // Subtle expressive vibrato
    const vib = ctx.createOscillator();
    const vibGain = ctx.createGain();
    vib.frequency.value = 5.6;
    vibGain.gain.value = freq * 0.011;
    vib.connect(vibGain);
    vibGain.connect(osc1.frequency);
    vibGain.connect(osc2.frequency);

    // Double-reed nasal formant filter
    const formant = ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.frequency.value = 1180;
    formant.Q.value = 2.2;

    const warmth = ctx.createBiquadFilter();
    warmth.type = 'lowpass';
    warmth.frequency.value = 2850;

    const env = ctx.createGain();
    env.gain.setValueAtTime(0.001, time);
    env.gain.linearRampToValueAtTime(0.18, time + 0.03);
    env.gain.exponentialRampToValueAtTime(0.12, time + duration * 0.7);
    env.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc1.connect(formant);
    osc2.connect(formant);
    formant.connect(warmth);
    warmth.connect(env);
    env.connect(this.musicGain);

    osc1.start(time);
    osc2.start(time);
    vib.start(time);
    osc1.stop(time + duration + 0.02);
    osc2.stop(time + duration + 0.02);
    vib.stop(time + duration + 0.02);
  }

  private playThavilBass(time: number, level: number): void {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(145, time);
    osc.frequency.exponentialRampToValueAtTime(58, time + 0.13);

    env.gain.setValueAtTime(level, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.22);

    osc.connect(env);
    env.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.24);
  }

  private playMiruthangamTone(time: number, pitch: number, level: number): void {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * 1.03, time);
    osc.frequency.exponentialRampToValueAtTime(pitch, time + 0.03);

    env.gain.setValueAtTime(level, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.19);

    osc.connect(env);
    env.connect(this.musicGain);
    osc.start(time);
    osc.stop(time + 0.2);
  }

  // Station 2: Chennai Turbo FM (Kuthu Rhythm + Synthwave Racing)
  private playTurboStep(step: number, time: number): void {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;

    // Punchy racing kick + syncopated Kuthu dappankuthu bounce
    if (step === 0 || step === 3 || step === 6 || step === 8 || step === 11 || step === 14) {
      const kick = ctx.createOscillator();
      const kEnv = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(155, time);
      kick.frequency.exponentialRampToValueAtTime(42, time + 0.11);
      kEnv.gain.setValueAtTime(0.32, time);
      kEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
      kick.connect(kEnv);
      kEnv.connect(this.musicGain);
      kick.start(time);
      kick.stop(time + 0.19);
    }

    // Crisp Tasha / Snare hits on backbeats + Kuthu roll on 15
    if (step === 4 || step === 12 || step === 15) {
      this.playPercTick(time, 1450, step === 15 ? 0.11 : 0.18);
    } else if (step % 2 === 1) {
      this.playPercTick(time, 5200, 0.045);
    }

    // Driving octave synth bass
    const bassFreq = KUTHU_BASS[Math.floor(step / 2) % KUTHU_BASS.length] * (step % 2 === 1 ? 2 : 1);
    const bass = ctx.createOscillator();
    const bFilter = ctx.createBiquadFilter();
    const bEnv = ctx.createGain();
    bass.type = 'sawtooth';
    bass.frequency.setValueAtTime(bassFreq, time);
    bFilter.type = 'lowpass';
    bFilter.frequency.setValueAtTime(920, time);
    bFilter.frequency.exponentialRampToValueAtTime(240, time + 0.16);
    bEnv.gain.setValueAtTime(0.16, time);
    bEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.18);
    bass.connect(bFilter);
    bFilter.connect(bEnv);
    bEnv.connect(this.musicGain);
    bass.start(time);
    bass.stop(time + 0.19);

    // Energetic synth lead motif
    if (step % 2 === 0 || step === 7 || step === 13) {
      const leadFreq =
        KUTHU_LEAD[(step + this.phraseIndex * 2) % KUTHU_LEAD.length] *
        (this.phraseIndex === 3 ? 1.5 : 1);
      const lead = ctx.createOscillator();
      const lEnv = ctx.createGain();
      const lFilter = ctx.createBiquadFilter();
      lead.type = 'square';
      lead.frequency.setValueAtTime(leadFreq, time);
      lFilter.type = 'lowpass';
      lFilter.frequency.value = 2400;
      lEnv.gain.setValueAtTime(0.09, time);
      lEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.21);
      lead.connect(lFilter);
      lFilter.connect(lEnv);
      lEnv.connect(this.musicGain);
      lead.start(time);
      lead.stop(time + 0.22);
    }
  }

  // Station 3: Nilgiri Breeze FM (Bansuri Flute + Plucked Veena Arpeggio)
  private playNilgiriStep(step: number, time: number): void {
    if (!this.ctx || !this.musicGain) return;
    const ctx = this.ctx;

    // Gentle plucked Veena/Harp arpeggio on every step
    const arpFreq = MOHANAM[(step * 2 + this.phraseIndex) % 6] * 0.5;
    const pluck = ctx.createOscillator();
    const pEnv = ctx.createGain();
    pluck.type = 'triangle';
    pluck.frequency.setValueAtTime(arpFreq, time);
    pEnv.gain.setValueAtTime(0.1, time);
    pEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.36);
    pluck.connect(pEnv);
    pEnv.connect(this.musicGain);
    pluck.start(time);
    pluck.stop(time + 0.38);

    // Serene Bansuri bamboo flute melody
    const phrase = NILGIRI_PHRASES[this.phraseIndex % NILGIRI_PHRASES.length];
    const deg = phrase[step];
    if (deg >= 0) {
      const freq = MOHANAM[deg];
      const flute = ctx.createOscillator();
      const fEnv = ctx.createGain();
      flute.type = 'sine';
      flute.frequency.setValueAtTime(this.lastNoteFreq, time);
      flute.frequency.exponentialRampToValueAtTime(freq, time + 0.08);
      this.lastNoteFreq = freq;

      fEnv.gain.setValueAtTime(0.001, time);
      fEnv.gain.linearRampToValueAtTime(0.19, time + 0.09);
      fEnv.gain.exponentialRampToValueAtTime(0.001, time + 0.62);

      flute.connect(fEnv);
      fEnv.connect(this.musicGain);
      flute.start(time);
      flute.stop(time + 0.65);
    }
  }

  private playPercTick(time: number, filterFreq: number, level: number): void {
    if (!this.ctx || !this.musicGain || !this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 1.8;
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(level, time);
    env.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.musicGain);
    src.start(time);
    src.stop(time + 0.09);
  }

  // Update car engine RPM and tire screech every animation frame (zero allocations)
  public updateVehicleAudio(
    speedKmh: number,
    throttleActive: boolean,
    isDrifting: boolean,
    isBoosting: boolean,
    drivingActive: boolean
  ): void {
    this.isPlayingDriving = drivingActive;
    if (!this.ctx || !this.engineGain || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter) {
      return;
    }

    const now = this.ctx.currentTime;
    if (!drivingActive || this.muted) {
      this.engineGain.gain.setTargetAtTime(0, now, 0.06);
      if (this.driftGain) this.driftGain.gain.setTargetAtTime(0, now, 0.05);
      return;
    }

    const basePitch =
      this.carModel === 'kaveri_gt'
        ? 62
        : this.carModel === 'nilgiri_4x4'
          ? 44
          : 50;
    // Simulated 5-speed gear sawtooth RPM curve
    const gearMod = ((speedKmh % 46) / 46) * 0.65 + (speedKmh / 220) * 0.85;
    const boostMul = isBoosting ? 1.24 : 1.0;
    const targetFreq = basePitch * (1 + gearMod * 1.9) * boostMul;

    this.engineOsc1.frequency.setTargetAtTime(targetFreq, now, 0.04);
    this.engineOsc2.frequency.setTargetAtTime(targetFreq * 1.5, now, 0.04);
    this.engineFilter.frequency.setTargetAtTime(
      240 + speedKmh * 5.2 + (throttleActive ? 220 : 0) + (isBoosting ? 450 : 0),
      now,
      0.05
    );

    const targetGain = 0.045 + Math.min(speedKmh / 220, 1) * 0.075 + (throttleActive ? 0.03 : 0);
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);

    if (this.driftGain) {
      const screech = isDrifting && speedKmh > 35 ? Math.min((speedKmh - 30) / 140, 1) * 0.14 : 0;
      this.driftGain.gain.setTargetAtTime(screech, now, 0.04);
    }
  }

  public setCarModel(model: CarModelId): void {
    this.carModel = model;
  }

  public setStation(station: RadioStationId): void {
    this.station = station;
    this.init();
    if (this.ctx && this.droneGain) {
      const droneTarget =
        station === 'marabu' ? 0.07 : station === 'nilgiri' ? 0.045 : 0;
      this.droneGain.gain.setTargetAtTime(droneTarget, this.ctx.currentTime, 0.15);
    }
  }

  public cycleStation(): RadioStationId {
    const order: RadioStationId[] = ['marabu', 'turbo', 'nilgiri', 'off'];
    const next = order[(order.indexOf(this.station) + 1) % order.length];
    this.setStation(next);
    return next;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.9, this.ctx.currentTime, 0.04);
    }
  }

  public setMusicVolume(vol: number): void {
    this.musicVolume = vol;
    if (this.ctx && this.musicGain) {
      this.musicGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
  }

  public setSfxVolume(vol: number): void {
    this.sfxVolume = vol;
    if (this.ctx && this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
  }

  // Cultural & Gameplay One-Shot Sound Effects
  public playTempleBell(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    // Authentic bronze temple bell inharmonic partials
    const partials = [523.25, 1054.0, 1588.0, 2210.0];
    partials.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      const amp = 0.18 / (idx + 1);
      env.gain.setValueAtTime(amp, now);
      env.gain.exponentialRampToValueAtTime(0.0008, now + 2.2 - idx * 0.35);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 2.3);
    });
  }

  public playCoastalWave(): void {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now);
    filter.frequency.linearRampToValueAtTime(750, now + 0.7);
    filter.frequency.linearRampToValueAtTime(220, now + 1.8);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.14, now + 0.65);
    env.gain.exponentialRampToValueAtTime(0.001, now + 1.9);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    src.start(now);
    src.stop(now + 2.0);
  }

  public playCheckpoint(): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.065);
      env.gain.setValueAtTime(0.18, now + i * 0.065);
      env.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.32);
      osc.connect(env);
      env.connect(this.sfxGain);
      osc.start(now + i * 0.065);
      osc.stop(now + i * 0.065 + 0.35);
    });
  }

  public playNitroWhoosh(): void {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer || this.muted) return;
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.exponentialRampToValueAtTime(1900, now + 0.35);
    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.18, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    src.connect(filter);
    filter.connect(env);
    env.connect(this.sfxGain);
    src.start(now);
    src.stop(now + 0.45);
  }

  public playImpact(strength = 0.6): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.14);
    env.gain.setValueAtTime(Math.min(0.28, strength * 0.26), now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playCountdownBeep(isGo: boolean): void {
    if (!this.ctx || !this.sfxGain || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isGo ? 880 : 440, now);
    env.gain.setValueAtTime(0.2, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + (isGo ? 0.38 : 0.18));
    osc.connect(env);
    env.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public getVisualizerBars(outBars: [number, number, number, number, number]): void {
    if (!this.analyser || this.muted || (this.station === 'off' && !this.isPlayingDriving)) {
      outBars[0] = 0.15;
      outBars[1] = 0.15;
      outBars[2] = 0.15;
      outBars[3] = 0.15;
      outBars[4] = 0.15;
      return;
    }
    this.analyser.getByteFrequencyData(this.freqBins);
    outBars[0] = Math.max(0.16, this.freqBins[1] / 255);
    outBars[1] = Math.max(0.16, this.freqBins[3] / 255);
    outBars[2] = Math.max(0.16, this.freqBins[6] / 255);
    outBars[3] = Math.max(0.16, this.freqBins[10] / 255);
    outBars[4] = Math.max(0.16, this.freqBins[15] / 255);
  }
}

export const isaiAudio = new IsaiAudioEngine();
