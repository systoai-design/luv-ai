/**
 * Sound effects utility using Web Audio API
 * Provides audio feedback to complement haptic feedback
 */

export type SoundType = 'tap' | 'swipe' | 'threshold' | 'like' | 'pass' | 'superlike' | 'match' | 'cancel';

// Audio context singleton
let audioContext: AudioContext | null = null;

/**
 * Get or create the audio context
 */
const getAudioContext = (): AudioContext | null => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.debug('Web Audio API not supported:', error);
      return null;
    }
  }
  return audioContext;
};

/**
 * Play a frequency with specific parameters
 */
const playTone = (
  frequency: number,
  duration: number,
  volume: number = 0.15,
  type: OscillatorType = 'sine'
) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (error) {
    console.debug('Error playing sound:', error);
  }
};

/**
 * Play a chord (multiple frequencies)
 */
const playChord = (frequencies: number[], duration: number, volume: number = 0.1) => {
  frequencies.forEach(freq => playTone(freq, duration, volume / frequencies.length));
};

/**
 * Trigger sound effect
 * @param type - The type of sound effect
 */
export const playSound = (type: SoundType): void => {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume audio context on user interaction (required by browsers)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const sounds: Record<SoundType, () => void> = {
    // Light tap for drag start
    tap: () => playTone(800, 0.05, 0.1),
    
    // Quick swipe sound for movement
    swipe: () => playTone(600, 0.08, 0.12),
    
    // Medium tone for threshold crossing
    threshold: () => playTone(1000, 0.1, 0.15, 'triangle'),
    
    // Positive ascending tone for like
    like: () => {
      playTone(659.25, 0.08, 0.12); // E5
      setTimeout(() => playTone(783.99, 0.1, 0.15), 50); // G5
    },
    
    // Negative descending tone for pass
    pass: () => {
      playTone(523.25, 0.08, 0.12); // C5
      setTimeout(() => playTone(392.00, 0.1, 0.12), 50); // G4
    },
    
    // Special sparkle sound for super like
    superlike: () => {
      playTone(1046.50, 0.08, 0.1); // C6
      setTimeout(() => playTone(1318.51, 0.08, 0.1), 60); // E6
      setTimeout(() => playTone(1567.98, 0.12, 0.12), 120); // G6
    },
    
    // Celebratory chord for match
    match: () => {
      // Major chord: C5, E5, G5
      playChord([523.25, 659.25, 783.99], 0.4, 0.2);
      setTimeout(() => {
        // Higher octave: C6, E6, G6
        playChord([1046.50, 1318.51, 1567.98], 0.5, 0.25);
      }, 100);
    },
    
    // Subtle cancel sound for spring-back
    cancel: () => playTone(400, 0.1, 0.08),
  };

  try {
    sounds[type]?.();
  } catch (error) {
    // Silently fail if sound cannot be played
    console.debug('Sound playback failed:', error);
  }
};

/**
 * Initialize audio context on user interaction
 * Call this on first user interaction to enable sounds
 */
export const initAudio = (): void => {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume();
  }
};
