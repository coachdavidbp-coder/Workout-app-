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

  // nuts / fats / snacks
  { id: "pbutter", name: "Peanut Butter", unit: "2 tbsp", cal: 190, p: 8 },
  { id: "almonds", name: "Almonds", unit: "1 oz", cal: 164, p: 6 },
  { id: "avocado", name: "Avocado", unit: "½ fruit", cal: 120, p: 1 },
  { id: "oliveoil", name: "Olive Oil", unit: "1 tbsp", cal: 119, p: 0 },
  { id: "proteinbar", name: "Protein Bar", unit: "1 bar", cal: 200, p: 20 },
  { id: "trailmix", name: "Trail Mix", unit: "¼ cup", cal: 170, p: 5 },

  // --- Costco / Kirkland ---
  { id: "kirk-rotis", name: "Kirkland Rotisserie Chicken", unit: "3 oz", cal: 140, p: 19 },
  { id: "kirk-chixbreast", name: "Kirkland Chicken Breast (canned)", unit: "2 oz", cal: 60, p: 13 },
  { id: "kirk-groundbeef", name: "Kirkland Organic Ground Beef (85%)", unit: "4 oz", cal: 240, p: 21 },
  { id: "kirk-salmon", name: "Kirkland Atlantic Salmon", unit: "6 oz", cal: 340, p: 40 },
  { id: "kirk-eggwhites", name: "Kirkland Egg Whites", unit: "3 tbsp", cal: 25, p: 5 },
  { id: "kirk-greekyog", name: "Kirkland Greek Yogurt (nonfat)", unit: "1 cup", cal: 120, p: 22 },
  { id: "kirk-proteinbar", name: "Kirkland Protein Bar", unit: "1 bar", cal: 190, p: 21 },
  { id: "kirk-almonds", name: "Kirkland Almonds", unit: "1 oz", cal: 170, p: 6 },
  { id: "kirk-trailmix", name: "Kirkland Trail Mix", unit: "¼ cup", cal: 180, p: 5 },
  { id: "kirk-quinoa", name: "Kirkland Organic Quinoa", unit: "1 cup", cal: 220, p: 8 },
  { id: "costco-hotdog", name: "Costco Food Court Hot Dog", unit: "1 dog + bun", cal: 550, p: 21 },
  { id: "costco-pizza", name: "Costco Food Court Pizza", unit: "1 slice", cal: 700, p: 34 },
  { id: "costco-chixbake", name: "Costco Chicken Bake", unit: "1 bake", cal: 770, p: 43 },

  // --- Fast food: Wendy's ---
  { id: "wen-single", name: "Wendy's Dave's Single", unit: "1 burger", cal: 590, p: 30 },
  { id: "wen-baconator", name: "Wendy's Baconator", unit: "1 burger", cal: 950, p: 59 },
  { id: "wen-jrcheese", name: "Wendy's Jr. Cheeseburger", unit: "1 burger", cal: 290, p: 15 },
  { id: "wen-spicychix", name: "Wendy's Spicy Chicken Sandwich", unit: "1 sandwich", cal: 490, p: 28 },
  { id: "wen-grilledchix", name: "Wendy's Grilled Chicken Sandwich", unit: "1 sandwich", cal: 360, p: 34 },
  { id: "wen-nuggets10", name: "Wendy's 10pc Nuggets", unit: "10 pieces", cal: 420, p: 22 },
  { id: "wen-chili", name: "Wendy's Chili (large)", unit: "1 large", cal: 330, p: 28 },
  { id: "wen-fries", name: "Wendy's Fries (medium)", unit: "1 medium", cal: 420, p: 5 },

  // --- Fast food: McDonald's ---
  { id: "mcd-bigmac", name: "McDonald's Big Mac", unit: "1 burger", cal: 590, p: 25 },
  { id: "mcd-mcdouble", name: "McDonald's McDouble", unit: "1 burger", cal: 400, p: 22 },
  { id: "mcd-mcchicken", name: "McDonald's McChicken", unit: "1 sandwich", cal: 400, p: 14 },
  { id: "mcd-nuggets10", name: "McDonald's 10pc McNuggets", unit: "10 pieces", cal: 420, p: 23 },
  { id: "mcd-eggmcmuffin", name: "McDonald's Egg McMuffin", unit: "1 muffin", cal: 310, p: 17 },
  { id: "mcd-fries", name: "McDonald's Fries (medium)", unit: "1 medium", cal: 320, p: 4 },

  // --- Fast food: Chick-fil-A ---
  { id: "cfa-sandwich", name: "Chick-fil-A Chicken Sandwich", unit: "1 sandwich", cal: 420, p: 29 },
  { id: "cfa-grilled", name: "Chick-fil-A Grilled Chicken Sandwich", unit: "1 sandwich", cal: 320, p: 28 },
  { id: "cfa-nuggets8", name: "Chick-fil-A 8pc Nuggets", unit: "8 pieces", cal: 250, p: 27 },
  { id: "cfa-cobb", name: "Chick-fil-A Cobb Salad (grilled)", unit: "1 salad", cal: 510, p: 40 },

  // --- Fast food: Chipotle ---
  { id: "chp-chixbowl", name: "Chipotle Chicken Bowl (rice, beans)", unit: "1 bowl", cal: 625, p: 45 },
  { id: "chp-steakbowl", name: "Chipotle Steak Bowl (rice, beans)", unit: "1 bowl", cal: 640, p: 42 },
  { id: "chp-burrito", name: "Chipotle Chicken Burrito", unit: "1 burrito", cal: 975, p: 51 },

  // --- Fast food: In-N-Out / Taco Bell / Subway ---
  { id: "ino-double", name: "In-N-Out Double-Double", unit: "1 burger", cal: 670, p: 37 },
  { id: "ino-proteinstyle", name: "In-N-Out Cheeseburger (Protein Style)", unit: "1 burger", cal: 330, p: 18 },
  { id: "tb-crunchytaco", name: "Taco Bell Crunchy Taco", unit: "1 taco", cal: 170, p: 8 },
  { id: "tb-chixquesadilla", name: "Taco Bell Chicken Quesadilla", unit: "1 quesadilla", cal: 510, p: 25 },
  { id: "sub-turkey6", name: "Subway 6\" Turkey Breast", unit: "1 sub", cal: 280, p: 18 },
  { id: "sub-chix6", name: "Subway 6\" Rotisserie Chicken", unit: "1 sub", cal: 350, p: 29 },
  { id: "sbux-eggbites", name: "Starbucks Egg White Bites", unit: "2 bites", cal: 170, p: 12 },
];

export const MEAL_SLOTS = ["Breakfast", "Lunch", "Dinner", "Snack"];
