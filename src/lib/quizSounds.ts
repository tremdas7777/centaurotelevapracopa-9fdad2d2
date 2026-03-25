const audioCtx = () => new (window.AudioContext || (window as any).webkitAudioContext)();

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  try {
    const ctx = audioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export function playCorrectSound() {
  playTone(523, 0.15, 'sine', 0.25);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.25), 100);
  setTimeout(() => playTone(784, 0.3, 'sine', 0.3), 200);
}

export function playWrongSound() {
  playTone(300, 0.2, 'square', 0.15);
  setTimeout(() => playTone(250, 0.35, 'square', 0.15), 150);
}

export function playRevealSound() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, 'sine', 0.2), i * 120);
  });
  setTimeout(() => playTone(1047, 0.6, 'triangle', 0.3), 500);
}
