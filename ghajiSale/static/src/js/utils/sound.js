// ─── POS Audio Feedback System ─────────────────────────────────────────────────
// Plays lightweight success and warning sounds for important POS events only.
// Avoids sounds on every UI interaction to prevent auditory overload.
// Uses Web Audio API with fallback silencing on error.
// ─────────────────────────────────────────────────────────────────────────────

let audioContext = null;

// Initialize audio context lazily on first use (some browsers require user interaction)
const getAudioContext = () => {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (err) {
      console.warn("Audio context unavailable:", err.message);
      return null;
    }
  }
  return audioContext;
};

/**
 * Play a sound for a POS event
 * @param {string} type - Sound type: 'success' (beep), 'error' (buzz), 'warning' (alert)
 */
export const playSound = (type = "success") => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return; // Silently fail if audio unavailable

    switch (type) {
      case "success":
        // Success: two ascending tones (product added, transaction complete)
        playTone(ctx, 800, 100);
        setTimeout(() => playTone(ctx, 1000, 150), 120);
        break;
      case "error":
      case "warning":
        // Warning/Error: single lower tone (out of stock, invalid barcode)
        playTone(ctx, 400, 200);
        break;
      default:
        console.warn(`Unknown sound type: ${type}`);
    }
  } catch (err) {
    console.warn("Sound playback failed:", err.message);
  }
};

/**
 * Play a single tone using Web Audio oscillator
 * @private
 * @param {AudioContext} audioContext
 * @param {number} frequency - Frequency in Hz
 * @param {number} duration - Duration in milliseconds
 */
const playTone = (audioContext, frequency, duration) => {
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect oscillator → gain node → speakers
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure oscillator frequency and shape
    oscillator.frequency.value = frequency;
    oscillator.type = "sine";

    // Smooth volume envelope: fade in and out to avoid clicks
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + duration / 1000,
    );

    // Play the tone for the specified duration
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  } catch (err) {
    console.warn("Tone playback failed:", err.message);
  }
};
