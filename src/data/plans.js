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

// ---------------- Program 3: Trenches (D1 football linemen) ----------------
const TRENCHES_DAYS = [
  { id: "sun", label: "Sun", name: "Lower Power", type: "lift",
    warmup: "5 min incline walk · leg swings · 20 bodyweight squats",
    exercises: [
      { name: "DB Goblet Squat", sets: ["5×5", "5×5", "6×5", "6×5"], video: "Xjo_fY9Hl9w", q: "goblet squat form" },
      { name: "DB Romanian Deadlift", sets: ["4×6", "4×6", "5×5", "5×5"], video: "aa57T45iFSE", q: "dumbbell romanian deadlift form" },
      { name: "Bulgarian Split Squat", sets: ["3×8/leg", "3×8/leg", "4×8/leg", "4×8/leg"], video: "4tKKxQy_D98", q: "bulgarian split squat form" },
      { name: "DB Calf Raise (3s down)", sets: r("4×12"), video: "wxwY7GXxL4k", q: "dumbbell calf raise form" },
      { name: "Weighted Plank", sets: r("3×45s"), video: "mwlp75MS6Rg", q: "weighted plank form" },
    ],
    note: "Trenches training: move heavy, brace hard, drive through the floor. Rest 90–120 sec on the big lifts." },
  { id: "mon", label: "Mon", name: "Upper Power", type: "lift",
    warmup: "Band pull-aparts · arm circles · 15 push-ups",
    exercises: [
      { name: "DB Bench / Floor Press", sets: ["5×5", "5×5", "6×5", "6×5"], video: "uUGDRwge4F8", q: "dumbbell bench press form" },
      { name: "DB Overhead Press", sets: ["4×6", "4×8", "4×8", "5×6"], video: "qEwKCR5JCog", q: "dumbbell overhead press form" },
      { name: "Single-Arm DB Row", sets: ["4×8/arm", "4×8/arm", "4×10/arm", "5×8/arm"], video: "pYcpY20QaE8", q: "single arm dumbbell row form" },
      { name: "DB Renegade Row", sets: r("3×8/arm"), video: "NTl_ALR8Tlc", q: "renegade row form" },
      { name: "DB Shrug", sets: r("4×15"), video: "zrs4FLeF_-4", q: "dumbbell shrug form" },
    ],
    note: "Explode up, control down. This is your pass-pro punch and bull-rush power." },
  { id: "tue", label: "Tue", name: "Tempo Conditioning", type: "cardio",
    warmup: "5 min easy walk + dynamic stretch",
    protocol: [
      { week: 1, label: "6 × 20-sec hard incline push, 70-sec walk", rounds: 6, seconds: 20, rest: 70 },
      { week: 2, label: "8 × 20-sec hard incline push, 70-sec walk", rounds: 8, seconds: 20, rest: 70 },
      { week: 3, label: "6 × 25-sec incline push, 80-sec walk", rounds: 6, seconds: 25, rest: 80 },
      { week: 4, label: "8 × 25-sec incline push, 80-sec walk", rounds: 8, seconds: 25, rest: 80 },
    ],
    note: "Sled-style conditioning: steep incline, hard drive, walk-back recovery. Big engine on a big frame." },
  { id: "wed", label: "Wed", name: "Rest / Mobility", type: "rest", warmup: "", note: "Foam roll, stretch hips and shoulders, easy 20-min walk. Recover so you can move heavy again." },
  { id: "thu", label: "Thu", name: "Lower Strength", type: "lift",
    warmup: "5 min incline walk · hip circles · 15 glute bridges",
    exercises: [
      { name: "DB Front-Rack Squat", sets: ["4×8", "4×8", "4×10", "5×8"], video: null, q: "dumbbell front rack squat form" },
      { name: "Single-Leg DB RDL", sets: r("3×8/leg"), video: "iS7atZhcRnw", q: "single leg romanian deadlift form" },
      { name: "DB Walking Lunge", sets: ["3×10/leg", "3×12/leg", "4×10/leg", "4×12/leg"], video: "I_rMQRrwseI", q: "dumbbell walking lunge form" },
      { name: "DB Step-Up", sets: r("3×10/leg"), video: null, q: "dumbbell step up form" },
      { name: "Lying Leg Raise", sets: r("3×15"), video: null, q: "lying leg raise form" },
    ],
    note: "Build the base. Full range, controlled tempo. Rest 90 sec." },
  { id: "fri", label: "Fri", name: "Upper Strength & Arms", type: "lift",
    warmup: "Band pull-aparts · 15 push-ups · arm circles",
    exercises: [
      { name: "DB Incline Press", sets: ["4×8", "4×10", "4×10", "5×8"], video: null, q: "dumbbell incline press form" },
      { name: "Chest-Supported DB Row", sets: r("4×10"), video: null, q: "chest supported dumbbell row form" },
      { name: "DB Push Press", sets: r("4×6"), video: null, q: "dumbbell push press form" },
      { name: "DB Bicep Curl", sets: r("3×12"), video: null, q: "dumbbell biceps curl form" },
      { name: "DB Overhead Triceps Ext", sets: r("3×12"), video: null, q: "dumbbell overhead triceps extension form" },
    ],
    note: "Finish the week strong. Arms and shoulders lock in the armor." },
  { id: "sat", label: "Sat", name: "Rest Day", type: "rest", warmup: "", note: "Full recovery. Eat big, sleep big — that's how linemen grow." },
];

