// On-device voice coach via the Web Speech API — completely free, no network.
// Falls back silently where speech synthesis isn't available.

let preferred = null;        // chosen SpeechSynthesisVoice
let preferredName = null;    // chosen voice name (persisted in settings)

function allVoices() {
  if (!("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices() || [];
}

function autoPick() {
  const voices = allVoices();
  if (!voices.length) return null;
  return (
    voices.find((v) => /en-US/i.test(v.lang) && /Samantha|Google US|Aaron|Nathan|Zoe/i.test(v.name)) ||
    voices.find((v) => /en-US/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    voices[0]
  );
}

function resolve() {
  const voices = allVoices();
  if (preferredName) {
    const match = voices.find((v) => v.name === preferredName);
    if (match) return match;
  }
  if (!preferred) preferred = autoPick();
  return preferred;
}

if ("speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => { preferred = autoPick(); };
  preferred = autoPick();
}

// English voices the device offers (for the picker).
export function listVoices() {
  return allVoices()
    .filter((v) => /^en/i.test(v.lang))
    .map((v) => ({ name: v.name, lang: v.lang }));
}

export function setVoiceName(name) {
  preferredName = name || null;
}

export function speak(text, { rate = 1.03, pitch = 1, volume = 1 } = {}) {
  try {
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    const v = resolve();
    if (v) u.voice = v;
    u.rate = rate;
    u.pitch = pitch;
    u.volume = volume;
    window.speechSynthesis.cancel(); // keep cues snappy
    window.speechSynthesis.speak(u);
  } catch (e) { /* ignore */ }
}

export function stopSpeaking() {
  try { window.speechSynthesis?.cancel(); } catch (e) { /* ignore */ }
}

// ---------------- line libraries ----------------
export const ENCOURAGE = [
  "Keep it up!", "Stay locked in.", "You've got this — finish strong.",
  "That's the work. Don't stop now.", "Us versus them. Let's go.",
  "Dig in. One more.", "Looking strong — keep that pace.",
  "This is where it counts.", "Nobody's working harder than you right now.",
  "Eyes up, chest up, keep grinding.", "You're built for this.",
  "Every rep is a deposit. Keep stacking.", "Push past comfortable.",
  "Breathe. Reset. Attack the next one.", "This is the rep that matters.",
  "Champions are made right here.", "Don't count the reps — make the reps count.",
  "Stay in it. You're stronger than the excuse.", "Prove it to yourself today.",
  "Little more. Little more. There it is.", "Own this moment.",
  "You didn't come this far to quit.", "Strong body, stronger mind.",
  "Finish what you started.", "Tired is not a reason to stop.",
  "Make your future self proud.", "Control the controllables — effort's one of them.",
  "That burn means it's working.", "Trust the work. It's paying off.",
  "One percent better today.", "Slow is smooth, smooth is strong.",
  "Show up for yourself right now.", "You against yesterday. Win.",
  "Keep the standard high.", "No wasted reps.",
  "Grit over everything.", "Lock in — the work is the reward.",
  "You're closer than you think.", "Empty the tank.",
  "Discipline now, pride later.", "Be relentless.",
  "This effort compounds. Keep going.", "Head down, keep swinging.",
  "You set the bar — now clear it.", "Stay hungry.",
  "Earn it rep by rep.", "The hard part is where the growth is.",
  "Give me your best set of the day.", "Steady hands, strong mind, keep moving.",
  "That's how it's done — again.",
];

export const WORK_LINES = {
  Sprint: ["Sprint! Go go go!", "Full speed — attack it!", "Explode! Everything you've got!", "Drive those knees — go!", "Fast feet — max effort!"],
  Run: ["Run! Push the pace!", "Strong and steady — go!", "Find your rhythm — push!", "Hold this pace — go!", "Dig in and run!"],
  Work: ["Go! Push!", "Work — max effort!", "Attack it!", "Let's move — go!"],
};

export const REST_LINES = ["Recover.", "Easy — catch your breath.", "Walk it out. Reset.", "Breathe deep. Shake it loose.", "Recover and get ready."];
export const LAST_ROUND_LINES = ["Last one — leave nothing!", "Final round — everything you've got!", "This is the one. Empty the tank!"];
export const HALFWAY_LINES = ["Halfway there — keep pushing!", "You're at the turn. Stay strong!", "Halfway. Don't let up now."];
export const DONE_LINES = ["Done! Great work.", "That's the session — proud of that effort.", "Finished strong. Well done.", "That's a wrap. You earned it."];

let lastLine = "";
export function pickNoRepeat(pool) {
  if (!pool || !pool.length) return "";
  if (pool.length === 1) return pool[0];
  let pick;
  let guard = 0;
  do {
    pick = pool[(Math.random() * pool.length) | 0];
    guard++;
  } while (pick === lastLine && guard < 8);
  lastLine = pick;
  return pick;
}

export function randomEncouragement() {
  return pickNoRepeat(ENCOURAGE);
}
export function workLine(label) {
  return pickNoRepeat(WORK_LINES[label] || WORK_LINES.Work);
}
export function restLine() {
  return pickNoRepeat(REST_LINES);
}
