// =========================================================
// Built-in common-foods table (per single serving unless noted).
// Used for instant, offline macro logging. Open Food Facts
// search covers everything else (see src/lib/foodApi.js).
// cal = calories, p = protein (g). `unit` describes one serving.
// =========================================================

export const BUILTIN_FOODS = [
  // eggs / breakfast
  { id: "egg", name: "Egg (large)", unit: "1 egg", cal: 72, p: 6 },
  { id: "eggs3", name: "3 Scrambled Eggs", unit: "3 eggs", cal: 215, p: 18 },
  { id: "toast", name: "Toast (1 slice)", unit: "1 slice", cal: 80, p: 3 },
  { id: "greekyog", name: "Greek Yogurt (plain)", unit: "1 cup", cal: 130, p: 22 },
  { id: "greekberry", name: "Greek Yogurt + Berries", unit: "1 cup", cal: 180, p: 17 },
  { id: "cottage", name: "Cottage Cheese", unit: "1 cup", cal: 180, p: 24 },
  { id: "oatmeal", name: "Oatmeal (cooked)", unit: "1 cup", cal: 150, p: 5 },
  { id: "banana", name: "Banana", unit: "1 medium", cal: 105, p: 1 },
  { id: "apple", name: "Apple", unit: "1 medium", cal: 95, p: 0 },
  { id: "berries", name: "Mixed Berries", unit: "1 cup", cal: 70, p: 1 },
  { id: "pineapple", name: "Pineapple", unit: "1 cup", cal: 82, p: 1 },

  // protein staples
  { id: "shake", name: "Whey Protein Shake", unit: "1 scoop", cal: 130, p: 25 },
  { id: "rotis", name: "Rotisserie Chicken", unit: "6 oz", cal: 280, p: 52 },
  { id: "chickenbreast", name: "Chicken Breast (cooked)", unit: "6 oz", cal: 280, p: 53 },
  { id: "chickenthigh", name: "Baked Chicken Thigh", unit: "1 thigh", cal: 180, p: 21 },
  { id: "turkey", name: "Ground Turkey (93%)", unit: "4 oz", cal: 170, p: 22 },
  { id: "leanbeef", name: "Lean Beef (90%)", unit: "4 oz", cal: 200, p: 23 },
  { id: "tuna", name: "Tuna Packet", unit: "1 pouch", cal: 90, p: 20 },
  { id: "salmon", name: "Baked Salmon", unit: "6 oz", cal: 350, p: 40 },
  { id: "tilapia", name: "Baked Tilapia", unit: "6 oz", cal: 220, p: 45 },
  { id: "deliturkey", name: "Deli Turkey", unit: "3 oz", cal: 90, p: 16 },
  { id: "sausage", name: "Chicken Sausage", unit: "1 link", cal: 140, p: 14 },
  { id: "jerky", name: "Beef Jerky", unit: "1 oz", cal: 80, p: 12 },
  { id: "stringcheese", name: "String Cheese", unit: "1 stick", cal: 80, p: 7 },
  { id: "boiledegg", name: "Hard-Boiled Egg", unit: "1 egg", cal: 78, p: 6 },

  // carbs / sides
  { id: "ricecup", name: "Rice (cooked)", unit: "1 cup", cal: 205, p: 4 },
  { id: "pasta", name: "Pasta (cooked)", unit: "1 cup", cal: 220, p: 8 },
  { id: "tortilla", name: "Flour Tortilla", unit: "1 medium", cal: 140, p: 4 },
  { id: "crackers", name: "Crackers", unit: "1 serving", cal: 120, p: 2 },
  { id: "veggies", name: "Frozen Veggie Mix", unit: "1 cup", cal: 60, p: 3 },
  { id: "greenbeans", name: "Green Beans", unit: "1 cup", cal: 35, p: 2 },
  { id: "peppers", name: "Peppers & Onions", unit: "1 cup", cal: 50, p: 2 },
  { id: "salsa", name: "Salsa", unit: "2 tbsp", cal: 10, p: 0 },
  { id: "cheese", name: "Shredded Cheese", unit: "¼ cup", cal: 110, p: 7 },
  { id: "mayo", name: "Light Mayo", unit: "1 tbsp", cal: 35, p: 0 },
  { id: "honey", name: "Honey", unit: "1 tbsp", cal: 64, p: 0 },
];

export const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"];