// ---------------- Program 4: Skill Speed (D1 football skill positions) ----------------
const SKILL_SPEED_DAYS = [
  { id: "sun", label: "Sun", name: "Total-Body Power", type: "lift",
    warmup: "5 min jog · leg swings · 10 jump squats",
    exercises: [
      { name: "DB Goblet Squat (fast up)", sets: ["4×6", "4×6", "4×8", "5×6"], video: "Xjo_fY9Hl9w", q: "goblet squat form" },
      { name: "DB Romanian Deadlift", sets: r("4×8"), video: "aa57T45iFSE", q: "dumbbell romanian deadlift form" },
      { name: "DB Push Press", sets: r("4×6"), video: null, q: "dumbbell push press form" },
      { name: "DB Bench / Floor Press", sets: r("4×8"), video: "uUGDRwge4F8", q: "dumbbell bench press form" },
      { name: "Broad Jump", sets: r("4×4"), video: null, q: "broad jump form" },
    ],
    note: "Every rep explosive. Power now becomes speed on the field." },
  { id: "mon", label: "Mon", name: "Speed & Agility", type: "cardio",
    warmup: "6 min jog + A-skips + high knees + 3 build-ups",
    protocol: [
      { week: 1, label: "8 × 20-yd acceleration, walk back", rounds: 8, seconds: 6, rest: 54 },
      { week: 2, label: "10 × 20-yd acceleration, walk back", rounds: 10, seconds: 6, rest: 54 },
      { week: 3, label: "8 × 5-10-5 pro-agility shuttle, full rest", rounds: 8, seconds: 10, rest: 70 },
      { week: 4, label: "10 × 5-10-5 shuttle, full rest", rounds: 10, seconds: 10, rest: 70 },
    ],
    note: "Sharp cuts, low hips, fast feet. Quality reps with full recovery — this is change-of-direction speed." },
  { id: "tue", label: "Tue", name: "Upper Strength", type: "lift",
    warmup: "Band pull-aparts · 15 push-ups",
    exercises: [
      { name: "DB Incline Press", sets: r("4×8"), video: null, q: "dumbbell incline press form" },
      { name: "Single-Arm DB Row", sets: r("4×10/arm"), video: "pYcpY20QaE8", q: "single arm dumbbell row form" },
      { name: "DB Overhead Press", sets: r("3×10"), video: "qEwKCR5JCog", q: "dumbbell overhead press form" },
      { name: "Pull-Up / DB Pullover", sets: r("3×Max"), video: "Qc4L9I3pHnw", q: "pull up or dumbbell pullover" },
      { name: "DB Bicep Curl", sets: r("3×12"), video: null, q: "dumbbell biceps curl form" },
    ],
    note: "Lean, strong, fast. Keep the reps crisp." },
  { id: "wed", label: "Wed", name: "Plyometrics & Core", type: "lift",
    warmup: "5 min jog · ankle hops · 10 pogo jumps",
    exercises: [
      { name: "Box / Tuck Jump", sets: r("4×5"), video: null, q: "tuck jump form" },
      { name: "Lateral Bound", sets: r("3×6/side"), video: null, q: "lateral bound form" },
      { name: "DB Jump Squat (light)", sets: r("3×6"), video: null, q: "dumbbell jump squat form" },
      { name: "Hollow Body Hold", sets: r("3×30s"), video: null, q: "hollow body hold form" },
      { name: "Plank", sets: r("3×45s"), video: "mwlp75MS6Rg", q: "plank form" },
    ],
    note: "Land soft, spring fast. Core stays braced — this is your acceleration base." },
  { id: "thu", label: "Thu", name: "Max Velocity Sprints", type: "cardio",
    warmup: "8 min jog + strides + 4 build-ups to 90%",
    protocol: [
      { week: 1, label: "6 × 40-yd flying sprint, full walk-back", rounds: 6, seconds: 6, rest: 90 },
      { week: 2, label: "8 × 40-yd flying sprint, full walk-back", rounds: 8, seconds: 6, rest: 90 },
      { week: 3, label: "6 × 50-yd flying sprint, full recovery", rounds: 6, seconds: 7, rest: 100 },
      { week: 4, label: "8 × 50-yd flying sprint, full recovery", rounds: 8, seconds: 7, rest: 100 },
    ],
    note: "Top-end speed. Build up smooth, hit max, relax the face and hands. Full recovery every rep." },
  { id: "fri", label: "Fri", name: "Lower Strength & Single-Leg", type: "lift",
    warmup: "5 min bike · leg swings · walking lunges",
    exercises: [
      { name: "Bulgarian Split Squat", sets: r("4×8/leg"), video: "4tKKxQy_D98", q: "bulgarian split squat form" },
      { name: "DB Romanian Deadlift", sets: r("4×8"), video: "aa57T45iFSE", q: "dumbbell romanian deadlift form" },
      { name: "DB Walking Lunge", sets: r("3×12/leg"), video: "I_rMQRrwseI", q: "dumbbell walking lunge form" },
      { name: "Single-Leg Calf Raise", sets: r("3×15/leg"), video: "wxwY7GXxL4k", q: "single leg calf raise form" },
      { name: "Nordic / Hamstring Curl", sets: r("3×8"), video: null, q: "nordic hamstring curl form" },
    ],
    note: "Strong single-leg = faster and more durable. Protect those hamstrings." },
  { id: "sat", label: "Sat", name: "Rest Day", type: "rest", warmup: "", note: "Recover. Optional 20-min easy walk + stretch. Fresh legs win reps." },
];

