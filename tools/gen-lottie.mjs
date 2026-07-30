// Emits the built-in Lottie animations as plain Bodymovin JSON.
// Kept as a script (not hand-edited JSON) so the timings and colours stay
// tweakable, and so anything we ship is reproducible.
import { writeFileSync, mkdirSync } from "fs";

const BLUE = [0.239, 0.545, 1, 1];       // #3D8BFF
const CHROME = [0.847, 0.867, 0.902, 1]; // #D8DDE6
const WHITE = [1, 1, 1, 1];

const FR = 60;
const S = 200; // square canvas; the player scales it

// --- property helpers ---
const k = (v) => ({ a: 0, k: v });
const ease = (i = 0.35, o = 0.25) => ({ i: { x: [i], y: [1] }, o: { x: [o], y: [0] } });
const anim = (frames) => ({
  a: 1,
  k: frames.map((f, idx) =>
    idx === frames.length - 1
      ? { t: f.t, s: Array.isArray(f.s) ? f.s : [f.s] }
      : { t: f.t, s: Array.isArray(f.s) ? f.s : [f.s], ...ease(f.i ?? 0.35, f.o ?? 0.25) }
  ),
});

const tr = (p = [0, 0], s = [100, 100], r = 0, o = 100) => ({
  ty: "tr", p: typeof p.a === "number" ? p : k(p), a: k([0, 0]),
  s: typeof s.a === "number" ? s : k(s), r: typeof r === "object" ? r : k(r),
  o: typeof o === "object" ? o : k(o), sk: k(0), sa: k(0), nm: "tr",
});

const stroke = (c, w, opacity = 100) => ({
  ty: "st", c: k(c), o: typeof opacity === "object" ? opacity : k(opacity),
  w: typeof w === "object" ? w : k(w), lc: 2, lj: 2, nm: "stroke",
});
const fill = (c, o = 100) => ({ ty: "fl", c: k(c), o: typeof o === "object" ? o : k(o), r: 1, nm: "fill" });

const layer = ({ ind, nm, shapes, p = [S / 2, S / 2], r = 0, s = [100, 100], o = 100, ip = 0, op }) => ({
  ddd: 0, ind, ty: 4, nm, sr: 1,
  ks: {
    o: typeof o === "object" ? o : k(o),
    r: typeof r === "object" ? r : k(r),
    p: typeof p === "object" && p.a !== undefined ? p : k([...p, 0]),
    a: k([0, 0, 0]),
    s: typeof s === "object" && s.a !== undefined ? s : k([...s, 100]),
  },
  ao: 0, shapes, ip, op, st: 0, bm: 0,
});

const comp = (nm, op, layers) => ({
  v: "5.7.4", fr: FR, ip: 0, op, w: S, h: S, nm, ddd: 0, assets: [], layers,
});

// =====================================================================
// check — a ring draws itself, then a tick draws inside it. For a goal
// met or a day closed out.
// =====================================================================
function check() {
  const layers = [];

  layers.push(
    layer({
      ind: 1, nm: "tick",
      op: 66,
      s: anim([{ t: 30, s: [70, 70] }, { t: 42, s: [108, 108] }, { t: 52, s: [100, 100] }]),
      shapes: [{
        ty: "gr", nm: "tick",
        it: [
          {
            ty: "sh", nm: "path",
            ks: k({
              i: [[0, 0], [0, 0], [0, 0]],
              o: [[0, 0], [0, 0], [0, 0]],
              v: [[-24, 2], [-8, 19], [25, -18]],
              c: false,
            }),
          },
          stroke(WHITE, 11),
          { ty: "tm", s: k(0), e: anim([{ t: 26, s: [0] }, { t: 48, s: [100] }]), o: k(0), m: 1, nm: "trim" },
          tr(),
        ],
      }],
    })
  );

  layers.push(
    layer({
      ind: 2, nm: "ring",
      op: 66,
      s: anim([{ t: 0, s: [86, 86] }, { t: 34, s: [104, 104] }, { t: 46, s: [100, 100] }]),
      r: -90,
      shapes: [{
        ty: "gr", nm: "ring",
        it: [
          { ty: "el", p: k([0, 0]), s: k([132, 132]), d: 1, nm: "e" },
          stroke(BLUE, 12),
          { ty: "tm", s: k(0), e: anim([{ t: 0, s: [0] }, { t: 34, s: [100] }]), o: k(0), m: 1, nm: "trim" },
          tr(),
        ],
      }],
    })
  );

  return comp("check", 66, layers);
}

mkdirSync("src/data/lottie", { recursive: true });
for (const [name, data] of [["check", check()]]) {
  const json = JSON.stringify(data);
  writeFileSync(`src/data/lottie/${name}.json`, json);
  console.log(`src/data/lottie/${name}.json  ${(json.length / 1024).toFixed(1)} KB  ${data.layers.length} layers  ${(data.op / FR).toFixed(2)}s`);
}
