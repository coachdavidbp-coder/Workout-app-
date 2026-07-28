// =========================================================
// Recipe library for the Meal Prep tab. Curated, macro-accurate,
// tagged by diet so we can match each user's eating style.
//   diet tags map to DIETS ids in data/plan.js:
//     balanced | high_protein | lower_carb | vegetarian | glp1
//   emoji = shown on each card's dish tile (see dishGradient below).
//   yt  = a YouTube "how-to" search query (opened on tap).
// =========================================================

export const RECIPES = [
  {
    id: "lentil-beet-salad",
    name: "Lentil Salad with Beets & Avocado",
    emoji: "🥗", img: "lentil,beet,salad",
    diet: ["balanced", "vegetarian", "high_protein"],
    tags: ["Beginner-Friendly", "High-Protein", "Gluten-Free"],
    cal: 450, protein: 20, fat: 18, carbs: 45, time: 15,
    ingredients: ["1 cup cooked lentils", "1 roasted beet, diced", "½ avocado", "2 cups arugula", "1 tbsp olive oil", "Lemon juice, salt, pepper"],
    steps: ["Toss arugula with olive oil and lemon.", "Add lentils and diced beet.", "Top with sliced avocado, season, and serve."],
    yt: "lentil beet avocado salad recipe",
  },
  {
    id: "chicken-rice-bowl",
    name: "Chicken & Rice Power Bowl",
    emoji: "🍚", img: "chicken,rice,bowl",
    diet: ["balanced", "high_protein"],
    tags: ["High-Protein", "Meal-Prep"],
    cal: 540, protein: 45, fat: 14, carbs: 55, time: 25,
    ingredients: ["6 oz grilled chicken", "1 cup cooked rice", "1 cup broccoli", "2 tbsp teriyaki", "Sesame seeds"],
    steps: ["Grill and slice the chicken.", "Steam the broccoli.", "Build the bowl over rice, drizzle teriyaki, top with sesame."],
    yt: "chicken rice meal prep bowl",
  },
  {
    id: "greek-yogurt-bowl",
    name: "Greek Yogurt Protein Bowl",
    emoji: "🥣", img: "greek,yogurt,berries",
    diet: ["balanced", "high_protein", "vegetarian", "glp1"],
    tags: ["Beginner-Friendly", "High-Protein", "No-Cook"],
    cal: 320, protein: 28, fat: 8, carbs: 35, time: 5,
    ingredients: ["1 cup nonfat Greek yogurt", "½ cup mixed berries", "1 tbsp honey", "2 tbsp granola", "1 tbsp chia seeds"],
    steps: ["Spoon yogurt into a bowl.", "Top with berries, granola, chia.", "Drizzle honey and enjoy."],
    yt: "high protein greek yogurt bowl",
  },
  {
    id: "salmon-asparagus",
    name: "Baked Salmon & Asparagus",
    emoji: "🐟", img: "salmon,asparagus",
    diet: ["balanced", "high_protein", "lower_carb"],
    tags: ["High-Protein", "Low-Carb", "Gluten-Free"],
    cal: 480, protein: 42, fat: 28, carbs: 8, time: 20,
    ingredients: ["6 oz salmon fillet", "1 bunch asparagus", "1 tbsp olive oil", "Garlic, lemon, salt, pepper"],
    steps: ["Heat oven to 400°F.", "Place salmon and asparagus on a sheet, oil and season.", "Bake 12–15 min, finish with lemon."],
    yt: "baked salmon asparagus sheet pan",
  },
  {
    id: "turkey-chili",
    name: "Lean Turkey Chili",
    emoji: "🍲", img: "turkey,chili",
    diet: ["balanced", "high_protein"],
    tags: ["High-Protein", "Meal-Prep", "Batch-Cook"],
    cal: 380, protein: 34, fat: 12, carbs: 34, time: 35,
    ingredients: ["1 lb 93% ground turkey", "1 can kidney beans", "1 can diced tomatoes", "1 onion", "Chili powder, cumin, garlic"],
    steps: ["Brown turkey with onion.", "Add beans, tomatoes, and spices.", "Simmer 20 min and serve."],
    yt: "healthy ground turkey chili recipe",
  },
  {
    id: "egg-veggie-scramble",
    name: "Egg White Veggie Scramble",
    emoji: "🍳", img: "egg,scramble,vegetables",
    diet: ["balanced", "high_protein", "lower_carb", "vegetarian", "glp1"],
    tags: ["High-Protein", "Low-Carb", "Quick"],
    cal: 260, protein: 28, fat: 12, carbs: 8, time: 10,
    ingredients: ["1 cup egg whites", "2 whole eggs", "Spinach", "Bell pepper", "Onion", "Salt, pepper"],
    steps: ["Sauté peppers and onion.", "Add spinach, then eggs.", "Scramble until set and season."],
    yt: "egg white veggie scramble high protein",
  },
  {
    id: "steak-sweet-potato",
    name: "Steak & Sweet Potato",
    emoji: "🥩", img: "steak,sweet,potato",
    diet: ["balanced", "high_protein"],
    tags: ["High-Protein", "Post-Workout"],
    cal: 560, protein: 44, fat: 22, carbs: 40, time: 30,
    ingredients: ["6 oz sirloin steak", "1 sweet potato", "Asparagus or greens", "Olive oil, salt, pepper"],
    steps: ["Roast cubed sweet potato at 425°F for 25 min.", "Sear steak 3–4 min per side, rest.", "Plate with a green veg."],
    yt: "steak and sweet potato meal prep",
  },
  {
    id: "tofu-stirfry",
    name: "Tofu Veggie Stir-Fry",
    emoji: "🥦", img: "tofu,stir,fry",
    diet: ["vegetarian", "balanced", "high_protein"],
    tags: ["Vegetarian", "High-Protein"],
    cal: 400, protein: 24, fat: 16, carbs: 42, time: 20,
    ingredients: ["1 block firm tofu", "2 cups stir-fry veggies", "1 cup rice", "Soy sauce, ginger, garlic"],
    steps: ["Press and cube tofu, pan-fry until golden.", "Add veggies and sauce.", "Serve over rice."],
    yt: "tofu vegetable stir fry recipe",
  },
  {
    id: "cauliflower-fried-rice",
    name: "Chicken Cauliflower Fried Rice",
    emoji: "🍚", img: "cauliflower,fried,rice",
    diet: ["lower_carb", "high_protein", "glp1"],
    tags: ["Low-Carb", "High-Protein"],
    cal: 340, protein: 32, fat: 14, carbs: 16, time: 20,
    ingredients: ["1 bag riced cauliflower", "6 oz chicken", "2 eggs", "Peas & carrots", "Soy sauce, sesame oil"],
    steps: ["Scramble eggs, set aside.", "Cook chicken, add cauliflower rice and veg.", "Stir in eggs and sauce."],
    yt: "cauliflower fried rice chicken low carb",
  },
  {
    id: "protein-oats",
    name: "Overnight Protein Oats",
    emoji: "🥣", img: "overnight,oats",
    diet: ["balanced", "high_protein", "vegetarian"],
    tags: ["Beginner-Friendly", "Meal-Prep", "No-Cook"],
    cal: 380, protein: 30, fat: 9, carbs: 48, time: 5,
    ingredients: ["½ cup oats", "1 scoop whey", "1 cup almond milk", "1 tbsp peanut butter", "Banana slices"],
    steps: ["Mix oats, whey, and milk in a jar.", "Refrigerate overnight.", "Top with peanut butter and banana."],
    yt: "overnight protein oats recipe",
  },
  {
    id: "shrimp-zoodles",
    name: "Garlic Shrimp Zoodles",
    emoji: "🍤", img: "shrimp,zucchini,noodles",
    diet: ["lower_carb", "high_protein", "glp1"],
    tags: ["Low-Carb", "High-Protein", "Quick"],
    cal: 300, protein: 34, fat: 12, carbs: 12, time: 15,
    ingredients: ["8 oz shrimp", "2 zucchini (spiralized)", "Garlic", "Olive oil", "Parmesan, lemon"],
    steps: ["Sauté garlic in oil.", "Add shrimp, cook 3 min.", "Toss in zoodles 2 min, finish with parm and lemon."],
    yt: "garlic shrimp zucchini noodles",
  },
  {
    id: "black-bean-tacos",
    name: "Black Bean & Veggie Tacos",
    emoji: "🌮", img: "black,bean,tacos",
    diet: ["vegetarian", "balanced"],
    tags: ["Vegetarian", "Quick"],
    cal: 420, protein: 18, fat: 14, carbs: 58, time: 15,
    ingredients: ["1 can black beans", "Corn tortillas", "Bell peppers", "Avocado", "Salsa, lime, cilantro"],
    steps: ["Warm beans with cumin.", "Char peppers.", "Fill tortillas, top with avocado, salsa, lime."],
    yt: "black bean veggie tacos recipe",
  },
  {
    id: "cottage-cheese-toast",
    name: "Cottage Cheese Protein Toast",
    emoji: "🍞", img: "cottage,cheese,toast",
    diet: ["balanced", "high_protein", "vegetarian", "glp1"],
    tags: ["High-Protein", "Quick", "No-Cook"],
    cal: 300, protein: 26, fat: 8, carbs: 30, time: 5,
    ingredients: ["1 slice whole-grain bread", "¾ cup cottage cheese", "Cucumber or tomato", "Everything seasoning"],
    steps: ["Toast the bread.", "Spread cottage cheese.", "Top with veg and seasoning."],
    yt: "cottage cheese toast high protein",
  },
  {
    id: "chicken-fajita-bowl",
    name: "Chicken Fajita Bowl",
    emoji: "🌶️", img: "chicken,fajita,bowl",
    diet: ["balanced", "high_protein", "lower_carb"],
    tags: ["High-Protein", "Meal-Prep"],
    cal: 460, protein: 42, fat: 16, carbs: 34, time: 25,
    ingredients: ["6 oz chicken", "Peppers & onions", "½ cup rice or cauli-rice", "Black beans", "Salsa, lime"],
    steps: ["Sauté seasoned chicken with peppers and onions.", "Serve over rice or cauli-rice with beans.", "Top with salsa and lime."],
    yt: "chicken fajita meal prep bowl",
  },
  {
    id: "protein-smoothie",
    name: "Peanut Butter Banana Protein Smoothie",
    emoji: "🥤", img: "protein,smoothie",
    diet: ["balanced", "high_protein", "vegetarian", "glp1"],
    tags: ["Quick", "No-Cook", "High-Protein"],
    cal: 350, protein: 32, fat: 10, carbs: 38, time: 5,
    ingredients: ["1 scoop whey", "1 banana", "1 tbsp peanut butter", "1 cup almond milk", "Ice"],
    steps: ["Add everything to a blender.", "Blend until smooth.", "Pour and drink."],
    yt: "peanut butter banana protein smoothie",
  },
  {
    id: "beef-broccoli",
    name: "Beef & Broccoli",
    emoji: "🥦", img: "beef,broccoli",
    diet: ["balanced", "high_protein", "lower_carb"],
    tags: ["High-Protein", "Low-Carb"],
    cal: 420, protein: 38, fat: 20, carbs: 20, time: 20,
    ingredients: ["6 oz flank steak", "3 cups broccoli", "Soy sauce, garlic, ginger", "1 tsp cornstarch"],
    steps: ["Sear sliced beef, remove.", "Cook broccoli, add sauce and beef.", "Thicken and serve."],
    yt: "beef and broccoli healthy recipe",
  },
  {
    id: "veggie-omelette",
    name: "Loaded Veggie Omelette",
    emoji: "🍳", img: "omelette,vegetables",
    diet: ["lower_carb", "vegetarian", "high_protein", "glp1"],
    tags: ["Low-Carb", "Vegetarian", "Quick"],
    cal: 320, protein: 24, fat: 22, carbs: 6, time: 10,
    ingredients: ["3 eggs", "Mushrooms", "Spinach", "Cheese", "Salt, pepper"],
    steps: ["Sauté mushrooms and spinach.", "Pour beaten eggs, add cheese.", "Fold and serve."],
    yt: "loaded veggie omelette recipe",
  },
  {
    id: "quinoa-chickpea",
    name: "Quinoa Chickpea Power Salad",
    emoji: "🥗", img: "quinoa,chickpea,salad",
    diet: ["vegetarian", "balanced", "high_protein"],
    tags: ["Vegetarian", "Meal-Prep", "High-Protein"],
    cal: 440, protein: 20, fat: 16, carbs: 55, time: 20,
    ingredients: ["1 cup cooked quinoa", "1 can chickpeas", "Cucumber, tomato", "Feta", "Lemon, olive oil"],
    steps: ["Combine quinoa and chickpeas.", "Add chopped veg and feta.", "Dress with lemon and oil."],
    yt: "quinoa chickpea salad meal prep",
  },
  {
    id: "chicken-caesar-wrap",
    name: "Grilled Chicken Caesar Wrap",
    emoji: "🌯", img: "chicken,caesar,wrap",
    diet: ["balanced", "high_protein"],
    tags: ["High-Protein", "Quick"],
    cal: 480, protein: 40, fat: 18, carbs: 38, time: 15,
    ingredients: ["6 oz grilled chicken", "1 large tortilla", "Romaine", "Light Caesar", "Parmesan"],
    steps: ["Toss romaine with Caesar and parm.", "Add sliced chicken.", "Wrap tightly and slice."],
    yt: "grilled chicken caesar wrap recipe",
  },
  {
    id: "tuna-avocado",
    name: "Tuna Avocado Boats",
    emoji: "🥑", img: "tuna,avocado",
    diet: ["lower_carb", "high_protein", "glp1"],
    tags: ["Low-Carb", "High-Protein", "No-Cook"],
    cal: 330, protein: 30, fat: 20, carbs: 10, time: 8,
    ingredients: ["2 pouches tuna", "1 avocado", "Greek yogurt", "Lemon, celery, salt"],
    steps: ["Mix tuna with yogurt, lemon, celery.", "Halve and pit avocado.", "Fill each half with tuna salad."],
    yt: "tuna stuffed avocado recipe",
  },
  {
    id: "sheetpan-chicken-veg",
    name: "Sheet-Pan Chicken & Veggies",
    emoji: "🍗", img: "sheet,pan,chicken,vegetables",
    diet: ["balanced", "high_protein", "lower_carb", "glp1"],
    tags: ["High-Protein", "Meal-Prep", "One-Pan"],
    cal: 440, protein: 44, fat: 18, carbs: 24, time: 30,
    ingredients: ["2 chicken breasts", "Broccoli, peppers, zucchini", "Olive oil", "Paprika, garlic, salt"],
    steps: ["Heat oven to 425°F.", "Toss chicken and veg with oil and spice on a sheet.", "Roast 22–25 min."],
    yt: "sheet pan chicken and vegetables meal prep",
  },
  {
    id: "protein-pancakes",
    name: "Banana Protein Pancakes",
    emoji: "🥞", img: "protein,pancakes",
    diet: ["balanced", "high_protein", "vegetarian"],
    tags: ["High-Protein", "Breakfast"],
    cal: 400, protein: 30, fat: 10, carbs: 48, time: 15,
    ingredients: ["1 banana", "2 eggs", "1 scoop whey", "½ cup oats", "Baking powder"],
    steps: ["Blend all ingredients.", "Cook small pancakes on a nonstick pan.", "Stack and top with fruit."],
    yt: "banana protein pancakes recipe",
  },
  {
    id: "zucchini-lasagna",
    name: "Zucchini Lasagna",
    emoji: "🍝", img: "zucchini,lasagna",
    diet: ["lower_carb", "high_protein"],
    tags: ["Low-Carb", "High-Protein", "Batch-Cook"],
    cal: 380, protein: 34, fat: 18, carbs: 18, time: 45,
    ingredients: ["3 zucchini (sliced)", "1 lb lean beef or turkey", "Marinara", "Ricotta", "Mozzarella"],
    steps: ["Brown the meat with marinara.", "Layer zucchini, meat sauce, ricotta.", "Top with mozzarella, bake 30 min at 375°F."],
    yt: "zucchini lasagna low carb recipe",
  },
  {
    id: "chia-pudding",
    name: "Vanilla Chia Pudding",
    emoji: "🍮", img: "chia,pudding",
    diet: ["vegetarian", "balanced", "glp1", "lower_carb"],
    tags: ["Vegetarian", "No-Cook", "Meal-Prep"],
    cal: 280, protein: 14, fat: 14, carbs: 24, time: 5,
    ingredients: ["3 tbsp chia seeds", "1 cup almond milk", "1 scoop vanilla protein", "Berries"],
    steps: ["Whisk chia, milk, and protein.", "Refrigerate 4 hrs or overnight.", "Top with berries."],
    yt: "protein chia pudding recipe",
  },
  {
    id: "turkey-lettuce-wraps",
    name: "Asian Turkey Lettuce Wraps",
    emoji: "🥬", img: "turkey,lettuce,wraps",
    diet: ["lower_carb", "high_protein", "glp1"],
    tags: ["Low-Carb", "High-Protein"],
    cal: 320, protein: 34, fat: 14, carbs: 14, time: 20,
    ingredients: ["1 lb ground turkey", "Butter lettuce", "Water chestnuts", "Hoisin, soy, ginger, garlic"],
    steps: ["Brown turkey with garlic and ginger.", "Stir in hoisin, soy, chestnuts.", "Spoon into lettuce cups."],
    yt: "turkey lettuce wraps recipe",
  },
  {
    id: "veggie-buddha-bowl",
    name: "Roasted Veggie Buddha Bowl",
    emoji: "🥙", img: "buddha,bowl,vegetables",
    diet: ["vegetarian", "balanced"],
    tags: ["Vegetarian", "Meal-Prep"],
    cal: 470, protein: 16, fat: 20, carbs: 60, time: 30,
    ingredients: ["Sweet potato", "Chickpeas", "Quinoa", "Kale", "Tahini dressing"],
    steps: ["Roast sweet potato and chickpeas.", "Assemble over quinoa and kale.", "Drizzle tahini."],
    yt: "roasted vegetable buddha bowl recipe",
  },
  {
    id: "egg-muffins",
    name: "Meal-Prep Egg Muffins",
    emoji: "🧁", img: "egg,muffins",
    diet: ["lower_carb", "high_protein", "vegetarian", "glp1"],
    tags: ["Low-Carb", "Meal-Prep", "Batch-Cook"],
    cal: 90, protein: 9, fat: 5, carbs: 2, time: 25,
    ingredients: ["8 eggs", "Spinach", "Bell pepper", "Cheese", "Salt, pepper"],
    steps: ["Whisk eggs and mix in veg.", "Pour into a muffin tin.", "Bake 20 min at 350°F (makes ~10)."],
    yt: "egg muffins meal prep recipe",
  },
];

