// =========================================================
// Program catalog. Each account picks a plan; screens read the
// active plan's days via daysOf(state). All plans share the
// Sun-first day ids so the day strip + logging stay consistent.
// `video` = YouTube id (null → the sheet does a search on `q`).
// =========================================================

export const WEEKS = [1, 2, 3, 4];

export const DAY_NAMES = {
  sun: "Sunday", mon: "Monday", tue: "Tuesday", wed: "Wednesday",
  thu: "Thursday", fri: "Friday", sat: "Saturday",
};

// ---------------- Program 1: Gridiron (football) ----------------
const GRIDIRON_DAYS = [
  {
    id: "sun", label: "Sun", name: "Chest & Shoulders", type: "lift",
    warmup: "5 min treadmill walk · arm circles · 15 push-ups",
    exercises: [
      { name: "DB Floor / Bench Press", sets: ["4×10", "4×12", "5×10", "5×12"], video: "uUGDRwge4F8", q: "dumbbell floor press form" },
      { name: "DB Overhead Press", sets: ["4×8", "4×10", "4×10", "5×8"], video: "qEwKCR5JCog", q: "dumbbell overhead press form" },
      { name: "Feet-Up Push-Up", sets: ["3×Max", "3×Max", "4×Max", "4×Max"], video: "J21Glo_IuCI", q: "feet elevated push up form" },
      { name: "DB Lateral Raise (light)", sets: ["3×12", "3×15", "3×15", "4×12"], video: "3VcKaXpzqRo", q: "dumbbell lateral raise form" },
      { name: "DB Front Raise (light)", sets: ["3×12", "3×12", "3×15", "3×15"], video: "-t7fuZ0KhDA", q: "dumbbell front raise form" },
      { name: "DB Shrug", sets: ["3×15", "3×15", "4×15", "4×15"], video: "zrs4FLeF_-4", q: "dumbbell shrug form" },
    ],
    note: "Rest 60–90 sec. When 55 lb feels easy, lower for 3–4 seconds per rep.",
  },
  {
    id: "mon", label: "Mon", name: "Lower Body Strength", type: "lift",
    warmup: "5 min incline walk · leg swings · 15 squats · 10 lunges/leg",
    exercises: [
      { name: "DB Goblet Squat (one 55)", sets: ["4×10", "4×12", "5×10", "5×12"], video: "Xjo_fY9Hl9w", q: "goblet squat form" },
      { name: "Bulgarian Split Squat", sets: ["3×8/leg", "3×10/leg", "4×8/leg", "4×10/leg"], video: "4tKKxQy_D98", q: "bulgarian split squat dumbbell form" },
      { name: "DB Romanian Deadlift", sets: ["4×10", "4×12", "4×12", "5×10"], video: "aa57T45iFSE", q: "dumbbell romanian deadlift form" },
      { name: "DB Walking Lunge", sets: ["3×10/leg", "3×12/leg", "4×10/leg", "4×12/leg"], video: "I_rMQRrwseI", q: "dumbbell walking lunge form" },
      { name: "Single-Leg DB RDL", sets: ["3×8/leg", "3×8/leg", "3×10/leg", "3×10/leg"], video: "iS7atZhcRnw", q: "single leg romanian deadlift form" },
      { name: "DB Calf Raise (3s down)", sets: ["3×15", "3×18", "4×15", "4×20"], video: "wxwY7GXxL4k", q: "dumbbell calf raise form" },
    ],
    note: "Rest 60–90 sec between sets.",
  },
  {
    id: "tue", label: "Tue", name: "Speed Work", type: "cardio",
    warmup: "5 min jog + 3 × 20-sec buildups",
    protocol: [
      { week: 1, label: "8 × 15-sec sprint, 75-sec walk between", rounds: 8, seconds: 15, rest: 75 },
      { week: 2, label: "10 × 15-sec sprint, 75-sec walk between", rounds: 10, seconds: 15, rest: 75 },
      { week: 3, label: "8 × 20-sec sprint (faster), 90-sec walk", rounds: 8, seconds: 20, rest: 90 },
      { week: 4, label: "10 × 20-sec sprint, 90-sec walk", rounds: 10, seconds: 20, rest: 90 },
    ],
    note: "Then 4 × 30-sec power run at 10–12% incline. Safety: straddle the belt, bring it to speed, then step on — or use steep incline at moderate speed instead.",
  },
  {
    id: "wed", label: "Wed", name: "Back & Arms", type: "lift",
    warmup: "Arm circles · light rows · 10 slow push-ups",
    exercises: [
      { name: "Single-Arm DB Row", sets: ["4×10/arm", "4×12/arm", "4×12/arm", "5×10/arm"], video: "pYcpY20QaE8", q: "single arm dumbbell row form" },
      { name: "DB Renegade Row", sets: ["3×8/arm", "3×8/arm", "3×10/arm", "4×8/arm"], video: "NTl_ALR8Tlc", q: "renegade row form" },
      { name: "DB Pullover (floor)", sets: ["3×12", "3×12", "3×15", "4×12"], video: "Qc4L9I3pHnw", q: "dumbbell pullover form" },
      { name: "DB Bicep Curl", sets: ["3×12", "3×12", "3×15", "4×12"], video: "6DeLZ6cbgWQ", q: "dumbbell bicep curl form" },
      { name: "DB Hammer Curl", sets: ["3×10", "3×12", "3×12", "3×15"], video: "8XLxfXROrTo", q: "dumbbell hammer curl form" },
      { name: "Overhead Triceps Ext.", sets: ["3×12", "3×12", "3×15", "4×12"], video: "IJ6J7EKprsc", q: "dumbbell overhead triceps extension form" },
    ],
    note: "Rest 60–90 sec between sets.",
  },
  {
    id: "thu", label: "Thu", name: "Tempo Conditioning", type: "cardio",
    warmup: "5 min easy jog",
    protocol: [
      { week: 1, label: "6 × 90-sec run (moderately hard), 60-sec walk", rounds: 6, seconds: 90, rest: 60 },
      { week: 2, label: "7 × 90-sec, same rest", rounds: 7, seconds: 90, rest: 60 },
      { week: 3, label: "6 × 2-min at the same pace, 60-sec walk", rounds: 6, seconds: 120, rest: 60 },
      { week: 4, label: "8 × 90-sec slightly faster, 60-sec walk", rounds: 8, seconds: 90, rest: 60 },
    ],
    note: "Game-day finisher (all weeks): 3 rounds — 10 light DB thrusters + 10 push-ups + 30-sec incline run. Minimal rest. Cooldown 5 min.",
  },
  {
    id: "fri", label: "Fri", name: "Full Body Power", type: "lift",
    warmup: "5 min jog + 10 jump squats. Move the weight FAST today.",
    exercises: [
      { name: "DB Squat Jump (15–25 lb)", sets: ["4×6", "4×6", "5×6", "5×6"], video: "7qPVEUQ6vE8", q: "dumbbell squat jump form" },
      { name: "DB Push Press", sets: ["4×8", "4×8", "5×8", "5×8"], video: "sElIkjcfyNY", q: "dumbbell push press form" },
      { name: "DB Clean-to-Press", sets: ["4×6", "4×6", "5×6", "5×6"], video: "8G-jnVP_f2s", q: "dumbbell clean to press form" },
      { name: "Single-Arm DB Snatch", sets: ["3×6/arm", "3×6/arm", "3×6/arm", "3×6/arm"], video: "-ASeKka_kh8", q: "single arm dumbbell snatch form" },
      { name: "Farmer's Carry (both 55s)", sets: ["4×40s", "4×40s", "4×40s", "4×40s"], video: "7mzKcADa46c", q: "farmers carry dumbbell form" },
      { name: "Plank", sets: ["3×45s", "3×50s", "3×55s", "3×60s"], video: "mwlp75MS6Rg", q: "plank form" },
    ],
    note: "Rest fully (90–120 sec) between power sets — quality over fatigue.",
  },
  { id: "sat", label: "Sat", name: "Rest Day", type: "rest", warmup: "", note: "Full recovery. Optional 20–30 min easy walk and stretching. This is where the week's work turns into gains." },
];