// ---------------- Program 5: Track Sprinter (D1 track 100/200m) ----------------
const TRACK_SPRINT_DAYS = [
  { id: "sun", label: "Sun", name: "Acceleration Sprints", type: "cardio",
    warmup: "10 min jog + drills (A-skip, B-skip, high knees) + 3 build-ups",
    protocol: [
      { week: 1, label: "6 × 30m acceleration, full recovery", rounds: 6, seconds: 5, rest: 120 },
      { week: 2, label: "8 × 30m acceleration, full recovery", rounds: 8, seconds: 5, rest: 120 },
      { week: 3, label: "6 × 40m acceleration, full recovery", rounds: 6, seconds: 6, rest: 150 },
      { week: 4, label: "8 × 40m acceleration, full recovery", rounds: 8, seconds: 6, rest: 150 },
    ],
    note: "Drive phase: shin angles, push the ground back, patient rise. Full recovery — every rep is max quality." },
  { id: "mon", label: "Mon", name: "Max Strength — Lower", type: "lift",
    warmup: "5 min bike · leg swings · 15 bodyweight squats",
    exercises: [
      { name: "DB Goblet / Front Squat", sets: ["5×5", "5×5", "6×4", "6×4"], video: "Xjo_fY9Hl9w", q: "goblet squat form" },
      { name: "DB Romanian Deadlift", sets: ["4×6", "4×6", "5×5", "5×5"], video: "aa57T45iFSE", q: "dumbbell romanian deadlift form" },
      { name: "Bulgarian Split Squat", sets: r("3×6/leg"), video: "4tKKxQy_D98", q: "bulgarian split squat form" },
      { name: "DB Calf Raise (explosive)", sets: r("4×10"), video: "wxwY7GXxL4k", q: "dumbbell calf raise form" },
      { name: "Hanging Leg Raise", sets: r("3×12"), video: null, q: "hanging leg raise form" },
    ],
    note: "Heavy with fast intent. Strength is the engine behind top speed. Rest 2–3 min on mains." },
  { id: "tue", label: "Tue", name: "Plyometrics & Core", type: "lift",
    warmup: "5 min jog · pogo hops · ankle bounces",
    exercises: [
      { name: "Broad Jump", sets: r("5×3"), video: null, q: "broad jump form" },
      { name: "Bounding", sets: r("4×20m"), video: null, q: "bounding drill sprint" },
      { name: "Single-Leg Hop", sets: r("3×5/leg"), video: null, q: "single leg hop plyometric" },
      { name: "Hollow Body Hold", sets: r("3×30s"), video: null, q: "hollow body hold form" },
      { name: "DB Russian Twist", sets: r("3×20"), video: null, q: "russian twist form" },
    ],
    note: "Elastic power. Minimal ground time, maximal force. Rest fully between plyo sets." },
  { id: "wed", label: "Wed", name: "Speed Endurance", type: "cardio",
    warmup: "10 min jog + drills + 3 build-ups",
    protocol: [
      { week: 1, label: "4 × 80m at 90%, walk-back recovery", rounds: 4, seconds: 11, rest: 180 },
      { week: 2, label: "5 × 100m at 90%, full recovery", rounds: 5, seconds: 13, rest: 200 },
      { week: 3, label: "4 × 120m at 90%, full recovery", rounds: 4, seconds: 16, rest: 240 },
      { week: 4, label: "5 × 150m at 90%, full recovery", rounds: 5, seconds: 20, rest: 270 },
    ],
    note: "Hold form as you fatigue — this is your 200m speed. Long recoveries keep every rep fast." },
  { id: "thu", label: "Thu", name: "Power — Upper & Posterior", type: "lift",
    warmup: "Band pull-aparts · 15 push-ups · hip hinges",
    exercises: [
      { name: "DB Push Press", sets: r("4×5"), video: null, q: "dumbbell push press form" },
      { name: "DB Bench / Floor Press", sets: r("4×6"), video: "uUGDRwge4F8", q: "dumbbell bench press form" },
      { name: "Single-Arm DB Row", sets: r("4×8/arm"), video: "pYcpY20QaE8", q: "single arm dumbbell row form" },
      { name: "DB Hip Thrust / Glute Bridge", sets: r("4×10"), video: null, q: "dumbbell hip thrust form" },
      { name: "DB Shrug (fast)", sets: r("3×12"), video: "zrs4FLeF_-4", q: "dumbbell shrug form" },
    ],
    note: "Arm drive and posterior chain power the sprint. Move the weight with intent." },
  { id: "fri", label: "Fri", name: "Top Speed / Flys", type: "cardio",
    warmup: "12 min jog + full drill series + 4 build-ups to 95%",
    protocol: [
      { week: 1, label: "4 × 20m fly (20m run-in), full recovery", rounds: 4, seconds: 3, rest: 180 },
      { week: 2, label: "5 × 20m fly, full recovery", rounds: 5, seconds: 3, rest: 180 },
      { week: 3, label: "4 × 30m fly (30m run-in), full recovery", rounds: 4, seconds: 4, rest: 240 },
      { week: 4, label: "5 × 30m fly, full recovery", rounds: 5, seconds: 4, rest: 240 },
    ],
    note: "Pure max velocity. Relaxed and tall, cycle the legs under you. Stop while you're still fast." },
  { id: "sat", label: "Sat", name: "Rest Day", type: "rest", warmup: "", note: "Full recovery. Light mobility and stretch only. Speed is built on fresh legs." },
];

