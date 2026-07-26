// =========================================================
// US vs Them — 4-week football training plan data.
// Treadmill + 55 lb adjustable dumbbells.
// `video` = a YouTube video id for the how-to sheet. Any id
// can be swapped freely; if null, the sheet shows a
// "Search on YouTube" action using `q` instead.
// =========================================================

export const WEEKS = [1, 2, 3, 4];

export const DAY_NAMES = {
  sun: "Sunday",
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
};

// canonical order, Sunday-first
export const DAYS = [
  {
    id: "sun",
    label: "Sun",
    name: "Chest & Shoulders",
    type: "lift",
    warmup: "5 min treadmill walk · arm circles · 15 push-ups",
    exercises: [
      { name: "DB Floor / Bench Press", sets: ["4×10", "4×12", "5×10", "5×12"], video: null, q: "dumbbell floor press form" },
      { name: "DB Overhead Press", sets: ["4×8", "4×10", "4×10", "5×8"], video: null, q: "dumbbell overhead press form" },
      { name: "Feet-Up Push-Up", sets: ["3×Max", "3×Max", "4×Max", "4×Max"], video: null, q: "feet elevated push up form" },
      { name: "DB Lateral Raise (light)", sets: ["3×12", "3×15", "3×15", "4×12"], video: null, q: "dumbbell lateral raise form" },
      { name: "DB Front Raise (light)", sets: ["3×12", "3×12", "3×15", "3×15"], video: null, q: "dumbbell front raise form" },
      { name: "DB Shrug", sets: ["3×15", "3×15", "4×15", "4×15"], video: null, q: "dumbbell shrug form" },
    ],
    note: "Rest 60–90 sec. When 55 lb feels easy, lower for 3–4 seconds per rep.",
  },
  {
    id: "mon",
    label: "Mon",
    name: "Lower Body Strength",
    type: "lift",
    warmup: "5 min incline walk · leg swings · 15 squats · 10 lunges/leg",
    exercises: [
      { name: "DB Goblet Squat (one 55)", sets: ["4×10", "4×12", "5×10", "5×12"], video: null, q: "goblet squat form" },
      { name: "Bulgarian Split Squat", sets: ["3×8/leg", "3×10/leg", "4×8/leg", "4×10/leg"], video: null, q: "bulgarian split squat dumbbell form" },
      { name: "DB Romanian Deadlift", sets: ["4×10", "4×12", "4×12", "5×10"], video: null, q: "dumbbell romanian deadlift form" },
      { name: "DB Walking Lunge", sets: ["3×10/leg", "3×12/leg", "4×10/leg", "4×12/leg"], video: null, q: "dumbbell walking lunge form" },
      { name: "Single-Leg DB RDL", sets: ["3×8/leg", "3×8/leg", "3×10/leg", "3×10/leg"], video: null, q: "single leg romanian deadlift form" },
      { name: "DB Calf Raise (3s down)", sets: ["3×15", "3×18", "4×15", "4×20"], video: null, q: "dumbbell calf raise form" },
    ],
    note: "Rest 60–90 sec between sets.",
  },
  {
    id: "tue",
    label: "Tue",
    name: "Speed Work",
    type: "cardio",
    warmup: "5 min jog + 3 × 20-sec buildups",
    protocol: [
      { week: 1, label: "8 × 15-sec sprint, 75-sec walk between", rounds: 8, seconds: 15 },
      { week: 2, label: "10 × 15-sec sprint, 75-sec walk between", rounds: 10, seconds: 15 },
      { week: 3, label: "8 × 20-sec sprint (faster), 90-sec walk", rounds: 8, seconds: 20 },
      { week: 4, label: "10 × 20-sec sprint, 90-sec walk", rounds: 10, seconds: 20 },
    ],
    note: "Then 4 × 30-sec power run at 10–12% incline. Safety: straddle the belt, bring it to speed, then step on — or use steep incline at moderate speed instead.",
  },
  {
    id: "wed",
    label: "Wed",
    name: "Back & Arms",
    type: "lift",
    warmup: "Arm circles · light rows · 10 slow push-ups",
    exercises: [
      { name: "Single-Arm DB Row", sets: ["4×10/arm", "4×12/arm", "4×12/arm", "5×10/arm"], video: null, q: "single arm dumbbell row form" },
      { name: "DB Renegade Row", sets: ["3×8/arm", "3×8/arm", "3×10/arm", "4×8/arm"], video: null, q: "renegade row form" },
      { name: "DB Pullover (floor)", sets: ["3×12", "3×12", "3×15", "4×12"], video: null, q: "dumbbell pullover form" },
      { name: "DB Bicep Curl", sets: ["3×12", "3×12", "3×15", "4×12"], video: null, q: "dumbbell bicep curl form" },
      { name: "DB Hammer Curl", sets: ["3×10", "3×12", "3×12", "3×15"], video: null, q: "dumbbell hammer curl form" },
      { name: "Overhead Triceps Ext.", sets: ["3×12", "3×12", "3×15", "4×12"], video: null, q: "dumbbell overhead triceps extension form" },
    ],
    note: "Rest 60–90 sec between sets.",
  },
  {
    id: "thu",
    label: "Thu",
    name: "Tempo Conditioning",
    type: "cardio",
    warmup: "5 min easy jog",
    protocol: [
      { week: 1, label: "6 × 90-sec run (moderately hard), 60-sec walk", rounds: 6, seconds: 90 },
      { week: 2, label: "7 × 90-sec, same rest", rounds: 7, seconds: 90 },
      { week: 3, label: "6 × 2-min at the same pace, 60-sec walk", rounds: 6, seconds: 120 },
      { week: 4, label: "8 × 90-sec slightly faster, 60-sec walk", rounds: 8, seconds: 90 },
    ],
    note: "Game-day finisher (all weeks): 3 rounds — 10 light DB thrusters + 10 push-ups + 30-sec incline run. Minimal rest. Cooldown 5 min.",
  },
  {
    id: "fri",
    label: "Fri",
    name: "Full Body Power",
    type: "lift",
    warmup: "5 min jog + 10 jump squats. Move the weight FAST today.",
    exercises: [
      { name: "DB Squat Jump (15–25 lb)", sets: ["4×6", "4×6", "5×6", "5×6"], video: null, q: "dumbbell squat jump form" },
      { name: "DB Push Press", sets: ["4×8", "4×8", "5×8", "5×8"], video: null, q: "dumbbell push press form" },
      { name: "DB Clean-to-Press", sets: ["4×6", "4×6", "5×6", "5×6"], video: null, q: "dumbbell clean to press form" },
      { name: "Single-Arm DB Snatch", sets: ["3×6/arm", "3×6/arm", "3×6/arm", "3×6/arm"], video: null, q: "single arm dumbbell snatch form" },
      { name: "Farmer's Carry (both 55s)", sets: ["4×40s", "4×40s", "4×40s", "4×40s"], video: null, q: "farmers carry dumbbell form" },
      { name: "Plank", sets: ["3×45s", "3×50s", "3×55s", "3×60s"], video: null, q: "plank form" },
    ],
    note: "Rest fully (90–120 sec) between power sets — quality over fatigue.",
  },
  {
    id: "sat",
    label: "Sat",
    name: "Rest Day",
    type: "rest",
    warmup: "",
    note: "Full recovery. Optional 20–30 min easy walk and stretching. This is where the week's work turns into gains.",
  },
];

