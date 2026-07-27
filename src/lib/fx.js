// Lightweight FX: confetti burst + haptics. No dependencies.

export function haptic(kind = "light") {
  try {
    const p = {
      light: 10,
      medium: 20,
      success: [0, 40, 40, 60],
      warning: [0, 30, 30, 30],
      heavy: 40,
    }[kind] || 10;
    navigator.vibrate?.(p);
  } catch (e) { /* ignore */ }
}

export function fireConfetti({ count = 120, duration = 1600 } = {}) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText =
    "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999";
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth, H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const colors = ["#4C8DFF", "#7CAEFF", "#35C26B", "#FFC24C", "#FF5A5F", "#F3F4F1"];
  const cx = W / 2;
  const parts = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI - Math.PI / 2; // upward-ish spread
    const speed = 6 + Math.random() * 9;
    return {
      x: cx + (Math.random() - 0.5) * 120,
      y: H * 0.32,
      vx: Math.cos(angle) * speed * (Math.random() < 0.5 ? -1 : 1) * 0.6 + (Math.random() - 0.5) * 4,
      vy: -Math.abs(Math.sin(angle) * speed) - 4 - Math.random() * 5,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[(Math.random() * colors.length) | 0],
    };
  });

  const start = performance.now();
  function frame(t) {
    const elapsed = t - start;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.28; // gravity
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - elapsed / duration);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (elapsed < duration) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
