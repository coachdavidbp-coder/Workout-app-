// =========================================================
// Picks the cool-down yoga to match the workout you just did.
//
// A leg day and a press day leave you tight in completely different places,
// so running the same four poses after both wastes half the time. This reads
// the day's exercises, works out which areas got hammered, and builds a
// four-pose cool-down around them — always keeping one low-back pose in,
// because that's the thing we're actually managing.
// =========================================================
import { groupOf } from "../data/exercises.js";
import { POSE_VIDEOS } from "./sequence.js";

const p = (label, seconds, order, targets, q, cue) => ({
  label, seconds, order, targets, q, cue, video: POSE_VIDEOS[label] || null,
});

// order roughly sequences a session: mobilise the spine → open the front →
// stretch the long muscles → release the hips → finish on a twist.
export const YOGA_LIBRARY = [
  p("Cat-Cow", 60, 1, ["lowback", "upperback"],
    "cat cow stretch lower back tutorial",
    "On hands and knees. Inhale — drop the belly, lift the chest. Exhale — round the spine, tuck the chin. Slow and smooth."),

  p("Child's Pose", 60, 2, ["lowback", "lats", "hips"],
    "childs pose yoga lower back tutorial",
    "Knees wide, big toes together, hips back to the heels. Walk the hands forward and let the low back open. Breathe into your back ribs."),

  p("Sphinx Pose", 60, 2, ["lowback", "chest"],
    "sphinx pose yoga lower back tutorial",
    "On your front, elbows under the shoulders, forearms down. Let the hips stay heavy. Gentle extension — the opposite of everything you just did bent over."),

  p("Low Lunge", 90, 3, ["hipflexors", "quads"],
    "low lunge anjaneyasana hip flexor stretch tutorial",
    "Back knee down, hips sink forward, tuck the pelvis under before you lean. 45 seconds a side. This is the one that unloads your low back."),

  p("Half Frog Quad Stretch", 60, 3, ["quads", "hipflexors"],
    "reclined half frog quad stretch tutorial",
    "On your front, catch one ankle and draw the heel toward the hip. Keep the hips square and the pelvis tucked. 30 seconds a side."),

  p("Seated Forward Fold", 75, 3, ["hamstrings", "lowback", "calves"],
    "seated forward fold hamstring stretch tutorial",
    "Legs out, hinge from the hips with a long spine — chest to thighs, not nose to knees. Soft bend in the knees is fine."),

  p("Downward Dog", 60, 3, ["hamstrings", "calves", "lats", "shoulders"],
    "downward dog pose tutorial",
    "Hips high, spine long. Pedal the heels — bend one knee, press the other heel down — then hold both down and breathe."),

  p("Thread the Needle", 60, 3, ["upperback", "shoulders"],
    "thread the needle stretch yoga tutorial",
    "From hands and knees, slide one arm under the other and rest on the shoulder. 30 seconds a side. Unwinds the mid-back after rows and presses."),

  p("Puppy Pose", 60, 3, ["lats", "chest", "shoulders"],
    "puppy pose yoga chest lat stretch tutorial",
    "Hips stacked over the knees, walk the hands forward and melt the chest toward the floor. Armpits opening, low back long."),

  p("Supported Fish", 60, 4, ["chest", "shoulders"],
    "supported fish pose chest opener yoga tutorial",
    "Lie back over a rolled towel set along the spine, arms out wide. Do nothing for a minute and let the chest fall open."),

  p("Pigeon Pose", 90, 4, ["glutes", "hipflexors"],
    "pigeon pose hip stretch tutorial",
    "Front shin across, back leg long, hips square, then fold forward. 45 seconds a side. Deep glute work — back off if the front knee complains."),

  p("Figure-4 Glute Stretch", 90, 4, ["glutes", "lowback"],
    "supine figure 4 glute stretch tutorial",
    "On your back, ankle across the opposite knee, pull the thigh in. 45 seconds each side — tight glutes are what drag on your low back."),

  p("Reclined Butterfly", 60, 5, ["hips", "groin"],
    "reclined bound angle pose yoga tutorial",
    "On your back, soles together, knees falling open. Hands on the belly. Let gravity do all of it."),

  p("Happy Baby", 60, 5, ["hips", "lowback"],
    "happy baby pose yoga lower back tutorial",
    "On your back, catch the outsides of the feet, knees toward the armpits. Press the low back flat into the floor and rock gently side to side."),

  p("Supine Spinal Twist", 90, 5, ["lowback", "glutes", "upperback"],
    "supine spinal twist yoga lower back tutorial",
    "On your back, knees together, drop them to one side, shoulders flat. 45 seconds each side. Exhale and let gravity do it."),
];

