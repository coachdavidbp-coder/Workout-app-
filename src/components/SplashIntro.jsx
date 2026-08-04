import { useEffect, useRef, useState } from "react";
import { audioCtx, unlockAudio } from "../lib/fx.js";
import { loadIntroSound, playIntroSound } from "../lib/introSound.js";
import logoUrl from "../assets/logo.png";
import vsUrl from "../assets/vs-mark.webp";

// =========================================================
// US VS THEM — cold-start splash. 2.4s, then Home.
//
// Everything is drawn into one canvas on a single requestAnimationFrame
// timeline, so the whole intro is one composite per frame instead of a
// pile of animated DOM nodes. No video, no GIF.
//
//   0.00–0.26  black, blue arcs flicker, dust, glow ramps up
//   0.26–0.76  VS drops in — easeInQuart, motion blur, energy trail
//   0.76       IMPACT — shake, shockwave, flash, 25 debris, 40 sparks, smoke
//   1.00–1.45  VS splits along the lightning bolt, halves part 35px
//   1.45–2.05  US VS THEM fades in behind, spotlight, bloom
//   2.05–2.40  chrome shine sweeps left→right, glow fades, cut to Home
// =========================================================

const DUR = 2400;
const T = {
  dropStart: 260, impact: 760, settle: 1000,
  splitStart: 1000, splitEnd: 1450,
  logoStart: 1450, logoEnd: 2050,
  shineStart: 2050, fadeStart: 2230,
};

const C = {
  blue: "#3D8BFF",
  navy: "#0A1023",
  gunmetal: "#23272F",
  chrome: "#D8DDE6",
  black: "#05070F",
};

// Measured off the artwork itself: the lightning streak sits at 118.2° from
// horizontal, so that's the line the mark comes apart along, with the halves
// parting perpendicular to it.
const BOLT_ANGLE = -1.08; // radians, ≈ -61.8°
const SPLIT_GAP = 38;

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInQuart = (t) => t * t * t * t;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const easeOutQuad = (t) => 1 - (1 - t) * (1 - t);

// A soft round glow, rendered once and stamped with drawImage. Building a
// radial gradient per particle per frame is what kills framerate on a phone.
function glowSprite(inner, outer, size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d");
  const r = size / 2;
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.35, outer);
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

const rand = (a, b) => a + Math.random() * (b - a);

// Whether to hold on the charge-up until you tap. Read straight from
// localStorage rather than the store, because the intro is on screen before
// the store has finished loading.
const GATE_KEY = "uvt:introSound";
export const introSoundOn = () => {
  try { return localStorage.getItem(GATE_KEY) !== "0"; } catch (e) { return true; }
};
export const setIntroSoundOn = (on) => {
  try { localStorage.setItem(GATE_KEY, on ? "1" : "0"); } catch (e) { /* ignore */ }
};

