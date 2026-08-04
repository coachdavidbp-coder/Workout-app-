// =========================================================
// The sound over the opening: one thunder clip, landing on the impact.
//
// This replaced a synthesised slam built out of oscillators. The recording
// does the job better than anything that could be generated, and it costs
// 46 KB, so there's no reason to keep building one from parts.
//
// The crack sits 31 ms into the file, so lining it up with the frame where
// the mark lands means starting the clip 31 ms *before* that, not on it.
//
// Three things about iOS shape everything below.
//
// One: nothing makes a sound before a tap, so fetching is split from playing
// — the bytes can come down at mount, the noise can't.
//
// Two: Safari has a long history of leaving decodeAudioData hanging when the
// context is suspended, and never settling. So the decode waits for a running
// context, is capped by a timeout, and a failure is never cached — otherwise
// one bad attempt on a cold start means silence for the rest of the session.
//
// Three: when Web Audio won't cooperate at all, a plain <audio> element still
// will, provided it was touched during the tap itself. That's the fallback,
// and it's why priming happens in the gesture handler rather than later.
// =========================================================

import thunderUrl from "../assets/intro-thunder.mp3";

// Where the transient sits, in seconds from the start of the clip.
export const CRACK_AT = 0.031;
const DECODE_TIMEOUT = 4000;

let bytes = null;      // Promise<ArrayBuffer|null> — fetched once, kept whole
let buffer = null;     // AudioBuffer, once a decode has actually worked
let decoding = null;   // in-flight decode, so two callers share one attempt

// Pull the file down. No AudioContext needed, so this is safe at mount.
export function prefetchIntroSound() {
  if (!bytes) {
    bytes = fetch(thunderUrl)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null);
  }
  return bytes;
}

// decodeAudioData both takes a callback and returns a promise depending on
// how old the engine is, and on Safari it can do neither. Cover all three, and
// give up after a while rather than hanging on to a promise that never
// settles. The buffer is copied because decoding detaches it, and a failed
// attempt has to leave the bytes intact for the next one.
function decode(ctx, raw) {
  return new Promise((resolve) => {
    let settled = false;
    const done = (b) => { if (!settled) { settled = true; resolve(b || null); } };
    const timer = setTimeout(() => done(null), DECODE_TIMEOUT);
    const ok = (b) => { clearTimeout(timer); done(b); };
    const bad = () => { clearTimeout(timer); done(null); };
    try {
      const p = ctx.decodeAudioData(raw.slice(0), ok, bad);
      if (p && typeof p.then === "function") p.then(ok, bad);
    } catch (e) {
      bad();
    }
  });
}

// The decoded clip if there already is one. Callers that can't afford to wait
// — the intro has a frame to hit — ask for this rather than the promise.
export const introBuffer = () => buffer;

// Hand back the decoded clip, decoding it if this is the first ask. Returns
// null rather than throwing — a silent intro beats one that breaks on the way
// in — and a null is never remembered, so the next attempt starts clean.
export function loadIntroSound(ctx) {
  if (buffer) return Promise.resolve(buffer);
  if (!ctx) return Promise.resolve(null);
  if (!decoding) {
    decoding = prefetchIntroSound()
      .then((raw) => (raw ? decode(ctx, raw) : null))
      .then((b) => { buffer = b; decoding = null; return b; })
      .catch(() => { decoding = null; return null; });
  }
  return decoding;
}

// ---------------------------------------------------------
// The <audio> fallback.
//
// An element that was played once inside a real tap stays playable
// afterwards, which is the only lever left when Web Audio won't decode.
// ---------------------------------------------------------
let el = null;
let primed = false;

// Call this synchronously inside a tap handler, alongside unlockAudio().
export function primeIntroSound() {
  try {
    if (!el) {
      el = new Audio(thunderUrl);
      el.preload = "auto";
      el.playsInline = true;
    }
    const p = el.play();
    const stop = () => { try { el.pause(); el.currentTime = 0; primed = true; } catch (e) { /* ignore */ } };
    if (p && typeof p.then === "function") p.then(stop, () => {});
    else stop();
  } catch (e) { /* ignore */ }
  return el;
}

// Silence the fallback. The Web Audio path is cut by disconnecting its bus,
// which does nothing to an <audio> element playing on its own.
export function stopIntroSound() {
  try { el?.pause(); if (el) el.currentTime = 0; } catch (e) { /* ignore */ }
}

// Play the element so the crack lands `impactIn` seconds from now. Only worth
// reaching for when there's no decoded buffer — the timing is at the mercy of
// setTimeout rather than the audio clock.
function playElement(impactIn) {
  if (!el || !primed) return false;
  const go = () => {
    try {
      el.currentTime = impactIn < CRACK_AT ? Math.min(CRACK_AT - impactIn, 3) : 0;
      el.play()?.catch?.(() => {});
    } catch (e) { /* ignore */ }
  };
  const lead = (impactIn - CRACK_AT) * 1000;
  if (lead > 10) setTimeout(go, lead);
  else go();
  return true;
}

// Play so the crack lands `impactIn` seconds from now. A negative value means
// the impact has already gone — the unlock came late — so the clip starts part
// way in rather than firing a crack for a frame that's been and gone.
export function playIntroSound(ctx, dest, buf, impactIn, gain = 1) {
  if (!buf || !ctx || !dest) return playElement(impactIn) ? "element" : null;
  try {
    const src = ctx.createBufferSource();
    src.buffer = buf;

    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(dest);

    const lead = impactIn - CRACK_AT;   // when the clip itself should begin
    if (lead >= 0) {
      src.start(ctx.currentTime + lead);
    } else {
      const offset = -lead;
      if (offset >= buf.duration - 0.05) return null;   // nothing left worth playing
      src.start(ctx.currentTime, offset);
    }
    return src;
  } catch (e) {
    return playElement(impactIn) ? "element" : null;
  }
}
