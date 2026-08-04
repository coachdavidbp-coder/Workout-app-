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
// Decoding is kept separate from playing on purpose. Fetching and decoding
// can happen the moment the splash mounts; playing can't happen until a tap,
// because iOS won't let a page make a sound before one.
// =========================================================

import thunderUrl from "../assets/intro-thunder.mp3";

// Where the transient sits, in seconds from the start of the clip.
export const CRACK_AT = 0.031;

let pending = null;

// Decode once, then hand the same buffer back. Returns null rather than
// throwing if the file can't be fetched or decoded — a silent intro is a far
// better outcome than one that breaks on the way in.
export function loadIntroSound(ctx) {
  if (!ctx) return Promise.resolve(null);
  if (!pending) {
    pending = fetch(thunderUrl)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(r.status))))
      .then((buf) => ctx.decodeAudioData(buf))
      .catch(() => null);
  }
  return pending;
}

// Play so the crack lands `impactIn` seconds from now. A negative value means
// the impact has already gone — the unlock came late — so the clip starts part
// way in rather than firing a crack for a frame that's been and gone.
export function playIntroSound(ctx, dest, buffer, impactIn, gain = 1) {
  if (!ctx || !dest || !buffer) return null;
  try {
    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(g).connect(dest);

    const lead = impactIn - CRACK_AT;   // when the clip itself should begin
    if (lead >= 0) {
      src.start(ctx.currentTime + lead);
    } else {
      const offset = -lead;
      if (offset >= buffer.duration - 0.05) return null;   // nothing left worth playing
      src.start(ctx.currentTime, offset);
    }
    return src;
  } catch (e) {
    return null;
  }
}
