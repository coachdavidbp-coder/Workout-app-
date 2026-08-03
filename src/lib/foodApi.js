// =========================================================
// Food lookups — free tiers only.
//
//   • Nutritionix — restaurant and chain menus. This is the one that knows
//     El Pollo Loco, Subway, Chipotle, In-N-Out. Free key at
//     developer.nutritionix.com. Without it, chain menu items mostly won't
//     be found, because the other two sources aren't menu databases.
//   • USDA FoodData Central — packaged grocery products off the label, plus
//     generic whole foods. Free key at fdc.nal.usda.gov/api-key-signup.
//   • Open Food Facts — no key. Packaged goods and barcodes.
//
// Worth being clear about the division: USDA "Branded" is retail packaging
// with a UPC, and Open Food Facts is the same kind of thing. A burrito
// handed to you over a counter has no barcode, so neither database carries
// it. That's why chains need Nutritionix rather than a better query.
// =========================================================

const USDA_KEY = import.meta.env.VITE_USDA_KEY || "";
const USDA_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const OFF_SEARCH = "https://world.openfoodfacts.org/cgi/search.pl";
const OFF_BARCODE = "https://world.openfoodfacts.org/api/v0/product";

const NIX_ID = import.meta.env.VITE_NUTRITIONIX_APP_ID || "";
const NIX_KEY = import.meta.env.VITE_NUTRITIONIX_KEY || "";
const NIX_INSTANT = "https://trackapi.nutritionix.com/v2/search/instant";
const NIX_ITEM = "https://trackapi.nutritionix.com/v2/search/item";

export const usdaEnabled = Boolean(USDA_KEY);
export const restaurantsEnabled = Boolean(NIX_ID && NIX_KEY);

// ---------- USDA ----------
function nutrient(food, ids) {
  const list = food.foodNutrients || [];
  const n = list.find(
    (x) => ids.includes(x.nutrientId) || ids.includes(Number(x.nutrientNumber))
  );
  return n ? Number(n.value) || 0 : 0;
}

function normalizeUSDA(food) {
  const cal100 = nutrient(food, [1008]); // Energy (kcal)
  const p100 = nutrient(food, [1003]); // Protein
  let cal = cal100, p = p100, unit = "100 g";
  const size = Number(food.servingSize);
  const su = (food.servingSizeUnit || "").toLowerCase();
  if (size && (su === "g" || su === "ml")) {
    const f = size / 100;
    cal = cal100 * f;
    p = p100 * f;
    unit = food.householdServingFullText || `${size} ${food.servingSizeUnit}`;
  } else if (food.householdServingFullText) {
    unit = food.householdServingFullText;
  }
  const brand = food.brandName || food.brandOwner;
  let name = food.description || "Food";
  if (brand && !name.toLowerCase().includes(brand.toLowerCase().slice(0, 6))) {
    name = `${name} · ${brand}`;
  }
  return {
    name: name.slice(0, 72),
    cal: Math.round(cal),
    p: Math.round(p * 10) / 10,
    unit,
    external: true,
  };
}

