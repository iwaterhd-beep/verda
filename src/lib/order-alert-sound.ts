let audioCtx: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

/** Desbloquea el audio tras un gesto del usuario (política del navegador). */
export function unlockOrderAlertSound() {
  const ctx = getAudioContext();
  if (!ctx || ctx.state === "running") return;
  void ctx.resume();
}

export function playNewOrderAlertSound() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("verda-order-sound-muted") === "1") return;

  const ctx = getAudioContext();
  if (!ctx) return;

  const playTone = (freq: number, start: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  };

  const now = ctx.currentTime;
  playTone(880, now, 0.12);
  playTone(1174.66, now + 0.14, 0.16);
}

export function isOrderAlertSoundMuted() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("verda-order-sound-muted") === "1";
}

export function setOrderAlertSoundMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem("verda-order-sound-muted", muted ? "1" : "0");
}
