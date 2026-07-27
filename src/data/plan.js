// =========================================================
// Nutrition reference content + per-person targets.
// (Training programs now live in plans.js.)
// =========================================================

// Default targets; per-user values come from the profile (set at onboarding).
export const MEAL_TARGETS = {
  protein: 125,
  calories: 2000,
  waterOz: 80,
};

// Smart defaults derived from bodyweight + goal, used to seed onboarding.
export function defaultTargets({ weight = 200, goal = "lose", sex = "m" } = {}) {
  const protein = Math.round(Math.min(220, Math.max(80, weight * 0.6)));
  const waterOz = Math.round(Math.min(120, Math.max(64, weight * 0.5)));
  const perLb = goal === "gain" ? 15 : goal === "maintain" ? 13 : 11;
  const calories = Math.round((weight * perLb) / 50) * 50; // rounded to nearest 50
  return { protein, waterOz, calories };
}

// Resolve the targets to use for a given profile (falls back to defaults).
export function targetsFor(profile = {}) {
  return {
    protein: profile.proteinGoal || MEAL_TARGETS.protein,
    calories: profile.calorieGoal || MEAL_TARGETS.calories,
    waterOz: profile.waterGoal || MEAL_TARGETS.waterOz,
  };
}

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
  "Prioritize protein first at every meal to hold onto muscle",
  "Confirm with your doctor that your intake supports 6 training days/week",
];
