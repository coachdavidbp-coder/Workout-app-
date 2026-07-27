// =========================================================
// Guided plan generator — turns a short questionnaire into a
// full 4-week program from the tagged exercise library.
// answers = { equipment:[], days, focus, cardio, length, level }
// =========================================================
import { EXERCISES } from "../data/exercises.js";
import { mkProto } from "../data/plans.js";

const DAY_IDS = [
  ["sun", "Sun"], ["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"],
  ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"],
];

// which weekday indexes train, for a given days/week
const SCHEDULE = {
  2: [1, 4],
  3: [1, 3, 5],
  4: [1, 2, 4, 5],
  5: [1, 2, 3, 5, 6],
  6: [0, 1, 2, 4, 5, 6],
};

// group template per lift-day focus
const TEMPLATES = {
  full: ["legs", "hinge", "push", "pull", "core", "power"],
  upper: ["push", "pull", "shoulder", "arms", "core", "push"],
  lower: ["legs", "hinge", "legs", "hinge", "core", "power"],
  glutes: ["hinge", "legs", "hinge", "legs", "core", "hinge"],
  pushd: ["push", "shoulder", "push", "arms", "core", "power"],
  pulld: ["pull", "pull", "arms", "shoulder", "core", "pull"],
  legs: ["legs", "hinge", "legs", "hinge", "core", "power"],
};

// ordered list of lift-day focuses to rotate through, by chosen focus
function focusRotation(focus, days) {
  switch (focus) {
    case "upperlower":
      return [["Upper Body", "upper"], ["Lower Body", "lower"], ["Upper Body", "upper"], ["Lower Body", "lower"]];
    case "glutes":
      return [["Glutes & Legs", "glutes"], ["Lower Body", "lower"], ["Full Body", "full"], ["Glutes & Legs", "glutes"]];
    case "strength":
      return days >= 3
        ? [["Push Day", "pushd"], ["Pull Day", "pulld"], ["Leg Day", "legs"], ["Push Day", "pushd"]]
        : [["Full Body A", "full"], ["Full Body B", "full"]];
    default: // fullbody, toning, weightloss, athletic
      return [["Full Body A", "full"], ["Full Body B", "full"], ["Full Body C", "full"], ["Full Body A", "full"]];
  }
}

function setsCount(grp, level) {
  if (grp === "power") return level === "int" ? 5 : 4;
  if (grp === "shoulder" || grp === "arms" || grp === "core") return 3;
  return level === "int" ? 4 : 3; // legs, hinge, push, pull
}

function pickExercise(grp, equip, used) {
  let pool = EXERCISES.filter((e) => e.grp === grp && e.eq.some((t) => equip.includes(t)) && !used.has(e.name));
  if (!pool.length) pool = EXERCISES.filter((e) => e.grp === grp && e.eq.includes("bw") && !used.has(e.name));
  if (!pool.length) pool = EXERCISES.filter((e) => e.grp === grp && !used.has(e.name));
  if (!pool.length) return null;
  const e = pool[(Math.random() * pool.length) | 0];
  used.add(e.name);
  return e;
}

function cardioDay(id, label, style, i) {
  const mode = style === "mix" ? (i % 2 === 0 ? "hiit" : "steady") : style;
  if (mode === "steady") {
    return {
      id, label, name: "Steady Run", type: "cardio",
      warmup: "5 min easy jog to warm up",
      protocol: mkProto(5, 180, 45, "5 × 3-min run (moderate), 45-sec walk"),
      note: "Hold a steady, moderately-hard pace. Cool down 5 min.",
    };
  }
  return {
    id, label, name: "Sprint Intervals", type: "cardio",
    warmup: "5 min jog + 3 × 20-sec build-ups",
    protocol: mkProto(8, 20, 60, "8 × 20-sec sprint, 60-sec walk"),
    note: "Full effort on each sprint, easy walk to recover.",
  };
}

export function generatePlan(answers) {
  const equip = [...new Set([...(answers.equipment || []), "bw"])]; // bodyweight always available
  const days = Math.max(2, Math.min(6, answers.days || 4));
  const level = answers.level || "beg";
  const exPerDay = answers.length === "long" ? 6 : answers.length === "short" ? 4 : 5;
  const trainingIdx = SCHEDULE[days];

  // how many cardio days
  let cardioDays = answers.cardio === "none" ? 0 : days >= 5 ? 2 : days >= 3 ? 1 : answers.cardio ? 1 : 0;
  cardioDays = Math.min(cardioDays, days - 1); // keep at least 1 lift day
  // cardio slots = spread across training days (every other, starting 2nd)
  const cardioSlots = new Set();
  for (let k = 0, pos = 1; k < cardioDays && pos < trainingIdx.length; k++, pos += 2) cardioSlots.add(pos);

  const rotation = focusRotation(answers.focus, days);
  let rotI = 0;
  let cardI = 0;

  const dayMap = {};
  trainingIdx.forEach((weekdayIdx, slot) => {
    const [id, label] = DAY_IDS[weekdayIdx];
    if (cardioSlots.has(slot)) {
      dayMap[id] = cardioDay(id, label, answers.cardio, cardI++);
    } else {
      const [fname, fkey] = rotation[rotI % rotation.length];
      rotI++;
      const groups = TEMPLATES[fkey] || TEMPLATES.full;
      const used = new Set();
      const exercises = [];
      for (let g = 0; g < groups.length && exercises.length < exPerDay; g++) {
        const ex = pickExercise(groups[g], equip, used);
        if (ex) {
          const sets = setsCount(ex.grp, level);
          exercises.push({ name: ex.name, sets: Array(4).fill(`${sets}×${ex.rep}`), video: null, q: ex.q });
        }
      }
      dayMap[id] = {
        id, label, name: fname, type: "lift",
        warmup: "5 min easy warm-up + light sets",
        exercises,
        note: "Rest 45–90 sec between sets. Add weight or a rep when it feels easy.",
      };
    }
  });

  // fill the rest with rest days
  const daysArr = DAY_IDS.map(([id, label]) =>
    dayMap[id] || { id, label, name: "Rest", type: "rest", warmup: "", note: "Full recovery — walk, stretch, hydrate." }
  );

  const nameByFocus = {
    upperlower: "Upper / Lower Split", glutes: "Glutes & Legs Plan", strength: "Strength Split",
    toning: "Tone & Sculpt", weightloss: "Fat-Loss Plan", athletic: "Athletic Plan", fullbody: "Full Body Plan",
  };

  return {
    id: "custom",
    name: nameByFocus[answers.focus] || "My Program",
    accent: "⚡",
    tagline: `${days} days/week · your equipment`,
    equipment: equip.filter((e) => e !== "bw").length ? equip.filter((e) => e !== "bw") : ["Bodyweight"],
    focus: "Custom (generated)",
    days: daysArr,
  };
}