async function searchUSDA(query, signal) {
  const url =
    `${USDA_URL}?api_key=${USDA_KEY}&query=${encodeURIComponent(query)}` +
    `&pageSize=25&dataType=${encodeURIComponent("Branded,Survey (FNDDS),Foundation,SR Legacy")}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("usda failed");
  const data = await res.json();
  return (data.foods || []).map(normalizeUSDA).filter((f) => f.cal > 0);
}

// ---------- Open Food Facts ----------
function normalizeOFF(product) {
  const n = product.nutriments || {};
  const perServing = n["energy-kcal_serving"] != null || n["proteins_serving"] != null;
  const cal = Math.round((perServing ? n["energy-kcal_serving"] : n["energy-kcal_100g"]) || 0);
  const p = Math.round(((perServing ? n["proteins_serving"] : n["proteins_100g"]) || 0) * 10) / 10;
  const unit = perServing ? product.serving_size || "1 serving" : "100 g";
  const name = product.product_name || product.generic_name || product.brands || "Food";
  return { name: name.slice(0, 72), cal, p, unit, external: true };
}

async function searchOFF(query, signal) {
  const url = `${OFF_SEARCH}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,generic_name,brands,serving_size,nutriments`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("off failed");
  const data = await res.json();
  return (data.products || []).map(normalizeOFF).filter((f) => f.name && f.cal > 0);
}

// ---------- Nutritionix (restaurant + chain menus) ----------
const nixHeaders = () => ({ "x-app-id": NIX_ID, "x-app-key": NIX_KEY });

function normalizeNix(item) {
  const brand = item.brand_name || "";
  const name = item.food_name || "Menu item";
  const qty = item.serving_qty;
  const unit = item.serving_unit;
  return {
    name: (brand ? `${name} · ${brand}` : name).slice(0, 72),
    cal: Math.round(item.nf_calories || 0),
    // The instant endpoint returns calories but not protein. We fetch the
    // rest only for the item you actually pick, which keeps the free
    // quota going a long way.
    p: null,
    unit: qty && unit ? `${qty} ${unit}` : "1 serving",
    nixId: item.nix_item_id || null,
    external: true,
    restaurant: true,
  };
}

async function searchRestaurants(query, signal) {
  const url = `${NIX_INSTANT}?query=${encodeURIComponent(query)}&branded=true&common=false&detailed=false`;
  const res = await fetch(url, { headers: nixHeaders(), signal });
  if (!res.ok) throw new Error("nutritionix failed");
  const data = await res.json();
  return (data.branded || [])
    .map(normalizeNix)
    .filter((f) => f.cal > 0 && f.nixId);
}

// Fills in the macros for one chosen menu item.
export async function resolveRestaurantItem(food, signal) {
  if (!food?.nixId || !restaurantsEnabled) return food;
  try {
    const res = await fetch(`${NIX_ITEM}?nix_item_id=${encodeURIComponent(food.nixId)}`, {
      headers: nixHeaders(), signal,
    });
    if (!res.ok) return food;
    const data = await res.json();
    const f = (data.foods || [])[0];
    if (!f) return food;
    return {
      ...food,
      cal: Math.round(f.nf_calories ?? food.cal),
      p: Math.round((f.nf_protein || 0) * 10) / 10,
      unit: f.serving_qty && f.serving_unit ? `${f.serving_qty} ${f.serving_unit}` : food.unit,
    };
  } catch (e) {
    return food;
  }
}

// ---------- public ----------
// Query USDA and Open Food Facts in parallel and merge — if one source is
// down, blocked by CORS, or has no match, the other still returns results.
export async function searchFoods(query, signal) {
  const safe = (p) => p.catch((e) => { if (e.name === "AbortError") throw e; return []; });
  const jobs = [];
  // Restaurants first — if you typed a chain name, that's what you meant.
  if (restaurantsEnabled) jobs.push(safe(searchRestaurants(query, signal)));
  if (usdaEnabled) jobs.push(safe(searchUSDA(query, signal)));
  jobs.push(safe(searchOFF(query, signal)));

  let lists;
  try {
    lists = await Promise.all(jobs);
  } catch (e) {
    if (e.name === "AbortError") throw e;
    return [];
  }

  // merge in source order — restaurants, then USDA labels, then Open Food
  // Facts — de-duped by name+calories
  const seen = new Set();
  const merged = [];
  for (const list of lists) {
    for (const f of list) {
      const k = `${f.name.toLowerCase()}|${f.cal}`;
      if (!seen.has(k)) { seen.add(k); merged.push(f); }
    }
  }
  return merged;
}

export async function lookupBarcode(code, signal) {
  const res = await fetch(`${OFF_BARCODE}/${encodeURIComponent(code)}.json`, { signal });
  if (!res.ok) throw new Error("lookup failed");
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return normalizeOFF(data.product);
}