export const TRAINING_DAY_COUNT = DAYS.filter((d) => d.type !== "rest").length;

export function dayById(id) {
  return DAYS.find((d) => d.id === id);
}

// ---- meal plan reference content ----
export const MEAL_TARGETS = {
  protein: 125,
  calories: 2000,
  waterOz: 80,
};

export const MEAL_IDEAS = [
  {
    title: "Breakfasts",
    items: [
      "3 scrambled eggs + 1 slice toast",
      "Greek yogurt + berries + honey",
      "Protein shake + banana",
      "Cottage cheese + pineapple or peaches",
    ],
  },
  {
    title: "Lunches",
    items: [
      "Rotisserie chicken + rice cup + frozen veggie bag",
      "Tuna packet + light mayo + crackers or wrap",
      "Turkey taco bowl: ¼ lb turkey, rice, salsa, cheese",
      "Deli turkey roll-ups + string cheese + apple",
    ],
  },
  {
    title: "Dinners",
    items: [
      "Baked chicken thighs (400°F, 35 min) + veggies",
      "Lean beef + marinara over small pasta portion",
      "Sheet-pan sausage + peppers + onions",
      "Slow-cooker salsa chicken — tacos or bowls",
      "Baked frozen salmon or tilapia + rice + green beans",
    ],
  },
  {
    title: "Snacks (1–2/day)",
    items: [
      "String cheese · beef jerky · hard-boiled eggs",
      "Protein shake on training days if meals won't finish",
    ],
  },
];

export const GROCERY =
  "Eggs (18 ct) · rotisserie chicken · ground turkey or lean beef · frozen chicken thighs · tuna packets · Greek yogurt · cottage cheese · string cheese · whey protein · frozen veggies · rice · bananas/apples · salsa · tortillas";

export const GLP1_NOTES = [
  "If appetite is too small, drink your protein — shakes go down easier",
  "Eat protein within an hour after lifting, even if not hungry",
  "Go easy on greasy/fried food — it sits badly on GLP-1s",
  "Week 3 is the heaviest — don't let eating slide that week",
  "Confirm with your prescribing doctor that your intake supports 6 training days/week",
];
