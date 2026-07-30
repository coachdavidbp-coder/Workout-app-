// =========================================================
// The intro's sound, synthesised. No audio files — nothing to download,
// nothing to license, works offline, adds nothing to the bundle.
//
// The old version was four plain oscillators, which is why it sounded like
// a phone notification rather than a hit. Metal doesn't ring at whole-number
// harmonics; a struck plate rings at a lopsided set of partials that decay at
// different rates, and that mismatch is the whole reason your ear hears
// "metal" instead of "beep". So the slam is built from a real modal set, the
// weight comes from a saturated sub, and everything runs through a generated
// room so it lands in a stadium instead of in your hand.
// =========================================================

// Struck-bar modal ratios. These are the actual inharmonic partials of a
// free-free bar — the reason a girder sounds nothing like a flute.
const MODES = [1, 2.756, 5.404, 8.933, 13.34, 18.64];
const MODE_GAIN = [1, 0.62, 0.42, 0.26, 0.15, 0.09];
const MODE_DECAY = [1.25, 0.95, 0.72, 0.5, 0.36, 0.26];

function noiseBuffer(ctx, seconds, curve = 1) {
  const n = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, curve);
  return buf;
}

// A plate reverb built from decaying noise. A concrete bowl, kept short —
// a long tail sounds impressive in isolation and turns to mud under a
// 2.4-second cut.
function makeReverb(ctx, seconds = 1.4, decay = 4.2) {
  const rate = ctx.sampleRate;
  const n = Math.floor(rate * seconds);
  const ir = ctx.createBuffer(2, n, rate);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < n; i++) {
      // a short pre-delay gap reads as distance
      const t = i / n;
      const gap = i < rate * 0.012 ? 0 : 1;
      d[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay) * gap;
    }
  }
  const conv = ctx.createConvolver();
  conv.buffer = ir;
  return conv;
}

// Gentle saturation — adds harmonics to the sub so it survives a phone
// speaker, which reproduces almost nothing below about 200 Hz.
function saturator(ctx, amount = 12) {
  const ws = ctx.createWaveShaper();
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  ws.curve = curve;
  ws.oversample = "2x";
  return ws;
}

// An AudioParam with nothing scheduled yet sits at its default of 1.0, so a
// node started before its envelope begins screams at full volume until the
// first keyframe lands. Pinning the default silent is what stops that.
const env = (param, t, peak, attack, decay) => {
  param.value = 0.0001;
  param.setValueAtTime(0.0001, t);
  param.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack);
  param.exponentialRampToValueAtTime(0.0001, t + attack + decay);
};

/**
 * Schedules the whole intro soundtrack.
 *
 * @param ctx   a running AudioContext
 * @param dest  node to play into (the splash's master gain)
 * @param at    { impact, shine } — seconds on ctx's clock, or null to skip a
 *              cue that has already gone by
 */
