// On-device voice coach via the Web Speech API — completely free, no network.
// Falls back silently on platforms without speech synthesis.

let preferred = null;

function pickVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  // prefer a natural en-US voice
  preferred =
    voices.find((v) => /en-US/i.test(v.lang) && /Samantha|Google US|Aaron|Nathan/i.test(v.name)) ||
    voices.find((v) => /en-US/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    voices[0];
  return preferred;
}

if ("speechSynthesis" in window) {
  // voices load async on some browsers
  window.speechSynthesis.onvoiceschanged = pickVoice;
  pickVoice();
}

export function speak(text, { rate = 1.02, pitch = 1, volume = 1 } = {}) {
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.voice = preferred || pickVoice();
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
    // don't stack — cancel any queued line first so cues stay snappy
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}

export function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch (e) { /* ignore */ }
}

export const ENCOURAGE = [
  "Keep it up!",
  "Stay locked in.",
  "You've got this — finish strong.",
  "That's the work. Don't stop now.",
  "Us versus them. Let's go.",
  "Dig in. One more.",
  "Looking strong — keep that pace.",
  "This is where it counts.",
];

export function randomEncouragement() {
  return ENCOURAGE[(Math.random() * ENCOURAGE.length) | 0];
}
