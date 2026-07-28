// On-device voice coach via the Web Speech API — completely free, no network.
// Falls back silently where speech synthesis isn't available.

let preferred = null;        // chosen SpeechSynthesisVoice
let preferredName = null;    // chosen voice name (persisted in settings)

function allVoices() {
  if (!("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices() || [];
}

// Novelty / robotic system voices (mostly macOS/iOS) — never worth coaching with.
const NOVELTY = /Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Wobble|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Zarvox|Fred|Ralph|Kathy|Junior|Deranged|Hysterical|Bruce|Agnes|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley|Flo|Eddy|Rishi\b|Sandy|novelty/i;
// Named voices that sound clearly better than the compact defaults.
const GOOD = /Siri|Samantha|Alex|Aaron|Nicky|Ava|Allison|Susan|Tom|Zoe|Nathan|Evan|Karen|Daniel|Serena|Moira|Google/i;

// Quality tier for a voice: 3 = enhanced/premium, 2 = known-good, 1 = ok, 0 = skip.
function tierOf(v) {
  if (NOVELTY.test(v.name)) return 0;
  if (/enhanced|premium|neural|siri/i.test(v.name)) return 3;
  if (GOOD.test(v.name) || !v.localService) return 2; // network (Google) voices sound better
  return 1;
}

// English voices, best-first, novelty voices dropped. Each: {name, lang, tier, recommended}.
export function listVoices() {
  const seen = new Set();
  return allVoices()
    .filter((v) => /^en/i.test(v.lang))
    .map((v) => ({ name: v.name, lang: v.lang, tier: tierOf(v) }))
    .filter((v) => v.tier > 0 && !seen.has(v.name) && seen.add(v.name))
    .map((v) => ({ ...v, recommended: v.tier >= 2 }))
    .sort((a, b) => {
      const us = (x) => (/en[-_]US/i.test(x.lang) ? 1 : 0);
      return b.tier - a.tier || us(b) - us(a) || a.name.localeCompare(b.name);
    });
}

function autoPick() {
  const ranked = listVoices();
  if (ranked.length) {
    const best = ranked[0];
    return allVoices().find((v) => v.name === best.name) || null;
  }
  const voices = allVoices();
  return voices.find((v) => /^en/i.test(v.lang)) || voices[0] || null;
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

export function setVoiceName(name) {
  preferredName = name || null;
  preferred = autoPick();
}

// ---------------- coach delivery styles ----------------
// Same voice, different energy — tune rate/pitch to give the coach character.
export const COACH_STYLES = {
  hype:     { rate: 1.14, pitch: 1.06, label: "Hype",     blurb: "Fast, fired-up" },
  balanced: { rate: 1.03, pitch: 1.0,  label: "Balanced", blurb: "Natural pace" },
  calm:     { rate: 0.94, pitch: 0.96, label: "Calm",     blurb: "Steady, composed" },
  drill:    { rate: 1.08, pitch: 0.9,  label: "Drill Sgt", blurb: "Deep, commanding" },
};
let styleKey = "balanced";
export function setCoachStyle(key) {
  if (COACH_STYLES[key]) styleKey = key;
}

export function speak(text, opts = {}) {
  try {
    if (!("speechSynthesis" in window)) return;
    const s = COACH_STYLES[styleKey] || COACH_STYLES.balanced;
    const { rate = s.rate, pitch = s.pitch, volume = 1 } = opts;
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
