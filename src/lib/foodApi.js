// =========================================================
// Open Food Facts lookups — free, no API key.
// Text search + barcode. Returns normalized { name, cal, p, unit }.
// =========================================================

const SEARCH_URL = "https://world.openfoodfacts.org/cgi/search.pl";
const BARCODE_URL = "https://world.openfoodfacts.org/api/v0/product";

function normalize(product) {
  const n = product.nutriments || {};
  // Prefer per-serving; fall back to per-100g.
  const perServing =
    n["energy-kcal_serving"] != null || n["proteins_serving"] != null;
  const cal = Math.round(
    (perServing ? n["energy-kcal_serving"] : n["energy-kcal_100g"]) || 0
  );
  const p =
    Math.round(
      ((perServing ? n["proteins_serving"] : n["proteins_100g"]) || 0) * 10
    ) / 10;
  const unit = perServing
    ? product.serving_size || "1 serving"
    : "100 g";
  const name =
    product.product_name ||
    product.generic_name ||
    product.brands ||
    "Food";
  return { name: name.slice(0, 60), cal, p, unit, external: true };
}

export async function searchFoods(query, signal) {
  const url = `${SEARCH_URL}?search_terms=${encodeURIComponent(
    query
  )}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,generic_name,brands,serving_size,nutriments`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("search failed");
  const data = await res.json();
  return (data.products || [])
    .map(normalize)
    .filter((f) => f.name && f.cal > 0);
}

export async function lookupBarcode(code, signal) {
  const res = await fetch(`${BARCODE_URL}/${encodeURIComponent(code)}.json`, {
    signal,
  });
  if (!res.ok) throw new Error("lookup failed");
  const data = await res.json();
  if (data.status !== 1 || !data.product) return null;
  return normalize(data.product);
}
