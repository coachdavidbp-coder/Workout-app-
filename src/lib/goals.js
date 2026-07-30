// =========================================================
// Ring-goal recommendation. Derives Move (active calories),
// Exercise (minutes) and Workouts targets from body data +
// activity level + the training load your own program asks for.
// Pure math, no network. Everything is overridable by hand.
// =========================================================

// NEAT-only multipliers: everyday movement EXCLUDING workouts. The standard
// TDEE factors bake exercise in, which would double-count the training burn
// we add separately from the user's own program.
export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Desk job", factor: 1.15, blurb: "Sitting most of the day" },
  { id: "light", label: "Lightly active", factor: 1.25, blurb: "On your feet a fair bit" },
  { id: "moderate", label: "Active", factor: 1.35, blurb: "Moving most of the day" },
  { id: "very", label: "Very active", factor: 1.5, blurb: "Physical job, always moving" },
  { id: "athlete", label: "Athlete", factor: 1.6, blurb: "In season, on your feet all day" },
];

export const GOAL_LABELS = {
  lose: "Lose weight",
  maintain: "Maintain",
  strength: "Get stronger",
  faster: "Get faster",
};

// Mifflin–St Jeor resting burn, then the ACTIVE burn a Move ring counts:
// everyday movement above resting (NEAT) PLUS the burn your own program
// asks for, averaged across the week.
export function recommendGoals({
  sex, age, heightIn, weightLb,
  activityLevel = "moderate",
  goal = "lose",
  trainingDays = 6,
  avgMin = 35,
} = {}) {
  const kg = Math.max(35, (parseFloat(weightLb) || 180) * 0.45359237);
  const cm = Math.max(120, (parseFloat(heightIn) || 70) * 2.54);
  const a = Math.min(80, Math.max(13, parseInt(age, 10) || 25));
  const male = !String(sex || "m").toLowerCase().startsWith("f");

  const bmr = Math.round(10 * kg + 6.25 * cm - 5 * a + (male ? 5 : -161));
  const level = ACTIVITY_LEVELS.find((l) => l.id === activityLevel) || ACTIVITY_LEVELS[2];

  // Everyday movement above resting.
  const neat = bmr * (level.factor - 1);

  // What the program itself burns, spread over the week. Bigger bodies burn
  // more per minute, so scale by bodyweight.
  const days = Math.max(0, Math.min(7, parseInt(trainingDays, 10) || 6));
  const mins = Math.max(10, parseInt(avgMin, 10) || 35);
  const calPerMin = (kg / 0.45359237) * 0.045; // kg is already floored, so never negative
  const trainPerDay = (days * mins * calPerMin) / 7;

  const bump = goal === "lose" ? 1.12 : goal === "faster" ? 1.08 : 1;
  const moveGoal = clampRound((neat + trainPerDay) * bump, 250, 1500, 25);

  // Exercise target comes from the program itself: its weekly minutes / 7.
  const weeklyMin = Math.max(90, days * mins);
  const exerciseGoal = clampRound(weeklyMin / 7, 15, 90, 5);

  const workoutsGoal = Math.max(1, Math.min(7, days || 6));
  const tdee = Math.round(bmr + neat + trainPerDay);

  return { bmr, tdee, level, moveGoal, exerciseGoal, workoutsGoal, weeklyMin, trainPerDay: Math.round(trainPerDay) };
}

function clampRound(n, min, max, step) {
  const r = Math.round(n / step) * step;
  return Math.max(min, Math.min(max, r));
}

// Day → week → month view of a daily goal (month ≈ 30 days).
export function spread(daily) {
  const d = Math.max(0, Math.round(daily || 0));
  return { day: d, week: d * 7, month: d * 30 };
}
