// =========================================================
// Exercise library for the guided plan generator.
// eq  = equipment tags: db kb bb band bw bench
// grp = movement group used to fill a day's focus
// rep = base rep target (generator sets the # of sets by level)
// =========================================================
export const EXERCISES = [
  // --- squat / legs ---
  { name: "DB Goblet Squat", eq: ["db", "kb"], grp: "legs", rep: "12", q: "goblet squat form" },
  { name: "KB Goblet Squat", eq: ["kb"], grp: "legs", rep: "12", q: "kettlebell goblet squat form" },
  { name: "Barbell Back Squat", eq: ["bb"], grp: "legs", rep: "8", q: "barbell back squat form" },
  { name: "Bodyweight Squat", eq: ["bw"], grp: "legs", rep: "20", q: "bodyweight squat form" },
  { name: "Bulgarian Split Squat", eq: ["db", "kb", "bw"], grp: "legs", rep: "10/leg", q: "bulgarian split squat form" },
  { name: "DB Walking Lunge", eq: ["db", "bw"], grp: "legs", rep: "10/leg", q: "dumbbell walking lunge form" },
  { name: "DB Reverse Lunge", eq: ["db", "bw"], grp: "legs", rep: "10/leg", q: "dumbbell reverse lunge form" },
  { name: "Step-Up", eq: ["db", "bw"], grp: "legs", rep: "10/leg", q: "dumbbell step up form" },
  { name: "Wall Sit", eq: ["bw"], grp: "legs", rep: "45s", q: "wall sit form" },

  // --- hinge / glutes ---
  { name: "DB Romanian Deadlift", eq: ["db"], grp: "hinge", rep: "12", q: "dumbbell romanian deadlift form" },
  { name: "KB Deadlift", eq: ["kb"], grp: "hinge", rep: "12", q: "kettlebell deadlift form" },
  { name: "Barbell Deadlift", eq: ["bb"], grp: "hinge", rep: "6", q: "barbell deadlift form" },
  { name: "Single-Leg RDL", eq: ["db", "kb", "bw"], grp: "hinge", rep: "10/leg", q: "single leg romanian deadlift form" },
  { name: "KB Swing", eq: ["kb"], grp: "hinge", rep: "20", q: "kettlebell swing form" },
  { name: "DB Glute Bridge", eq: ["db", "bw"], grp: "hinge", rep: "20", q: "dumbbell glute bridge form" },
  { name: "DB Hip Thrust", eq: ["db", "bb", "bench"], grp: "hinge", rep: "15", q: "dumbbell hip thrust form" },
  { name: "Band Good Morning", eq: ["band", "bb"], grp: "hinge", rep: "15", q: "good morning exercise form" },

  // --- push ---
  { name: "DB Floor / Bench Press", eq: ["db", "bench"], grp: "push", rep: "12", q: "dumbbell floor press form" },
  { name: "Push-Up", eq: ["bw"], grp: "push", rep: "Max", q: "push up form" },
  { name: "Feet-Up Push-Up", eq: ["bw"], grp: "push", rep: "Max", q: "feet elevated push up form" },
  { name: "Barbell Bench Press", eq: ["bb", "bench"], grp: "push", rep: "8", q: "barbell bench press form" },
  { name: "Incline DB Press", eq: ["db", "bench"], grp: "push", rep: "12", q: "incline dumbbell press form" },
  { name: "Band Chest Press", eq: ["band"], grp: "push", rep: "15", q: "resistance band chest press form" },

  // --- pull ---
  { name: "Single-Arm DB Row", eq: ["db"], grp: "pull", rep: "12/arm", q: "single arm dumbbell row form" },
  { name: "KB Bent-Over Row", eq: ["kb"], grp: "pull", rep: "12/arm", q: "kettlebell bent over row form" },
  { name: "DB Renegade Row", eq: ["db"], grp: "pull", rep: "8/arm", q: "renegade row form" },
  { name: "Barbell Row", eq: ["bb"], grp: "pull", rep: "10", q: "barbell row form" },
  { name: "Band Row", eq: ["band"], grp: "pull", rep: "15", q: "resistance band row form" },
  { name: "DB Pullover", eq: ["db", "bench"], grp: "pull", rep: "12", q: "dumbbell pullover form" },
  { name: "Inverted Row", eq: ["bw"], grp: "pull", rep: "Max", q: "inverted row form" },

  // --- shoulders ---
  { name: "DB Overhead Press", eq: ["db"], grp: "shoulder", rep: "12", q: "dumbbell overhead press form" },
  { name: "KB Overhead Press", eq: ["kb"], grp: "shoulder", rep: "10/arm", q: "kettlebell overhead press form" },
  { name: "DB Lateral Raise", eq: ["db"], grp: "shoulder", rep: "15", q: "dumbbell lateral raise form" },
  { name: "KB High Pull", eq: ["kb"], grp: "shoulder", rep: "15", q: "kettlebell high pull form" },
  { name: "Band Pull-Apart", eq: ["band"], grp: "shoulder", rep: "20", q: "band pull apart form" },
  { name: "Pike Push-Up", eq: ["bw"], grp: "shoulder", rep: "Max", q: "pike push up form" },

  // --- arms ---
  { name: "DB Bicep Curl", eq: ["db"], grp: "arms", rep: "12", q: "dumbbell bicep curl form" },
  { name: "DB Hammer Curl", eq: ["db"], grp: "arms", rep: "12", q: "dumbbell hammer curl form" },
  { name: "Overhead Triceps Ext.", eq: ["db"], grp: "arms", rep: "12", q: "dumbbell overhead triceps extension form" },
  { name: "Band Curl", eq: ["band"], grp: "arms", rep: "15", q: "resistance band curl form" },
  { name: "Bench Dip", eq: ["bw", "bench"], grp: "arms", rep: "Max", q: "bench dip form" },

  // --- core ---
  { name: "Plank", eq: ["bw"], grp: "core", rep: "45s", q: "plank form" },
  { name: "Side Plank", eq: ["bw"], grp: "core", rep: "30s/side", q: "side plank form" },
  { name: "Hollow Hold", eq: ["bw"], grp: "core", rep: "30s", q: "hollow hold form" },
  { name: "Mountain Climbers", eq: ["bw"], grp: "core", rep: "40s", q: "mountain climbers form" },
  { name: "Russian Twist", eq: ["db", "kb", "bw"], grp: "core", rep: "20", q: "russian twist form" },
  { name: "Dead Bug", eq: ["bw"], grp: "core", rep: "12", q: "dead bug exercise form" },
  { name: "Hanging Knee Raise", eq: ["bw"], grp: "core", rep: "Max", q: "hanging knee raise form" },

  // --- power / athletic ---
  { name: "DB Push Press", eq: ["db"], grp: "power", rep: "8", q: "dumbbell push press form" },
  { name: "KB Clean & Press", eq: ["kb"], grp: "power", rep: "6/arm", q: "kettlebell clean and press form" },
  { name: "DB Thruster", eq: ["db"], grp: "power", rep: "10", q: "dumbbell thruster form" },
  { name: "Single-Arm DB Snatch", eq: ["db"], grp: "power", rep: "6/arm", q: "single arm dumbbell snatch form" },
  { name: "DB Squat Jump", eq: ["db", "bw"], grp: "power", rep: "6", q: "dumbbell squat jump form" },
  { name: "Broad Jump", eq: ["bw"], grp: "power", rep: "8", q: "broad jump form" },
  { name: "Farmer's Carry", eq: ["db", "kb"], grp: "power", rep: "40s", q: "farmers carry form" },
];