export const RECIPE_TAGS = ["High-Protein", "Low-Carb", "Vegetarian", "Meal-Prep", "Quick", "No-Cook"];

// Deterministic dish tile: a food emoji on a unique gradient derived from the
// recipe id. No network photos — so every card always matches its dish (real
// photo services return random / broken images, which is why they were dropped).
export function dishGradient(recipe) {
  const s = recipe?.id || recipe?.name || "meal";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  const h2 = (h + 32) % 360;
  return { background: `linear-gradient(140deg, hsl(${h} 58% 34%), hsl(${h2} 64% 17%))` };
}

// Filter + search. `diet` narrows to the user's eating style (or "all").
// `query` matches name/tags/ingredients. `ingredients` (array) ranks by overlap.
export function findRecipes({ diet = "all", query = "", ingredients = [] } = {}) {
  const q = query.trim().toLowerCase();
  const ing = ingredients.map((i) => i.trim().toLowerCase()).filter(Boolean);

  let list = RECIPES.filter((r) => diet === "all" || r.diet.includes(diet));

  if (q) {
    list = list.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q)) ||
        r.ingredients.some((i) => i.toLowerCase().includes(q))
    );
  }

  if (ing.length) {
    list = list
      .map((r) => {
        const text = r.ingredients.join(" ").toLowerCase();
        const matches = ing.filter((i) => text.includes(i)).length;
        return { r, matches };
      })
      .filter((x) => x.matches > 0)
      .sort((a, b) => b.matches - a.matches)
      .map((x) => x.r);
  }

  return list;
}
