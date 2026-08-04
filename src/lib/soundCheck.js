// =========================================================
// Why is there no sound?
//
// Guessing at this from a build machine hasn't worked, because every guess
// has the same symptom: nothing. So this runs the whole chain on the actual
// phone and reports each link.
//
// The step that matters is the last one. An AnalyserNode sits between the
// clip and the speaker and measures what's flowing through it, which splits
// the two cases that otherwise look identical:
//
//   signal measured, nothing heard  → the app is playing; the phone isn't.
//                                     On iOS the ring/silent switch mutes
//                                     Web Audio, and no code can override it.
//   no signal measured              → the app really isn't playing, and the
//                                     step that failed says which link broke.
//
// Must be started from inside a tap — the same rule everything else here
// obeys.
// =========================================================

import { audioCtx, unlockAudio } from "./fx.js";
import { prefetchIntroSound, primeIntroSound } from "./introSound.js";
import thunderUrl from "../assets/intro-thunder.mp3";

const ms = (t) => `${Math.round(t)}ms`;

// Returns [{ label, ok, detail }] — one line per link in the chain.
export async function runSoundCheck() {
  const out = [];
  const add = (label, ok, detail = "") => out.push({ label, ok, detail });

  // 1. a context at all
  const ctx = unlockAudio() || audioCtx();
  if (!ctx) {
    add("Audio engine", false, "this browser has no Web Audio");
    return out;
  }
  add("Audio engine", true, `${Math.round(ctx.sampleRate / 1000)}kHz`);

  // 2. is it allowed to run
  if (ctx.state !== "running") {
    try { await ctx.resume(); } catch (e) { /* reported below */ }
  }
  add("Unlocked", ctx.state === "running", ctx.state);

  // 3. the file
  let raw = null;
  const t0 = performance.now();
  try {
    raw = await prefetchIntroSound();
  } catch (e) { /* null below */ }
  add("Sound file", !!raw, raw ? `${Math.round(raw.byteLength / 1024)}KB in ${ms(performance.now() - t0)}` : "download failed");
  if (!raw) return out;

  // 4. decoding it — the step Safari can leave hanging forever
  const t1 = performance.now();
  const buffer = await new Promise((resolve) => {
    let settled = false;
    const done = (b) => { if (!settled) { settled = true; resolve(b || null); } };
    setTimeout(() => done(null), 4000);
    try {
      const p = ctx.decodeAudioData(raw.slice(0), done, () => done(null));
      if (p && typeof p.then === "function") p.then(done, () => done(null));
    } catch (e) { done(null); }
  });
  add("Decoded", !!buffer,
    buffer ? `${buffer.duration.toFixed(2)}s in ${ms(performance.now() - t1)}` : "gave up after 4s — Safari stalled");

  // 5. push it through and watch the meter
  if (buffer) {
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(analyser).connect(ctx.destination);
    try { src.start(); } catch (e) { add("Playing", false, "the clip would not start"); return out; }

    const data = new Float32Array(analyser.fftSize);
    let peak = 0;
    const until = performance.now() + 1600;
    while (performance.now() < until) {
      analyser.getFloatTimeDomainData(data);
      for (let i = 0; i < data.length; i++) {
        const v = Math.abs(data[i]);
        if (v > peak) peak = v;
      }
      await new Promise((r) => setTimeout(r, 40));
    }
    try { src.stop(); } catch (e) { /* already done */ }

    const loud = peak > 0.02;
    add("Signal to the speaker", loud, loud ? `peak ${(peak * 100).toFixed(0)}%` : "flat — nothing came out");
    return out;
  }

  // 6. no buffer, so try the fallback the intro would use
  const el = primeIntroSound();
  const played = await new Promise((resolve) => {
    if (!el) return resolve(false);
    const t = setTimeout(() => resolve(el.currentTime > 0.1), 1500);
    el.play()?.then?.(() => {}, () => { clearTimeout(t); resolve(false); });
  });
  try { el?.pause(); if (el) el.currentTime = 0; } catch (e) { /* ignore */ }
  add("Fallback player", played, played ? "played" : "blocked");
  return out;
}

// What to tell someone staring at the result.
export function soundVerdict(lines) {
  const by = (l) => lines.find((x) => x.label === l);
  const signal = by("Signal to the speaker");
  if (signal?.ok) {
    return "The app is producing sound. If you can't hear it, the phone isn't playing it — check the ring/silent switch on the side, and turn the volume up while a sound is playing. iOS mutes web audio when that switch is set to silent, and nothing in the app can override it.";
  }
  if (by("Unlocked") && !by("Unlocked").ok) return "The browser won't let audio start. Try again straight after tapping something.";
  if (by("Sound file") && !by("Sound file").ok) return "The sound file didn't download. Check your connection and try again.";
  if (by("Decoded") && !by("Decoded").ok) return "Your browser stalled decoding the clip — that's the Safari bug the intro falls back around. Tell me you saw this.";
  if (signal && !signal.ok) return "The clip played but no signal reached the speaker. Tell me you saw this — it's not something you can fix from your end.";
  return "Something upstream failed. Tell me which line above has the ✗.";
}