export function scheduleIntroSound(ctx, dest, at = {}) {
  // ---- shared chain ----
  // A soft-clip curve rather than a DynamicsCompressor: the compressor's
  // behaviour differs between engines and Chrome's quietly adds gain, which
  // is how the chrome shimmer ended up as loud as the slam. This has a
  // predictable ceiling everywhere.
  const limiter = ctx.createWaveShaper();
  {
    const n = 2048, curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = Math.tanh(x * 1.6) * 0.92;
    }
    limiter.curve = curve;
    limiter.oversample = "4x";
  }
  limiter.connect(dest);

  const mix = ctx.createGain();       // impact bus: dry + plenty of room
  mix.gain.value = 0.82;
  mix.connect(limiter);

  const air = ctx.createGain();       // shimmer bus: dry, barely any room
  air.gain.value = 0.95;
  air.connect(limiter);

  // The reverb is fed through a lowpass so bright sustained tones can't keep
  // pumping energy into the tail — that build-up was the other half of the
  // shimmer problem.
  const verb = makeReverb(ctx);
  const damp = ctx.createBiquadFilter();
  damp.type = "lowpass";
  damp.frequency.value = 3200;

  const send = ctx.createGain();
  send.gain.value = 0.16;
  mix.connect(send);

  const airSend = ctx.createGain();
  airSend.gain.value = 0.05;
  air.connect(airSend);

  const wet = ctx.createGain();
  wet.gain.value = 0.55;
  send.connect(damp);
  airSend.connect(damp);
  damp.connect(verb).connect(wet).connect(limiter);

  const hit = at.impact;

  if (hit != null) {
    // ---- sub drop: the weight ----
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    const sat = saturator(ctx, 9);
    sub.type = "sine";
    sub.frequency.setValueAtTime(165, hit);
    sub.frequency.exponentialRampToValueAtTime(34, hit + 0.42);
    env(subGain.gain, hit, 0.85, 0.006, 0.85);
    sub.connect(subGain).connect(sat).connect(mix);
    sub.start(hit);
    sub.stop(hit + 1.1);

    // ---- the slam itself: an inharmonic modal set ----
    const base = 196;
    for (let i = 0; i < MODES.length; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = i < 2 ? "triangle" : "sine";
      // a touch of detune per partial stops it sounding synthetic
      o.frequency.value = base * MODES[i] * (1 + (Math.random() - 0.5) * 0.012);
      env(g.gain, hit, 0.30 * MODE_GAIN[i], 0.003, MODE_DECAY[i]);
      o.connect(g).connect(mix);
      o.start(hit);
      o.stop(hit + MODE_DECAY[i] + 0.1);
    }

    // ---- transient: the crack that sells the contact ----
    const tr = ctx.createBufferSource();
    tr.buffer = noiseBuffer(ctx, 0.05, 6);
    const trHp = ctx.createBiquadFilter();
    trHp.type = "highpass";
    trHp.frequency.value = 2600;
    const trG = ctx.createGain();
    trG.gain.value = 0.75;
    tr.connect(trHp).connect(trG).connect(mix);
    tr.start(hit);

    // ---- body of the impact: a filtered noise thump ----
    const body = ctx.createBufferSource();
    body.buffer = noiseBuffer(ctx, 0.5, 2.6);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(1800, hit);
    bp.frequency.exponentialRampToValueAtTime(320, hit + 0.35);
    bp.Q.value = 0.7;
    const bodyG = ctx.createGain();
    bodyG.gain.value = 0.5;
    body.connect(bp).connect(bodyG).connect(mix);
    body.start(hit);

    // ---- debris: chrome flakes hitting the floor ----
    for (let i = 0; i < 14; i++) {
      const t = hit + 0.06 + Math.random() * 0.5;
      const g = ctx.createBufferSource();
      g.buffer = noiseBuffer(ctx, 0.03 + Math.random() * 0.04, 8);
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 1800 + Math.random() * 5200;
      f.Q.value = 3 + Math.random() * 5;
      const gg = ctx.createGain();
      gg.gain.value = 0.05 + Math.random() * 0.12;
      g.connect(f).connect(gg).connect(mix);
      g.start(t);
    }

    // ---- electric crackle over the mark ----
    const cr = ctx.createBufferSource();
    cr.buffer = noiseBuffer(ctx, 0.5, 1.2);
    const crF = ctx.createBiquadFilter();
    crF.type = "bandpass";
    crF.frequency.setValueAtTime(5200, hit + 0.03);
    crF.frequency.exponentialRampToValueAtTime(1500, hit + 0.42);
    crF.Q.value = 6;
    const crG = ctx.createGain();
    // gate it into irregular bursts — steady noise reads as hiss, not sparks
    crG.gain.setValueAtTime(0.0001, hit + 0.03);
    for (let t = 0.04; t < 0.42; t += 0.025 + Math.random() * 0.04) {
      crG.gain.setValueAtTime(0.0001, hit + t);
      crG.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.16, hit + t + 0.006);
      crG.gain.exponentialRampToValueAtTime(0.0001, hit + t + 0.03);
    }
    cr.connect(crF).connect(crG).connect(mix);
    cr.start(hit + 0.03);

    // ---- tail: the room answering back ----
    const tail = ctx.createOscillator();
    const tailG = ctx.createGain();
    tail.type = "sine";
    tail.frequency.setValueAtTime(58, hit + 0.05);
    tail.frequency.exponentialRampToValueAtTime(41, hit + 1.0);
    env(tailG.gain, hit + 0.05, 0.22, 0.06, 1.0);
    tail.connect(tailG).connect(mix);
    tail.start(hit + 0.05);
    tail.stop(hit + 1.3);
  }

  // ---- chrome shimmer riding the shine sweep ----
  const st = at.shine;
  if (st != null) {
    for (let i = 0; i < 3; i++) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      const f0 = [2400, 3550, 5100][i];
      o.frequency.setValueAtTime(f0, st);
      o.frequency.linearRampToValueAtTime(f0 * 1.5, st + 0.34);
      const t0 = st + i * 0.02;
      env(g.gain, t0, 0.05 - i * 0.013, 0.09, 0.3);
      o.connect(g).connect(air);
      o.start(t0);
      o.stop(t0 + 0.5);
    }
    // a breath of air over the top
    const hiss = ctx.createBufferSource();
    hiss.buffer = noiseBuffer(ctx, 0.4, 1.6);
    const airF = ctx.createBiquadFilter();
    airF.type = "highpass";
    airF.frequency.setValueAtTime(5000, st);
    airF.frequency.linearRampToValueAtTime(9000, st + 0.34);
    const airG = ctx.createGain();
    env(airG.gain, st, 0.07, 0.1, 0.28);
    hiss.connect(airF).connect(airG).connect(air);
    hiss.start(st);
  }

  return mix;
}
