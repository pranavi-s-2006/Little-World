// audioService.js — Central Background Music & Sound Effects Service
// Uses Web Audio API procedural synthesis by default (zero broken assets / zero 404s)
// and supports optional custom audio files placed under /public/audio/bgm/ and /public/audio/sfx/.

export const MUSIC_ASSET_PATHS = {
  morning:     '/audio/bgm/morning-peaceful.mp3',
  afternoon:   '/audio/bgm/afternoon-cheerful.mp3',
  evening:     '/audio/bgm/evening-relaxing.mp3',
  night:       '/audio/bgm/night-lullaby.mp3',
  rainy:       '/audio/bgm/rainy-day.mp3',
  study:       '/audio/bgm/study-focus.mp3',
  playroom:    '/audio/bgm/playroom-fun.mp3',
  garden:      '/audio/bgm/garden-breeze.mp3',
  celebration: '/audio/bgm/celebration.mp3',
};

export const SFX_ASSET_PATHS = {
  click:           '/audio/sfx/click.mp3',
  transition:      '/audio/sfx/transition.mp3',
  footsteps:       '/audio/sfx/footsteps.mp3',
  eat:             '/audio/sfx/eat.mp3',
  drink:           '/audio/sfx/drink.mp3',
  doorOpen:        '/audio/sfx/door-open.mp3',
  doorClose:       '/audio/sfx/door-close.mp3',
  rain:            '/audio/sfx/rain.mp3',
  birds:           '/audio/sfx/birds.mp3',
  wind:            '/audio/sfx/wind.mp3',
  waterPlant:      '/audio/sfx/water-plant.mp3',
  achievement:     '/audio/sfx/achievement.mp3',
  levelUp:         '/audio/sfx/level-up.mp3',
  birthday:        '/audio/sfx/birthday.mp3',
  minigameSuccess: '/audio/sfx/minigame-success.mp3',
  minigameFail:    '/audio/sfx/minigame-fail.mp3',
};

// Gentle pentatonic/major scales (Hz) for each music mood
const BGM_PATTERNS = {
  morning:     { notes: [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 392.00], tempoMs: 780,  wave: 'sine',     gain: 0.055 },
  afternoon:   { notes: [587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 739.99, 587.33], tempoMs: 620,  wave: 'triangle', gain: 0.045 },
  evening:     { notes: [440.00, 523.25, 587.33, 659.25, 523.25, 493.88, 440.00, 392.00], tempoMs: 920,  wave: 'sine',     gain: 0.05  },
  night:       { notes: [392.00, 493.88, 523.25, 440.00, 392.00, 329.63, 392.00, 329.63], tempoMs: 1150, wave: 'sine',     gain: 0.042 },
  rainy:       { notes: [440.00, 523.25, 659.25, 587.33, 493.88, 440.00, 392.00, 440.00], tempoMs: 960,  wave: 'sine',     gain: 0.045 },
  study:       { notes: [523.25, 659.25, 587.33, 698.46, 659.25, 523.25, 493.88, 523.25], tempoMs: 850,  wave: 'sine',     gain: 0.04  },
  playroom:    { notes: [659.25, 783.99, 880.00, 783.99, 1046.5, 880.00, 783.99, 659.25], tempoMs: 480,  wave: 'triangle', gain: 0.045 },
  garden:      { notes: [523.25, 587.33, 659.25, 880.00, 783.99, 659.25, 587.33, 659.25], tempoMs: 740,  wave: 'sine',     gain: 0.05  },
  celebration: { notes: [523.25, 659.25, 783.99, 1046.5, 880.00, 783.99, 880.00, 1046.5], tempoMs: 420,  wave: 'triangle', gain: 0.055 },
};

export function resolveMusicCategory({ timeOfDay = 'morning', room = 'bedroom', weatherId = 'sunny', isCelebrating = false }) {
  if (isCelebrating) return 'celebration';
  if (room === 'study') return 'study';
  if (room === 'playroom') return 'playroom';
  if (room === 'garden') return weatherId === 'rainy' || weatherId === 'heavy_rain' || weatherId === 'thunderstorm' ? 'rainy' : 'garden';
  if (weatherId === 'rainy' || weatherId === 'heavy_rain' || weatherId === 'thunderstorm') return 'rainy';
  return BGM_PATTERNS[timeOfDay] ? timeOfDay : 'morning';
}

class AudioService {
  constructor() {
    this.ctx = null;
    this.unlocked = false;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;

    this.currentTrack = null;
    this.bgmTimer = null;
    this.bgmStep = 0;

    this.prefs = {
      musicOn: true,
      sfxOn: true,
      muted: false,
      musicVolume: 0.5,
      sfxVolume: 0.65,
    };

    this.sfxCooldowns = new Map();
  }

  unlock() {
    if (this.unlocked && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return true;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return false;
    try {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.bgmGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.bgmGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.unlocked = true;
      this.applyVolumes();
      if (this.currentTrack && this.prefs.musicOn && !this.prefs.muted) {
        this.startSynthLoop(this.currentTrack);
      }
      return true;
    } catch {
      return false;
    }
  }

  updatePrefs(nextPrefs = {}) {
    this.prefs = { ...this.prefs, ...nextPrefs };
    this.applyVolumes();
    if (!this.prefs.musicOn || this.prefs.muted) {
      this.stopBgmLoop();
    } else if (this.unlocked && this.currentTrack && !this.bgmTimer) {
      this.startSynthLoop(this.currentTrack);
    }
  }

  applyVolumes() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const masterVal = this.prefs.muted ? 0 : 1;
    const bgmVal = this.prefs.musicOn ? Math.max(0, Math.min(1, this.prefs.musicVolume ?? 0.5)) : 0;
    const sfxVal = this.prefs.sfxOn ? Math.max(0, Math.min(1, this.prefs.sfxVolume ?? 0.65)) : 0;

    this.masterGain.gain.setTargetAtTime(masterVal, now, 0.08);
    this.bgmGain.gain.setTargetAtTime(bgmVal, now, 0.15);
    this.sfxGain.gain.setTargetAtTime(sfxVal, now, 0.05);
  }