// ---------------- Program 6: Distance Engine (D1 cross-country / mid-distance) ----------------
const DISTANCE_DAYS = [
  { id: "sun", label: "Sun", name: "Long Run", type: "cardio",
    warmup: "5 min brisk walk into an easy jog",
    protocol: [
      { week: 1, label: "30 min easy continuous run", rounds: 1, seconds: 1800, rest: 0 },
      { week: 2, label: "35 min easy continuous run", rounds: 1, seconds: 2100, rest: 0 },
      { week: 3, label: "40 min easy continuous run", rounds: 1, seconds: 2400, rest: 0 },
      { week: 4, label: "50 min easy continuous run", rounds: 1, seconds: 3000, rest: 0 },
    ],
    note: "Conversational pace — you should be able to talk. Track it on the Run tab. This builds your aerobic engine." },
  { id: "mon", label: "Mon", name: "Prehab Strength", type: "lift",
    warmup: "5 min walk · leg swings · hip circles",
    exercises: [
      { name: "Single-Leg DB RDL", sets: r("3×8/leg"), video: "iS7atZhcRnw", q: "single leg romanian deadlift form" },
      { name: "DB Goblet Squat", sets: r("3×12"), video: "Xjo_fY9Hl9w", q: "goblet squat form" },
      { name: "Calf Raise (3s down)", sets: r("3×15"), video: "wxwY7GXxL4k", q: "calf raise form" },
      { name: "Side Plank", sets: r("3×30s/side"), video: null, q: "side plank form" },
      { name: "Bird Dog", sets: r("3×10/side"), video: null, q: "bird dog exercise form" },
    ],
    note: "Runner durability: single-leg strength, calves and core. Controlled, quality reps." },
  { id: "tue", label: "Tue", name: "Interval Repeats", type: "cardio",
    warmup: "10 min easy jog + 4 strides",
    protocol: [
      { week: 1, label: "6 × 400m at 5K pace, 90-sec jog", rounds: 6, seconds: 95, rest: 90 },
      { week: 2, label: "8 × 400m at 5K pace, 90-sec jog", rounds: 8, seconds: 95, rest: 90 },
      { week: 3, label: "5 × 800m at 5K pace, 2-min jog", rounds: 5, seconds: 190, rest: 120 },
      { week: 4, label: "6 × 800m at 5K pace, 2-min jog", rounds: 6, seconds: 190, rest: 120 },
    ],
    note: "Even, controlled reps — not all-out. Jog the recoveries, don't stop. Your race-pace sharpener." },
  { id: "wed", label: "Wed", name: "Easy Run + Strides", type: "cardio",
    warmup: "5 min walk into easy jog",
    protocol: [
      { week: 1, label: "25 min easy run + 4 × 20-sec strides", rounds: 1, seconds: 1500, rest: 0 },
      { week: 2, label: "25 min easy run + 5 × 20-sec strides", rounds: 1, seconds: 1500, rest: 0 },
      { week: 3, label: "30 min easy run + 6 × 20-sec strides", rounds: 1, seconds: 1800, rest: 0 },
      { week: 4, label: "30 min easy run + 6 × 20-sec strides", rounds: 1, seconds: 1800, rest: 0 },
    ],
    note: "Recovery pace with light strides to stay smooth. Finish the strides fast but relaxed. Track it on the Run tab." },
  { id: "thu", label: "Thu", name: "Full-Body Strength", type: "lift",
    warmup: "5 min jog · arm circles · 10 push-ups",
    exercises: [
      { name: "DB Walking Lunge", sets: r("3×12/leg"), video: "I_rMQRrwseI", q: "dumbbell walking lunge form" },
      { name: "DB Floor Press", sets: r("3×12"), video: "uUGDRwge4F8", q: "dumbbell floor press form" },
      { name: "Single-Arm DB Row", sets: r("3×12/arm"), video: "pYcpY20QaE8", q: "single arm dumbbell row form" },
      { name: "DB Step-Up", sets: r("3×10/leg"), video: null, q: "dumbbell step up form" },
      { name: "Plank", sets: r("3×45s"), video: "mwlp75MS6Rg", q: "plank form" },
    ],
    note: "Light-to-moderate, full range. Strength that supports the miles without adding bulk." },
  { id: "fri", label: "Fri", name: "Tempo Run", type: "cardio",
    warmup: "10 min easy jog",
    protocol: [
      { week: 1, label: "15 min tempo at 'comfortably hard'", rounds: 1, seconds: 900, rest: 0 },
      { week: 2, label: "18 min tempo", rounds: 1, seconds: 1080, rest: 0 },
      { week: 3, label: "20 min tempo", rounds: 1, seconds: 1200, rest: 0 },
      { week: 4, label: "2 × 12 min tempo, 3-min jog", rounds: 2, seconds: 720, rest: 180 },
    ],
    note: "Steady, strong, controlled — the pace you could hold for an hour race. Hold pace on the Run tab." },
  { id: "sat", label: "Sat", name: "Rest Day", type: "rest", warmup: "", note: "Full recovery or a short easy walk. Adaptation happens on rest days." },
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
  trenches: {
    id: "trenches",
    name: "Trenches",
    tagline: "D1 lineman size & power",
    equipment: ["Adjustable dumbbells", "Treadmill", "Bodyweight"],
    focus: "Mass, max strength & sled-style conditioning",
    accent: "🔨",
    days: TRENCHES_DAYS,
  },
  skill_speed: {
    id: "skill_speed",
    name: "Skill Speed",
    tagline: "D1 skill-position speed & agility",
    equipment: ["Dumbbells", "Open space", "Treadmill"],
    focus: "Acceleration, agility, plyos & lean strength",
    accent: "💨",
    days: SKILL_SPEED_DAYS,
  },
  track_sprint: {
    id: "track_sprint",
    name: "Track Sprinter",
    tagline: "D1 track 100/200m explosive power",
    equipment: ["Dumbbells", "Track / open space"],
    focus: "Acceleration, top speed, power & plyos",
    accent: "🏁",
    days: TRACK_SPRINT_DAYS,
  },
  distance: {
    id: "distance",
    name: "Distance Engine",
    tagline: "D1 cross-country / mid-distance",
    equipment: ["Running route", "Dumbbells"],
    focus: "Aerobic base, tempo, intervals & prehab",
    accent: "🏔️",
    days: DISTANCE_DAYS,
  },
};

