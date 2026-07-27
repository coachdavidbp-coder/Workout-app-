// =========================================================
// Food lookups — free, no paid tiers.
//   • USDA FoodData Central (huge branded + restaurant/fast-food +
//     generic database; accurate label data). Needs a FREE api key
//     (VITE_USDA_KEY). Get one instantly at fdc.nal.usda.gov/api-key-signup.
//   • Open Food Facts — no key; great for packaged/Costco items and
//     barcodes. Used as fallback + for barcode scans.
// =========================================================

const USDA_KEY = import.meta.env.VITE_USDA_KEY || "";
const USDA_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";
const OFF_SEARCH = "https://world.openfoodfacts.org/cgi/search.pl";
const OFF_BARCODE = "https://world.openfoodfacts.org/api/v0/product";

export const usdaEnabled = Boolean(USDA_KEY);

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

// ---------- public ----------
// Query USDA and Open Food Facts in parallel and merge — if one source is
// down, blocked by CORS, or has no match, the other still returns results.
export async function searchFoods(query, signal) {
  const jobs = [];
  if (usdaEnabled) jobs.push(searchUSDA(query, signal).catch((e) => { if (e.name === "AbortError") throw e; return []; }));
  jobs.push(searchOFF(query, signal).catch((e) => { if (e.name === "AbortError") throw e; return []; }));

  let lists;
  try {
    lists = await Promise.all(jobs);
  } catch (e) {
    if (e.name === "AbortError") throw e;
    return [];
  }

  // merge, USDA first (label-accurate), de-duped by name+calories
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
