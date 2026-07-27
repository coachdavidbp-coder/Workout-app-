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

// Smart defaults derived from bodyweight + goal + diet, used to seed onboarding.
export function defaultTargets({ weight = 200, goal = "lose", sex = "m", diet = "balanced" } = {}) {
  const perLbProtein = (DIETS[diet] || DIETS.balanced).proteinPerLb;
  const protein = Math.round(Math.min(240, Math.max(80, weight * perLbProtein)));
  const waterOz = Math.round(Math.min(120, Math.max(64, weight * 0.5)));
  const perLb = goal === "strength" ? 14 : goal === "maintain" ? 13 : goal === "faster" ? 12 : 11;
  const calories = Math.round((weight * perLb) / 50) * 50; // nearest 50
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

// ---- diet styles: each user picks one; drives meal ideas + protein target ----
export const DIETS = {
  balanced: {
    id: "balanced", name: "Balanced", proteinPerLb: 0.6,
    blurb: "A bit of everything — protein, carbs, veggies.",
    ideas: [
      { title: "Breakfasts", items: ["Eggs + oatmeal + fruit", "Greek yogurt + granola + berries", "Protein smoothie + banana"] },
      { title: "Lunches", items: ["Chicken + rice + veggies", "Turkey wrap + side salad", "Tuna + crackers + fruit"] },
      { title: "Dinners", items: ["Salmon + potato + greens", "Lean beef stir-fry + rice", "Chicken pasta + veggies"] },
      { title: "Snacks", items: ["Greek yogurt", "Fruit + nuts", "String cheese"] },
    ],
    grocery: "Eggs · oats · Greek yogurt · chicken · turkey · lean beef · salmon · rice · potatoes · mixed veggies · fruit · nuts",
    notes: ["Protein at every meal", "Half your plate veggies", "80+ oz water a day"],
  },
  high_protein: {
    id: "high_protein", name: "High Protein", proteinPerLb: 0.85,
    blurb: "Protein-forward to build and hold muscle.",
    ideas: [
      { title: "Breakfasts", items: ["4 eggs + turkey sausage", "Greek yogurt (2 cups) + whey", "Protein oats + egg whites"] },
      { title: "Lunches", items: ["8 oz chicken + rice", "Lean beef bowl + beans", "Tuna + cottage cheese"] },
      { title: "Dinners", items: ["Steak + potato", "Chicken thighs + quinoa", "Shrimp stir-fry + rice"] },
      { title: "Snacks", items: ["Protein shake", "Cottage cheese", "Jerky + string cheese"] },
    ],
    grocery: "Eggs · chicken · lean beef · steak · shrimp · Greek yogurt · cottage cheese · whey · rice · quinoa · beans",
    notes: ["Hit protein first at every meal", "Shake within an hour post-workout", "Water 80+ oz"],
  },
  lower_carb: {
    id: "lower_carb", name: "Lower Carb", proteinPerLb: 0.75,
    blurb: "Protein + healthy fats, lighter on starches.",
    ideas: [
      { title: "Breakfasts", items: ["Eggs + avocado", "Greek yogurt + berries", "Veggie omelet + cheese"] },
      { title: "Lunches", items: ["Chicken Caesar (no croutons)", "Lettuce-wrap burgers", "Salmon + big salad"] },
      { title: "Dinners", items: ["Steak + asparagus", "Chicken + broccoli", "Ground turkey + zucchini"] },
      { title: "Snacks", items: ["Cheese", "Nuts", "Hard-boiled eggs"] },
    ],
    grocery: "Eggs · avocado · chicken · steak · salmon · turkey · leafy greens · broccoli · zucchini · cheese · nuts",
    notes: ["Protein + healthy fats each meal", "Load up on non-starchy veggies", "Water + electrolytes"],
  },
  vegetarian: {
    id: "vegetarian", name: "Vegetarian", proteinPerLb: 0.6,
    blurb: "Meat-free, still protein-focused.",
    ideas: [
      { title: "Breakfasts", items: ["Greek yogurt + granola", "Tofu scramble + toast", "Protein oats + peanut butter"] },
      { title: "Lunches", items: ["Chickpea + quinoa bowl", "Lentil soup + bread", "Cottage cheese + fruit"] },
      { title: "Dinners", items: ["Tofu stir-fry + rice", "Black bean tacos", "Veggie pasta + edamame"] },
      { title: "Snacks", items: ["Greek yogurt", "Edamame", "Nuts + cheese"] },
    ],
    grocery: "Eggs · Greek yogurt · cottage cheese · tofu · tempeh · lentils · chickpeas · beans · quinoa · edamame · nuts",
    notes: ["Combine plant proteins across the day", "A protein powder helps hit targets", "Watch B12 + iron"],
  },
  glp1: {
    id: "glp1", name: "GLP-1 Friendly", proteinPerLb: 0.55,
    blurb: "Small appetite? Protein-first, easy-to-eat meals.",
    ideas: [
      { title: "Breakfasts", items: ["3 scrambled eggs + toast", "Greek yogurt + berries + honey", "Protein shake + banana"] },
      { title: "Lunches", items: ["Rotisserie chicken + rice cup", "Tuna packet + light mayo + crackers", "Turkey taco bowl"] },
      { title: "Dinners", items: ["Baked chicken thighs + veggies", "Lean beef + marinara + small pasta", "Baked salmon + rice + green beans"] },
      { title: "Snacks", items: ["String cheese · jerky · boiled eggs", "Protein shake if meals won't finish"] },
    ],
    grocery: "Eggs · rotisserie chicken · ground turkey · tuna packets · Greek yogurt · cottage cheese · string cheese · whey · frozen veggies · rice",
    notes: ["Drink your protein when appetite is low", "Eat protein within an hour after lifting", "Go easy on greasy/fried food", "Confirm intake supports your training with your doctor"],
  },
};

export function dietFor(profile = {}) {
  return DIETS[profile.diet] || DIETS.balanced;
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