// What each training group leaves tight. Numbers are relative weights, not
// science — they just decide which poses win when the day is mixed.
const GROUP_TARGETS = {
  legs:  { quads: 3, glutes: 2, calves: 2, hipflexors: 2, lowback: 2 },
  hinge: { hamstrings: 3, glutes: 3, lowback: 3 },
  push:  { chest: 3, shoulders: 3, upperback: 1 },
  pull:  { lats: 3, upperback: 3, chest: 2, shoulders: 1 },
  arms:  { shoulders: 2, upperback: 2, chest: 1 },
  core:  { lowback: 3, hipflexors: 2, hips: 1 },
};

// Running and sprinting hit the back of the legs and the hip flexors hardest.
const CARDIO_TARGETS = { calves: 3, hamstrings: 2, hipflexors: 3, glutes: 2, lowback: 2 };

// Plain-English name for each area, for the "focus" line on the card.
const AREA_WORDS = {
  lowback: "low back", glutes: "glutes", hamstrings: "hamstrings",
  quads: "quads", hipflexors: "hip flexors", calves: "calves",
  chest: "chest", shoulders: "shoulders", lats: "lats",
  upperback: "upper back", hips: "hips", groin: "groin",
};

// Every cool-down carries a low-back bias — that's the standing complaint,
// and it's the joint that pays for a bad day either way.
const BASELINE = { lowback: 2 };

export function targetsForDay(day, swaps = {}) {
  const weights = { ...BASELINE };
  const add = (map, scale = 1) => {
    for (const [k, v] of Object.entries(map || {})) weights[k] = (weights[k] || 0) + v * scale;
  };

  if (!day || day.type === "rest") return weights;
  if (day.type === "cardio") { add(CARDIO_TARGETS); return weights; }

  const names = (day.exercises || []).map((e) => swaps[e.name] || e.name);
  if (!names.length) { add(GROUP_TARGETS.legs, 0.5); return weights; }

  // Each exercise votes. Group counts matter, so six squat variations pull
  // the cool-down further toward the legs than one would.
  for (const n of names) {
    const g = groupOf(n);
    if (g && GROUP_TARGETS[g]) add(GROUP_TARGETS[g], 1 / names.length * 2);
  }
  return weights;
}

// Greedy pick with a diversity discount: once an area is covered, its
// remaining weight is halved so the next pose goes somewhere new instead of
// stacking three hamstring stretches.
export function cooldownFor(day, swaps = {}, count = 4) {
  const weights = { ...targetsForDay(day, swaps) };
  const pool = [...YOGA_LIBRARY];
  const picked = [];

  const score = (pose) => pose.targets.reduce((a, t) => a + (weights[t] || 0), 0);

  while (picked.length < count && pool.length) {
    const needLowBack =
      picked.length === count - 1 && !picked.some((x) => x.targets.includes("lowback"));
    const eligible = needLowBack ? pool.filter((x) => x.targets.includes("lowback")) : pool;
    const from = eligible.length ? eligible : pool;

    let best = from[0];
    let bestScore = -1;
    for (const pose of from) {
      const s = score(pose);
      // ties break on the library's own order, which is already sensible
      if (s > bestScore) { best = pose; bestScore = s; }
    }
    picked.push(best);
    pool.splice(pool.indexOf(best), 1);
    for (const t of best.targets) weights[t] = (weights[t] || 0) / 2;
  }

  return picked.sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

// "hips, hamstrings and your low back" — what this cool-down is actually for.
export function focusLabel(day, swaps = {}) {
  const poses = cooldownFor(day, swaps);
  const seen = [];
  const weights = targetsForDay(day, swaps);
  for (const pose of poses) {
    for (const t of pose.targets) if (!seen.includes(t) && weights[t]) seen.push(t);
  }
  const top = seen
    .sort((a, b) => (weights[b] || 0) - (weights[a] || 0))
    .slice(0, 3)
    .map((t) => AREA_WORDS[t] || t);
  if (!top.length) return "your low back";
  if (top.length === 1) return top[0];
  return `${top.slice(0, -1).join(", ")} and ${top[top.length - 1]}`;
}