// ---------------- swaps ----------------
// Finds alternatives that train the same pattern. Plan exercises don't all
// exist in this library verbatim, so fall back to inferring the group from
// the name — better a sensible swap list than an empty one.
// Order matters: the specific patterns run before the loose ones, so
// "Nordic Hamstring Curl" lands on hinge rather than arms, and
// "Lateral Raise" doesn't get caught by the "lat" in pull-downs.
const GROUP_HINTS = [
  [/nordic|hamstring/i, "hinge"],
  [/deadlift|\brdl\b|hinge|kb swing|glute|hip thrust|good morning/i, "hinge"],
  [/squat|lunge|step-?up|wall sit|leg press|calf/i, "legs"],
  [/plank|crunch|sit-?up|hollow|russian|leg raise|\bcore\b|bird dog|dead bug/i, "core"],
  [/curl|tricep|lateral raise|front raise|rear delt|shrug|extension/i, "arms"],
  [/press|push|dip|\bfly\b|thruster/i, "push"],
  [/row|pull-?up|pulldown|chin-?up|\blat\b|face pull/i, "pull"],
];

export function groupOf(name) {
  const exact = EXERCISES.find((e) => e.name.toLowerCase() === String(name || "").toLowerCase());
  if (exact) return exact.grp;
  for (const [re, grp] of GROUP_HINTS) if (re.test(name || "")) return grp;
  return null;
}

export function swapsFor(name, limit = 10) {
  const grp = groupOf(name);
  if (!grp) return [];
  const lower = String(name || "").toLowerCase();
  return EXERCISES.filter((e) => e.grp === grp && e.name.toLowerCase() !== lower).slice(0, limit);
}