export const PLAN_LIST = Object.values(PLANS);
export const DEFAULT_PLAN_ID = "gridiron";

// helper to make a 4-week identical interval protocol
export function mkProto(rounds, seconds, rest, label) {
  return [1, 2, 3, 4].map((week) => ({
    week,
    label: label || `${rounds} × ${seconds}-sec effort, ${rest}-sec rest`,
    rounds, seconds, rest,
  }));
}

// A sensible starter for "build your own" — fully editable.
export function starterCustomPlan() {
  const day = (id, label, name, type, extra) => ({ id, label, name, type, warmup: "5 min easy warm-up", note: "", ...extra });
  return {
    id: "custom", name: "My Program", accent: "⚙️", tagline: "Your custom plan",
    equipment: ["Your gear"], focus: "Custom",
    days: [
      day("sun", "Sun", "Full Body A", "lift", { exercises: [
        { name: "Goblet Squat", sets: r("3×12"), video: null, q: "goblet squat form" },
        { name: "Push-Up", sets: r("3×Max"), video: null, q: "push up form" },
        { name: "DB Row", sets: r("3×12"), video: null, q: "dumbbell row form" },
      ] }),
      day("mon", "Mon", "Cardio", "cardio", { protocol: mkProto(8, 20, 60) }),
      day("tue", "Tue", "Full Body B", "lift", { exercises: [
        { name: "DB Romanian Deadlift", sets: r("3×12"), video: null, q: "dumbbell romanian deadlift form" },
        { name: "DB Overhead Press", sets: r("3×12"), video: null, q: "dumbbell overhead press form" },
        { name: "Plank", sets: r("3×45s"), video: null, q: "plank form" },
      ] }),
      day("wed", "Wed", "Rest", "rest", {}),
      day("thu", "Thu", "Full Body C", "lift", { exercises: [
        { name: "DB Walking Lunge", sets: r("3×10/leg"), video: null, q: "dumbbell walking lunge form" },
        { name: "DB Floor Press", sets: r("3×12"), video: null, q: "dumbbell floor press form" },
        { name: "DB Bicep Curl", sets: r("3×12"), video: null, q: "dumbbell bicep curl form" },
      ] }),
      day("fri", "Fri", "Cardio", "cardio", { protocol: mkProto(6, 15, 60) }),
      day("sat", "Sat", "Rest", "rest", {}),
    ],
  };
}
function r(scheme) { return [scheme, scheme, scheme, scheme]; }

function normalizeCustom(cp) {
  if (!cp || !Array.isArray(cp.days) || cp.days.length !== 7) return starterCustomPlan();
  return cp;
}

export function getPlan(id) {
  return PLANS[id] || PLANS[DEFAULT_PLAN_ID];
}
export function planFor(state) {
  if (state?.profile?.planId === "custom") return normalizeCustom(state?.profile?.customPlan);
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