  setMusicTrack(category) {
    if (!category || !BGM_PATTERNS[category]) return;
    if (this.currentTrack === category && this.bgmTimer) return; // avoid restarting unnecessarily
    this.currentTrack = category;
    this.bgmStep = 0;

    if (!this.unlocked || !this.prefs.musicOn || this.prefs.muted) return;

    // Smooth fade out & restart with new pattern
    if (this.bgmGain && this.ctx) {
      const now = this.ctx.currentTime;
      this.bgmGain.gain.setTargetAtTime(0.01, now, 0.18);
      setTimeout(() => {
        if (this.currentTrack === category && this.prefs.musicOn && !this.prefs.muted) {
          this.applyVolumes();
          this.startSynthLoop(category);
        }
      }, 240);
    } else {
      this.startSynthLoop(category);
    }
  }

  stopBgmLoop() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  startSynthLoop(category) {
    this.stopBgmLoop();
    const pattern = BGM_PATTERNS[category] ?? BGM_PATTERNS.morning;
    const playNote = () => {
      if (!this.ctx || !this.bgmGain || !this.prefs.musicOn || this.prefs.muted || document.hidden) return;
      if (this.ctx.state === 'suspended') return;

      const freq = pattern.notes[this.bgmStep % pattern.notes.length];
      this.bgmStep += 1;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();

      osc.type = pattern.wave;
      osc.frequency.setValueAtTime(freq, now);

      const dur = (pattern.tempoMs / 1000) * 0.85;
      noteGain.gain.setValueAtTime(0.0001, now);
      noteGain.gain.linearRampToValueAtTime(pattern.gain, now + 0.05);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      osc.connect(noteGain);
      noteGain.connect(this.bgmGain);
      osc.start(now);
      osc.stop(now + dur + 0.04);
    };

    playNote();
    this.bgmTimer = setInterval(playNote, pattern.tempoMs);
  }

  playSfx(name) {
    if (!this.unlocked || !this.ctx || !this.sfxGain) return;
    if (!this.prefs.sfxOn || this.prefs.muted) return;

    const nowMs = Date.now();
    const lastMs = this.sfxCooldowns.get(name) ?? 0;
    if (nowMs - lastMs < 130) return; // prevent excessive overlapping
    this.sfxCooldowns.set(name, nowMs);

    if (this.ctx.state === 'suspended') return;
    const now = this.ctx.currentTime;

    const playTone = (freq, endFreq, dur, wave = 'sine', vol = 0.14, delay = 0) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now + delay);
      if (endFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + delay + dur);
      }
      g.gain.setValueAtTime(0.0001, now + delay);
      g.gain.linearRampToValueAtTime(vol, now + delay + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, now + delay + dur);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(now + delay);
      osc.stop(now + delay + dur + 0.02);
    };

    switch (name) {
      case 'click':
        playTone(660, 880, 0.07, 'sine', 0.1);
        break;
      case 'transition':
        playTone(440, 620, 0.14, 'sine', 0.09);
        break;
      case 'footsteps':
        playTone(170, 120, 0.06, 'triangle', 0.08, 0);
        playTone(185, 130, 0.06, 'triangle', 0.08, 0.16);
        break;
      case 'eat':
        playTone(380, 520, 0.08, 'triangle', 0.11, 0);
        playTone(460, 600, 0.08, 'triangle', 0.1, 0.12);
        break;
      case 'drink':
      case 'waterPlant':
        playTone(520, 780, 0.12, 'sine', 0.1, 0);
        playTone(660, 920, 0.12, 'sine', 0.09, 0.1);
        break;
      case 'doorOpen':
        playTone(320, 480, 0.15, 'triangle', 0.1);
        break;
      case 'doorClose':
        playTone(440, 260, 0.15, 'triangle', 0.1);
        break;
      case 'birds':
        playTone(1350, 1750, 0.09, 'sine', 0.07, 0);
        playTone(1550, 1950, 0.09, 'sine', 0.07, 0.12);
        break;
      case 'rain':
      case 'wind':
        playTone(260, 210, 0.35, 'sine', 0.05);
        break;
      case 'achievement':
      case 'levelUp':
      case 'birthday':
        playTone(523.25, 523.25, 0.14, 'triangle', 0.14, 0);
        playTone(659.25, 659.25, 0.14, 'triangle', 0.14, 0.11);
        playTone(783.99, 783.99, 0.16, 'triangle', 0.15, 0.22);
        playTone(1046.5, 1046.5, 0.32, 'triangle', 0.16, 0.34);
        break;
      case 'minigameSuccess':
        playTone(587.33, 587.33, 0.12, 'triangle', 0.13, 0);
        playTone(783.99, 783.99, 0.12, 'triangle', 0.13, 0.1);
        playTone(1046.5, 1046.5, 0.25, 'triangle', 0.14, 0.2);
        break;
      case 'minigameFail':
        playTone(360, 240, 0.22, 'sine', 0.11, 0);
        break;
      default:
        playTone(580, 700, 0.08, 'sine', 0.08);
    }
  }
}

export const audioService = new AudioService();