// ---------------- Program 2: Sprint & Sculpt ----------------
// Dumbbells + kettlebell + treadmill. Short sprint intervals (no long
// distance), glute/full-body strength.
const SPRINT_SCULPT_DAYS = [
  {
    id: "sun", label: "Sun", name: "Lower Body & Glutes", type: "lift",
    warmup: "5 min brisk treadmill walk · hip circles · 15 bodyweight squats · 10 glute bridges",
    exercises: [
      { name: "KB Goblet Squat", sets: ["3×12", "3×15", "4×12", "4×15"], video: null, q: "kettlebell goblet squat form" },
      { name: "KB Deadlift", sets: ["3×10", "3×12", "4×10", "4×12"], video: null, q: "kettlebell deadlift form" },
      { name: "Bulgarian Split Squat", sets: ["3×10/leg", "3×12/leg", "4×10/leg", "4×12/leg"], video: "4tKKxQy_D98", q: "bulgarian split squat form" },
      { name: "KB Swing", sets: ["3×15", "3×20", "4×15", "4×20"], video: null, q: "kettlebell swing proper form" },
      { name: "DB Glute Bridge", sets: ["3×15", "3×20", "4×15", "4×20"], video: null, q: "dumbbell glute bridge form" },
      { name: "DB Walking Lunge", sets: ["3×10/leg", "3×12/leg", "4×10/leg", "4×12/leg"], video: "I_rMQRrwseI", q: "dumbbell walking lunge form" },
    ],
    note: "Rest 45–75 sec. Squeeze the glutes hard at the top of every swing and bridge.",
  },
  {
    id: "mon", label: "Mon", name: "Sprint Intervals", type: "cardio",
    warmup: "5 min easy jog + 3 × 20-sec strides (build to 80%)",
    protocol: [
      { week: 1, label: "8 × 20-sec sprint, 60-sec walk", rounds: 8, seconds: 20, rest: 60 },
      { week: 2, label: "10 × 20-sec sprint, 60-sec walk", rounds: 10, seconds: 20, rest: 60 },
      { week: 3, label: "8 × 25-sec sprint (faster), 75-sec walk", rounds: 8, seconds: 25, rest: 75 },
      { week: 4, label: "10 × 25-sec sprint, 75-sec walk", rounds: 10, seconds: 25, rest: 75 },
    ],
    note: "Full effort on each sprint, easy walk to recover. Treadmill safety: bring the belt to speed, straddle, then step on — or use incline sprints at a safer speed.",
  },
  {
    id: "tue", label: "Tue", name: "Upper Body Strength", type: "lift",
    warmup: "Arm circles · band or light pull-aparts · 10 incline push-ups",
    exercises: [
      { name: "DB Overhead Press", sets: ["3×10", "3×12", "4×10", "4×12"], video: "qEwKCR5JCog", q: "dumbbell overhead press form" },
      { name: "KB Bent-Over Row", sets: ["3×10/arm", "3×12/arm", "4×10/arm", "4×12/arm"], video: null, q: "kettlebell bent over row form" },
      { name: "DB Floor Press", sets: ["3×10", "3×12", "4×10", "4×12"], video: "uUGDRwge4F8", q: "dumbbell floor press form" },
      { name: "KB High Pull", sets: ["3×12", "3×15", "4×12", "4×15"], video: null, q: "kettlebell high pull form" },
      { name: "DB Bicep Curl", sets: ["3×12", "3×12", "3×15", "3×15"], video: "6DeLZ6cbgWQ", q: "dumbbell bicep curl form" },
      { name: "DB Lateral Raise", sets: ["3×12", "3×15", "3×15", "4×12"], video: "3VcKaXpzqRo", q: "dumbbell lateral raise form" },
    ],
    note: "Rest 45–75 sec. Control the lowering phase on every rep.",
  },
  {
    id: "wed", label: "Wed", name: "Sprint & Core", type: "cardio",
    warmup: "5 min easy jog + leg swings",
    protocol: [
      { week: 1, label: "6 × 15-sec sprint, 60-sec walk", rounds: 6, seconds: 15, rest: 60 },
      { week: 2, label: "8 × 15-sec sprint, 60-sec walk", rounds: 8, seconds: 15, rest: 60 },
      { week: 3, label: "6 × 20-sec sprint, 75-sec walk", rounds: 6, seconds: 20, rest: 75 },
      { week: 4, label: "8 × 20-sec sprint, 75-sec walk", rounds: 8, seconds: 20, rest: 75 },
    ],
    note: "Core finisher (all weeks): 3 rounds — 30-sec plank + 15 hollow rocks + 20 mountain climbers. Cooldown 5 min.",
  },
  {
    id: "thu", label: "Thu", name: "Full Body Power", type: "lift",
    warmup: "5 min jog + 10 KB deadlifts + 10 air squats. Move with intent.",
    exercises: [
      { name: "KB Clean & Press", sets: ["4×6/arm", "4×8/arm", "5×6/arm", "5×8/arm"], video: null, q: "kettlebell clean and press form" },
      { name: "DB Thruster", sets: ["3×10", "3×12", "4×10", "4×12"], video: null, q: "dumbbell thruster form" },
      { name: "KB Swing", sets: ["3×15", "3×20", "4×15", "4×20"], video: null, q: "kettlebell swing proper form" },
      { name: "DB Romanian Deadlift", sets: ["3×10", "3×12", "4×10", "4×12"], video: "aa57T45iFSE", q: "dumbbell romanian deadlift form" },
      { name: "Push-Up", sets: ["3×Max", "3×Max", "4×Max", "4×Max"], video: null, q: "push up proper form" },
      { name: "Plank", sets: ["3×40s", "3×45s", "3×50s", "3×60s"], video: "mwlp75MS6Rg", q: "plank form" },
    ],
    note: "Rest 60–90 sec. Power moves are about speed + form, not grinding.",
  },
  {
    id: "fri", label: "Fri", name: "Speed & Power", type: "cardio",
    warmup: "6 min jog + 4 × 20-sec build-ups to near-max",
    protocol: [
      { week: 1, label: "6 × 10-sec max sprint, 90-sec walk", rounds: 6, seconds: 10, rest: 90 },
      { week: 2, label: "8 × 10-sec max sprint, 90-sec walk", rounds: 8, seconds: 10, rest: 90 },
      { week: 3, label: "6 × 12-sec max sprint, 90-sec walk", rounds: 6, seconds: 12, rest: 90 },
      { week: 4, label: "8 × 12-sec max sprint, 90-sec walk", rounds: 8, seconds: 12, rest: 90 },
    ],
    note: "Pure top speed. Full recovery between reps — quality over quantity. Stop a rep if form breaks down.",
  },
  { id: "sat", label: "Sat", name: "Rest Day", type: "rest", warmup: "", note: "Full recovery. Optional easy walk + stretch or mobility. Rest is where the sculpting happens." },
];