export default function SplashIntro({ onDone }) {
  const canvasRef = useRef(null);
  const doneRef = useRef(false);
  const beginRef = useRef(null);
  // Armed = holding for the tap that both starts the intro and unlocks audio.
  // If the context is already running (a replay, or you've used the app this
  // session) there's nothing to unlock, so don't make you tap for nothing.
  const [armed, setArmed] = useState(() => {
    if (!introSoundOn()) return false;
    try { return audioCtx()?.state !== "running"; } catch (e) { return true; }
  });

  // Fetch and decode the clip up front, so the crack isn't late on a cold
  // start. Decoding needs no gesture; only playing does.
  useEffect(() => {
    if (introSoundOn()) loadIntroSound(audioCtx());
  }, []);

  const begin = () => {
    if (!armed) { onDone?.(); return; }   // not gated → a tap means skip
    unlockAudio();                        // must happen inside the gesture
    setArmed(false);
    beginRef.current?.();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone?.();
    };

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let holding = armed;
    const ctx = canvas.getContext("2d", { alpha: false });
    let raf = 0;
    let started = 0;
    let cancelled = false;

    // ---- viewport ----
    let W = 0, H = 0, dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // ---- sprites ----
    const sparkGlow = glowSprite("rgba(255,255,255,1)", "rgba(61,139,255,0.85)", 64);
    const blueGlow = glowSprite("rgba(61,139,255,0.9)", "rgba(61,139,255,0.35)", 128);
    const smokeGlow = glowSprite("rgba(120,130,150,0.5)", "rgba(60,70,90,0.22)", 128);
    const dustGlow = glowSprite("rgba(216,221,230,0.9)", "rgba(216,221,230,0.25)", 32);

    // ---- particle systems ----
    const cx = () => W / 2;
    const cy = () => H * 0.46;

    // Dust drifts through the whole intro.
    const dust = Array.from({ length: 34 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: rand(-0.12, 0.12), vy: rand(-0.22, -0.04),
      r: rand(0.8, 2.6), a: rand(0.12, 0.5), ph: Math.random() * Math.PI * 2,
    }));

    let debris = [], sparks = [], smoke = [], arcs = [];
    let burst = false;

    const spawnImpact = () => {
      const x = cx(), y = cy();
      // 25 chrome / gunmetal flakes: gravity, one bounce, tumble, fade
      debris = Array.from({ length: 25 }, () => {
        const ang = rand(-Math.PI, 0);
        const sp = rand(3.5, 11);
        return {
          x: x + rand(-26, 26), y: y + rand(-14, 14),
          vx: Math.cos(ang) * sp * rand(0.7, 1.5),
          vy: Math.sin(ang) * sp - rand(1, 4),
          w: rand(2.5, 8), h: rand(1.5, 4.5),
          rot: Math.random() * Math.PI, vr: rand(-0.4, 0.4),
          col: Math.random() < 0.45 ? C.chrome : Math.random() < 0.6 ? C.gunmetal : "#9AA3B2",
          bounced: false, life: 1,
        };
      });
      // 40 electric-blue sparks, gone inside 0.4s
      sparks = Array.from({ length: 40 }, () => {
        const ang = Math.random() * Math.PI * 2;
        const sp = rand(7, 22);
        return {
          x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
          life: 1, decay: rand(2.4, 4.2), r: rand(1.4, 3.4),
        };
      });
      // small smoke burst
      smoke = Array.from({ length: 14 }, () => ({
        x: x + rand(-30, 30), y: y + rand(-10, 18),
        vx: rand(-0.5, 0.5), vy: rand(-1.5, -0.4),
        r: rand(14, 34), life: 1, decay: rand(0.5, 0.95),
      }));
    };

    // Lightning that crawls over the mark — regenerated a few times a second.
    const makeArc = (x, y, len, spread) => {
      const pts = [{ x, y }];
      const steps = 5 + Math.floor(Math.random() * 4);
      const ang = Math.random() * Math.PI * 2;
      for (let i = 1; i <= steps; i++) {
        pts.push({
          x: x + Math.cos(ang) * (len * i / steps) + rand(-spread, spread),
          y: y + Math.sin(ang) * (len * i / steps) + rand(-spread, spread),
        });
      }
      return { pts, life: 1, w: rand(1, 2.4) };
    };

    // ---- audio ----
    // Uses the app's shared AudioContext (lib/fx.js) rather than making its
    // own. iOS grants permission to play per-context, and only off the back
    // of a real tap — a fresh context created at launch is born suspended and
    // never recovers. The shared one is already unlocked the moment you've
    // tapped anything, which is why replaying the intro from Settings has
    // sound and a cold launch cannot.
    // When the intro actually began. Not the same as when this mounted: with
    // the tap-to-start hold, the clock doesn't run until you tap, and dating
    // the cues from mount makes the scheduler think the impact has already
    // been and gone.
    let audioAt = Date.now();
    let bus = null; // master gain, so skipping the intro kills queued cues

    const stopAudio = () => {
      if (!bus) return;
      try {
        bus.gain.cancelScheduledValues(0);
        bus.gain.value = 0;
        bus.disconnect();
      } catch (e) { /* ignore */ }
      bus = null;
    };

    const playAudio = () => {
      try {
        const ac = audioCtx();
        if (!ac) return;
        if (!bus) { bus = ac.createGain(); bus.gain.value = 1; bus.connect(ac.destination); }
        const arm = () => { if (ac.state === "running") schedule(ac); };
        if (ac.state !== "running") ac.resume?.()?.then?.(arm)?.catch?.(() => {});
        arm();
        // Safari flips the state a tick after resume() resolves often enough
        // to be worth one more look.
        setTimeout(arm, 60);
      } catch (e) { /* silent is fine */ }
    };

    let scheduled = false;
    const schedule = (ac) => {
      if (scheduled || !bus) return;
      scheduled = true;
      loadIntroSound(ac).then((buffer) => {
        if (!buffer || !bus) return;   // skipped out while it was decoding
        // Where the animation already is, so a late unlock drops into the
        // clip rather than cracking over a frame that's already gone.
        const elapsed = (Date.now() - audioAt) / 1000;
        playIntroSound(ac, bus, buffer, T.impact / 1000 - elapsed);
      });
      // The clip starts 729 ms in and runs 3.25 s, so it finishes at 3.98 s —
      // just past the intro. Cut it after that and the roll dies out over the
      // top of the home screen instead of being clipped off at the door.
      setTimeout(stopAudio, DUR + 1700);
    };

    // ---- assets ----
    const load = (src) =>
      new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img);
        img.onerror = () => res(null);
        img.src = src;
      });

    let vsImg = null, logoImg = null;

    // The VS artwork ships as an app icon — a square tile with a rounded
    // border. Dropped straight onto black that reads as a floating app icon,
    // not an emblem, so it's cropped past the border and feathered at the
    // edges once, up front, into the canvas we actually draw.
    // The artwork arrives already cropped to the emblem and feathered into
    // black, so it's drawn as-is — only its aspect needs carrying, since it's
    // a wide mark rather than a square tile.
    let markAspect = 1;

    // ---- drawing ----
    const drawDust = (t, alpha) => {
      ctx.globalCompositeOperation = "lighter";
      for (const p of dust) {
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        const tw = 0.65 + 0.35 * Math.sin(t / 420 + p.ph);
        const s = p.r * 6;
        ctx.globalAlpha = p.a * tw * alpha;
        ctx.drawImage(dustGlow, p.x - s / 2, p.y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    const drawArcs = (t, x, y, spread, alpha) => {
      if (arcs.length === 0 || Math.random() < 0.28) {
        arcs = Array.from({ length: 2 + Math.floor(Math.random() * 3) }, () =>
          makeArc(x + rand(-spread, spread), y + rand(-spread, spread), rand(30, 90), 9)
        );
      }
      ctx.globalCompositeOperation = "lighter";
      for (const a of arcs) {
        a.life -= 0.12;
        if (a.life <= 0) continue;
        const pulse = 0.5 + 0.5 * Math.sin(t / 45);
        ctx.globalAlpha = a.life * alpha * (0.55 + 0.45 * pulse);
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = a.w + 2.5;
        ctx.beginPath();
        ctx.moveTo(a.pts[0].x, a.pts[0].y);
        for (let i = 1; i < a.pts.length; i++) ctx.lineTo(a.pts[i].x, a.pts[i].y);
        ctx.stroke();
        ctx.globalAlpha = a.life * alpha;
        ctx.strokeStyle = "#EAF2FF";
        ctx.lineWidth = a.w * 0.55;
        ctx.stroke();
      }
      arcs = arcs.filter((a) => a.life > 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
    };

    // VS mark, whole or split in two along the bolt.
    const drawMark = (x, y, size, scale, sepPx) => {
      if (!vsImg) return;
      const w = size * scale;
      const h = w / markAspect;
      if (sepPx <= 0.2) {
        ctx.drawImage(vsImg, x - w / 2, y - h / 2, w, h);
        return;
      }
      const BIG = Math.max(W, H) * 2;
      for (const sign of [-1, 1]) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(BOLT_ANGLE);
        ctx.beginPath();
        if (sign < 0) ctx.rect(-BIG, -BIG, BIG * 2, BIG);
        else ctx.rect(-BIG, 0, BIG * 2, BIG);
        ctx.clip();
        ctx.translate(0, (sign * sepPx) / 2);
        ctx.rotate(-BOLT_ANGLE);
        ctx.drawImage(vsImg, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
      // Light leaking out of the seam. It has to hug the crack — the artwork
      // already carries a bright bolt, so a wide bar here reads as a lightsaber
      // laid over the mark instead of the two halves coming apart.
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(BOLT_ANGLE);
      const band = sepPx * 0.55;
      const grad = ctx.createLinearGradient(0, -band, 0, band);
      grad.addColorStop(0, "rgba(61,139,255,0)");
      grad.addColorStop(0.34, "rgba(61,139,255,0.30)");
      grad.addColorStop(0.5, "rgba(214,233,255,0.62)");
      grad.addColorStop(0.66, "rgba(61,139,255,0.30)");
      grad.addColorStop(1, "rgba(61,139,255,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = grad;
      ctx.fillRect(-w * 0.52, -band, w * 1.04, band * 2);
      ctx.restore();
      ctx.globalCompositeOperation = "source-over";
    };

    // Wordmark plus the chrome sweep, composited off-screen so the shine is
    // clipped to the letters instead of painting a band across the screen.
    const shineCanvas = document.createElement("canvas");
    const shineCtx = shineCanvas.getContext("2d");

    const drawWordmark = (t, alpha) => {
      if (!logoImg || alpha <= 0) return;
      const w = Math.min(W * 0.80, 460);
      const h = w * (logoImg.height / logoImg.width);
      const x = (W - w) / 2;
      const y = cy() - h / 2;

      // blue stadium spotlight behind it
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = alpha * 0.55;
      const gs = w * 1.5;
      ctx.drawImage(blueGlow, W / 2 - gs / 2, cy() - gs / 2, gs, gs);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      const sp = seg(t, T.shineStart, DUR);
      if (sp <= 0) {
        ctx.globalAlpha = alpha;
        ctx.drawImage(logoImg, x, y, w, h);
        ctx.globalAlpha = 1;
        return;
      }

      const pw = Math.max(2, Math.round(w * dpr));
      const ph = Math.max(2, Math.round(h * dpr));
      if (shineCanvas.width !== pw || shineCanvas.height !== ph) {
        shineCanvas.width = pw;
        shineCanvas.height = ph;
      }
      shineCtx.setTransform(1, 0, 0, 1, 0, 0);
      shineCtx.clearRect(0, 0, pw, ph);
      shineCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      shineCtx.drawImage(logoImg, 0, 0, w, h);

      // a soft diagonal band travelling left→right, kept inside the glyphs
      shineCtx.globalCompositeOperation = "source-atop";
      const bandW = w * 0.28;
      const px = lerp(-bandW, w + bandW, easeOutQuad(sp));
      const g = shineCtx.createLinearGradient(px - bandW, 0, px + bandW, h);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, "rgba(255,255,255,0.85)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      shineCtx.fillStyle = g;
      shineCtx.fillRect(0, 0, w, h);
      shineCtx.globalCompositeOperation = "source-over";

      ctx.globalAlpha = alpha;
      ctx.drawImage(shineCanvas, x, y, w, h);
      ctx.globalAlpha = 1;
    };

    // ---- frame ----
    const frame = (now) => {
      if (cancelled) return;
      if (!started) started = now;
      // While we're waiting for the tap, park in the charge-up. The arcs and
      // dust still move, so it reads as idling under load rather than frozen.
      const t = holding ? Math.min(now - started, T.dropStart - 30) : now - started;

      // background
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = C.black;
      ctx.fillRect(0, 0, W, H);

      // navy vignette that lifts as the energy builds
      const glowUp = seg(t, 0, T.impact);
      const vg = ctx.createRadialGradient(W / 2, cy(), 0, W / 2, cy(), Math.max(W, H) * 0.75);
      vg.addColorStop(0, `rgba(10,16,35,${0.35 + 0.5 * glowUp})`);
      vg.addColorStop(1, "rgba(5,7,15,0)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);

      // camera shake — 12px, decaying over ~260ms from the hit
      let shx = 0, shy = 0;
      const sh = seg(t, T.impact, T.impact + 260);
      if (t >= T.impact && sh < 1) {
        const amp = 12 * Math.pow(1 - sh, 2);
        shx = rand(-amp, amp);
        shy = rand(-amp, amp);
      }
      ctx.save();
      ctx.translate(shx, shy);

      const X = cx(), Y = cy();
      const size = Math.min(W * 0.86, H * 0.40);

      // Scene 1 — pre-impact charge
      if (t < T.impact) {
        const pre = seg(t, 0, T.dropStart);
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.25 + 0.45 * glowUp;
        const gs = size * (1.2 + 0.6 * glowUp);
        ctx.drawImage(blueGlow, X - gs / 2, Y - gs / 2, gs, gs);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
        if (Math.random() < 0.5) drawArcs(t, X, Y, 26 + 40 * pre, 0.35 + 0.5 * glowUp);
      }

      drawDust(t, 0.5 + 0.5 * seg(t, T.logoStart, T.logoEnd));

      // Scenes 2–4 — the mark
      if (t >= T.dropStart && t < T.logoEnd) {
        const dropP = seg(t, T.dropStart, T.impact);
        const fall = easeInQuart(dropP);
        // easeInQuart spends two thirds of its time in the first fifth of the
        // travel, so starting a full screen up leaves the mark off-frame until
        // the last few frames. Starting closer keeps the accelerating slam the
        // curve is for, while the entrance is actually on screen.
        const fromY = -H * 0.30;

        // overshoot: past centre at the hit, then pulled back by 750ms
        const over = t < T.impact ? 0 : lerp(14, 0, easeOutCubic(seg(t, T.impact, T.settle)));
        const y = t < T.impact ? lerp(fromY, Y, fall) : Y + over;

        // scale sequence 1.15 → 0.97 → 1.00
        let scale = 1;
        if (t < T.impact) scale = lerp(0.72, 1.15, fall);
        else if (t < T.impact + 90) scale = lerp(1.15, 0.97, easeOutCubic(seg(t, T.impact, T.impact + 90)));
        else scale = lerp(0.97, 1.0, easeOutCubic(seg(t, T.impact + 90, T.settle)));

        // fade the mark out once the wordmark takes over
        const markAlpha = 1 - seg(t, T.logoStart + 40, T.logoEnd - 60);

        ctx.globalAlpha = markAlpha;

        // motion blur + energy trail on the way down
        if (t < T.impact && dropP > 0.05) {
          const speed = fall - easeInQuart(Math.max(0, dropP - 0.06));
          const trail = clamp01(speed * 9);

          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = 0.5 * trail;
          const tg = ctx.createLinearGradient(0, y - size * 2.2, 0, y);
          tg.addColorStop(0, "rgba(61,139,255,0)");
          tg.addColorStop(1, "rgba(61,139,255,0.75)");
          ctx.fillStyle = tg;
          ctx.fillRect(X - size * 0.22, y - size * 2.2, size * 0.44, size * 2.2);
          ctx.globalCompositeOperation = "source-over";

          for (let i = 4; i >= 1; i--) {
            ctx.globalAlpha = markAlpha * 0.13 * i * trail;
            drawMark(X, y - i * size * 0.20 * trail, size, scale, 0);
          }
          ctx.globalAlpha = markAlpha;
        }

        // split along the bolt
        const sepP = easeOutCubic(seg(t, T.splitStart, T.splitEnd));
        drawMark(X, y, size, scale, SPLIT_GAP * sepP);

        // high-voltage crawl from the hit until it's fully open
        if (t >= T.impact && t < T.logoEnd) {
          drawArcs(t, X, y, size * 0.34, markAlpha * (0.8 - 0.4 * sepP));
        }
        ctx.globalAlpha = 1;
      }

      // Scene 3 — impact
      if (!burst && t >= T.impact) {
        burst = true;
        spawnImpact();
        try { navigator.vibrate?.([0, 35, 25, 45]); } catch (e) { /* ignore */ }
      }

      if (burst) {
        const since = t - T.impact;

        // blue flash — hottest at the point of contact, gone in 120ms
        if (since < 120) {
          const f = Math.pow(1 - since / 120, 2);
          ctx.globalCompositeOperation = "lighter";
          const fg = ctx.createRadialGradient(X, Y, 0, X, Y, Math.max(W, H) * 0.7);
          fg.addColorStop(0, `rgba(226,238,255,${0.95 * f})`);
          fg.addColorStop(0.28, `rgba(61,139,255,${0.6 * f})`);
          fg.addColorStop(1, "rgba(61,139,255,0)");
          ctx.fillStyle = fg;
          ctx.fillRect(0, 0, W, H);
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
        }

        // radial shockwave
        if (since < 520) {
          const p = since / 520;
          const r = lerp(10, Math.max(W, H) * 0.62, easeOutCubic(p));
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = (1 - p) * 0.85;
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = lerp(11, 1, p);
          ctx.beginPath();
          ctx.arc(X, Y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = (1 - p) * 0.4;
          ctx.strokeStyle = C.chrome;
          ctx.lineWidth = lerp(4, 0.5, p);
          ctx.beginPath();
          ctx.arc(X, Y, r * 0.82, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
          ctx.globalCompositeOperation = "source-over";
        }

        // smoke
        ctx.globalCompositeOperation = "lighter";
        for (const s of smoke) {
          s.life -= s.decay / 60;
          if (s.life <= 0) continue;
          s.x += s.vx; s.y += s.vy; s.r += 0.9;
          ctx.globalAlpha = s.life * 0.30;
          ctx.drawImage(smokeGlow, s.x - s.r, s.y - s.r, s.r * 2, s.r * 2);
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";

        // chrome debris — gravity, one bounce, tumble, fade
        const floor = Y + size * 0.55;
        for (const d of debris) {
          if (d.life <= 0) continue;
          d.vy += 0.62;
          d.x += d.vx; d.y += d.vy; d.rot += d.vr;
          if (d.y > floor && !d.bounced) {
            d.y = floor; d.vy *= -0.42; d.vx *= 0.7; d.bounced = true;
          }
          if (d.bounced) d.life -= 0.028;
          else if (d.y > H) d.life = 0;
          ctx.save();
          ctx.globalAlpha = clamp01(d.life);
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot);
          ctx.fillStyle = d.col;
          ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
          ctx.fillStyle = "rgba(255,255,255,0.55)";
          ctx.fillRect(-d.w / 2, -d.h / 2, d.w, Math.max(0.6, d.h * 0.28));
          ctx.restore();
        }
        ctx.globalAlpha = 1;

        // electric-blue sparks, gone inside 0.4s
        ctx.globalCompositeOperation = "lighter";
        for (const s of sparks) {
          if (s.life <= 0) continue;
          s.life -= s.decay / 60;
          s.vy += 0.34; s.vx *= 0.955; s.vy *= 0.955;
          s.x += s.vx; s.y += s.vy;
          const a = clamp01(s.life);
          const g = s.r * 7;
          ctx.globalAlpha = a * 0.85;
          ctx.drawImage(sparkGlow, s.x - g / 2, s.y - g / 2, g, g);
          ctx.globalAlpha = a;
          ctx.strokeStyle = "#DCEBFF";
          ctx.lineWidth = s.r * 0.55;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - s.vx * 0.7, s.y - s.vy * 0.7);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = "source-over";
      }

      // Scenes 5–6 — the wordmark behind the split
      drawWordmark(t, easeOutCubic(seg(t, T.logoStart, T.logoEnd)));

      ctx.restore();

      // cut to Home
      const out = seg(t, T.fadeStart, DUR);
      if (out > 0) {
        canvas.style.opacity = String(1 - out);
      }
      if (t >= DUR) { finish(); return; }
      raf = requestAnimationFrame(frame);
    };

    // ---- go ----
    (async () => {
      const [a, b] = await Promise.all([load(vsUrl), load(logoUrl)]);
      if (cancelled) return;
      vsImg = a;
      if (a) markAspect = a.width / a.height;
      logoImg = b;

      if (reduced) {
        // Same beats, none of the violence: a short fade to the wordmark.
        ctx.fillStyle = C.black;
        ctx.fillRect(0, 0, W, H);
        if (logoImg) {
          const w = Math.min(W * 0.8, 460);
          const h = w * (logoImg.height / logoImg.width);
          ctx.drawImage(logoImg, (W - w) / 2, cy() - h / 2, w, h);
        }
        canvas.style.transition = "opacity 320ms ease";
        setTimeout(() => { canvas.style.opacity = "0"; }, 520);
        setTimeout(finish, 900);
        return;
      }

      // Hand the loop a way to be released by the tap.
      beginRef.current = () => {
        if (!holding) return;
        holding = false;
        started = 0;          // restart the timeline from zero, now with sound
        audioAt = Date.now(); // ...and date the sound cues from here too
        clearTimeout(holdGuard);
        playAudio();
      };
      if (!holding) playAudio();
      raf = requestAnimationFrame(frame);
    })();

    // Never trap anyone on the hold screen.
    const holdGuard = setTimeout(() => beginRef.current?.(), 7000);

    // Never strand the user on the splash if a frame loop dies or a tab is
    // backgrounded mid-intro.
    const guard = setTimeout(() => { if (!holding) finish(); }, DUR + 1200);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(guard);
      clearTimeout(holdGuard);
      window.removeEventListener("resize", resize);
      stopAudio();
    };
  }, [onDone]);

  return (
    <div className={`splash-intro ${armed ? "armed" : ""}`} onPointerDown={begin} role="presentation">
      <canvas ref={canvasRef} />
      <span className="splash-skip">{armed ? "Tap anywhere to start" : "Tap to skip"}</span>
    </div>
  );
}