// ---------------- catalog ----------------
export const PLANS = {
  gridiron: {
    id: "gridiron",
    name: "Gridiron",
    tagline: "Football power + conditioning",
    equipment: ["Treadmill", "Adjustable dumbbells"],
    focus: "Strength, power & game-day conditioning",
    accent: "🏈",
    days: GRIDIRON_DAYS,
  },
  sprint_sculpt: {
    id: "sprint_sculpt",
    name: "Sprint & Sculpt",
    tagline: "Strength + sprint intervals",
    equipment: ["Dumbbells", "Kettlebell", "Treadmill"],
    focus: "Glutes, full-body strength & short sprints",
    accent: "⚡",
    days: SPRINT_SCULPT_DAYS,
  },
};

export const PLAN_LIST = Object.values(PLANS);
export const DEFAULT_PLAN_ID = "gridiron";

export function getPlan(id) {
  return PLANS[id] || PLANS[DEFAULT_PLAN_ID];
}
export function planFor(state) {
  return getPlan(state?.profile?.planId);
}
export function daysOf(state) {
  return planFor(state).days;
}
export function dayById(state, id) {
  return daysOf(state).find((d) => d.id === id);
}
export function trainingCount(state) {
  return daysOf(state).filter((d) => d.type !== "rest").length;
}
