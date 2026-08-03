import { useEffect, useMemo, useRef, useState } from "react";
import Sheet from "./Sheet.jsx";
import BarcodeScanner from "./BarcodeScanner.jsx";
import NumField from "./NumField.jsx";
import { IconSearch } from "./icons.jsx";
import { BUILTIN_FOODS, MEAL_SLOTS } from "../data/foods.js";
import { searchFoods, lookupBarcode, resolveRestaurantItem, restaurantsEnabled } from "../lib/foodApi.js";
import { useStore, todayKey } from "../store.jsx";
import { useOnline } from "../lib/net.js";
import { haptic } from "../lib/fx.js";

export default function AddFoodSheet({ open, onClose, dateKey }) {
  const { actions } = useStore();
  const online = useOnline();
  const [q, setQ] = useState("");
  const [slot, setSlot] = useState("Breakfast");
  const [selected, setSelected] = useState(null); // food being portioned
  const [qty, setQty] = useState("1");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [manual, setManual] = useState(null);   // { name, cal, p, unit } while typing one in
  const abortRef = useRef(null);

  // reset on open
  useEffect(() => {
    if (open) {
      setQ("");
      setSelected(null);
      setQty("1");
      setResults([]);
      setErr("");
      setBarcode("");
      setScanning(false);
      setManual(null);
    }
  }, [open]);

  const builtinMatches = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return BUILTIN_FOODS;
    return BUILTIN_FOODS.filter((f) => f.name.toLowerCase().includes(term));
  }, [q]);

  // debounced Open Food Facts search
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) {
      setResults([]);
      return;
    }
    setLoading(true);
    setErr("");
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const t = setTimeout(async () => {
      try {
        const r = await searchFoods(term, ctrl.signal);
        setResults(r);
      } catch (e) {
        if (e.name !== "AbortError") setErr("Search unavailable — check your connection.");
      } finally {
        setLoading(false);
      }
    }, 450);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const doBarcode = async (raw) => {
    const code = String(raw ?? barcode).trim();
    if (!code) return;
    setLoading(true);
    setErr("");
    try {
      const food = await lookupBarcode(code);
      if (food) { setSelected(food); setQty("1"); }
      else setErr(`No product found for ${code}. Try the search box — the database misses some store brands.`);
    } catch (e) {
      setErr("Barcode lookup failed — check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Restaurant results arrive with calories but no protein — the menu
  // database only returns full macros per item, so fetch them for the one
  // actually chosen rather than for every row in the list.
  const pick = async (food) => {
    setQty("1");
    setSelected(food);
    if (food.nixId && food.p == null) {
      setLoading(true);
      try { setSelected(await resolveRestaurantItem(food)); }
      finally { setLoading(false); }
    }
  };

  // Scanner hands back the digits; close the camera and look it up.
  const onScanned = (code) => {
    setScanning(false);
    setBarcode(code);
    doBarcode(code);
  };

  const confirmAdd = () => {
    const n = parseFloat(qty) || 1;
    actions.addMeal(dateKey, {
      name: selected.name,
      cal: Math.round(selected.cal * n),
      p: Math.round((selected.p || 0) * n * 10) / 10,
      qty: n,
      slot,
      unit: selected.unit,
    });
    onClose();
  };

  return (
    <>
    <BarcodeScanner open={scanning} onClose={() => setScanning(false)} onDetect={onScanned} />
    <Sheet open={open} onClose={onClose}>
      {manual ? (
        <>
          <h3 className="sheet-title">Enter it yourself</h3>
          <div className="sheet-sub">Straight off the menu board or the receipt</div>

          <div className="section-label" style={{ marginTop: 16 }}>What is it?</div>
          <input
            className="login-input"
            placeholder="e.g. Chicken Avocado Salad · El Pollo Loco"
            value={manual.name}
            onChange={(e) => setManual({ ...manual, name: e.target.value })}
            autoFocus
          />

          <div className="section-label" style={{ marginTop: 16 }}>Per serving</div>
          <div className="ex-log">
            <NumField
              label="Calories"
              accent
              value={manual.cal}
              placeholder="540"
              onCommit={(v) => setManual({ ...manual, cal: v })}
            />
            <NumField
              label="Protein (g)"
              value={manual.p}
              placeholder="42"
              onCommit={(v) => setManual({ ...manual, p: v })}
            />
          </div>

          <div className="section-label" style={{ marginTop: 16 }}>Serving name</div>
          <input
            className="login-input"
            placeholder="1 serving"
            value={manual.unit}
            onChange={(e) => setManual({ ...manual, unit: e.target.value })}
          />

          <div className="row gap-2" style={{ marginTop: 20 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setManual(null)}>
              Back
            </button>
            <button
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={!manual.name.trim() || !(parseFloat(manual.cal) > 0)}
              onClick={() => {
                setSelected({
                  name: manual.name.trim().slice(0, 72),
                  cal: Math.round(parseFloat(manual.cal) || 0),
                  p: Math.round((parseFloat(manual.p) || 0) * 10) / 10,
                  unit: manual.unit.trim() || "1 serving",
                });
                setQty("1");
                setManual(null);
              }}
            >
              Continue
            </button>
          </div>
          <div className="ss-note">
            Chains print calories on the board and full macros on their website.
          </div>
        </>
      ) : !selected ? (
        <>
          <div className="food-search-head">
            <h3 className="sheet-title">Add Food</h3>
            <div className="sheet-sub">Built-in foods + full database search</div>

            <div className="row gap-2" style={{ marginTop: 12, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "4px 12px" }}>
              <span style={{ color: "var(--mu)" }}>
                <IconSearch width="18" height="18" />
              </span>
              <input
                className="login-input"
                style={{ border: "none", background: "transparent", padding: "12px 6px" }}
                placeholder="Search food (e.g. chicken, yogurt)…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                autoFocus
              />
              {q && (
                <button className="food-clear" onClick={() => setQ("")} aria-label="Clear search">×</button>
              )}
            </div>

            {/* barcode — camera first, typing as the backup */}
            <button className="scan-cta" onClick={() => { haptic(); setErr(""); setScanning(true); }}>
              <span className="sc-ico">▣</span>
              <span className="sc-txt">
                <b>Scan a barcode</b>
                <em>Point the camera at the package</em>
              </span>
              <span className="sc-caret">›</span>
            </button>
            <div className="row gap-2" style={{ marginTop: 8 }}>
              <input
                className="login-input"
                inputMode="numeric"
                placeholder="…or type the barcode number"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
              <button className="btn" onClick={() => doBarcode()}>
                Look up
              </button>
            </div>

            {!online && (
              <p className="offline-note">📴 Offline — the built-in foods below still work. Search and barcode lookup need a signal (the camera will read the code, but there's nothing to match it against).</p>
            )}
            {err && <p className="login-err" style={{ marginTop: 10 }}>{err}</p>}
          </div>

          <div className="section-label" style={{ marginTop: 16 }}>
            {q.trim().length >= 3 ? "Database results" : "Common foods"}
          </div>
          <div className="meal-list">
            {builtinMatches.map((f) => (
              <FoodResult key={f.id} food={f} onPick={() => pick(f)} />
            ))}
            {loading && <div className="empty-hint">Searching…</div>}
            {results.map((f, i) => (
              <FoodResult key={`db-${i}`} food={f} onPick={() => pick(f)} />
            ))}
            {!loading && q.trim().length >= 3 && results.length === 0 && builtinMatches.length === 0 && (
              <div className="empty-hint">
                Nothing found for “{q.trim()}”.
                {!restaurantsEnabled && (
                  <span className="eh-note">
                    Restaurant menus (El Pollo Loco, Subway, Chipotle) need the free
                    Nutritionix key — the grocery databases don’t carry food served
                    over a counter.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Always available, needs no database: type it off the receipt or
              the wall menu and it logs like anything else. */}
          <button
            className="manual-cta"
            onClick={() => { haptic(); setManual({ name: q.trim(), cal: "", p: "", unit: "1 serving" }); }}
          >
            <span className="mc-ico">✎</span>
            <span className="mc-txt">
              <b>Can’t find it? Enter it yourself</b>
              <em>Type the calories and protein straight off the menu board</em>
            </span>
          </button>
        </>
      ) : (
        <>
          <h3 className="sheet-title">{selected.name}</h3>
          <div className="sheet-sub">Per {selected.unit}</div>

          <div className="mini-stats" style={{ marginTop: 16 }}>
            <div className="mini-stat">
              <div className="k">{Math.round(selected.cal * (parseFloat(qty) || 1))}</div>
              <div className="l">Calories</div>
            </div>
            <div className="mini-stat">
              <div className="k" style={{ color: "var(--good)" }}>
                {Math.round((selected.p || 0) * (parseFloat(qty) || 1) * 10) / 10}g
              </div>
              <div className="l">Protein</div>
            </div>
          </div>

          <div className="section-label" style={{ marginTop: 18 }}>
            How many servings?
          </div>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {["0.5", "1", "1.5", "2", "3"].map((v) => (
              <button
                key={v}
                className={`week-pill ${qty === v ? "on" : ""}`}
                onClick={() => setQty(v)}
              >
                {v}×
              </button>
            ))}
            <input
              className="login-input"
              style={{ width: 70, textAlign: "center" }}
              inputMode="decimal"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </div>

          <div className="section-label" style={{ marginTop: 18 }}>
            Meal
          </div>
          <div className="row gap-2" style={{ flexWrap: "wrap" }}>
            {MEAL_SLOTS.map((s) => (
              <button
                key={s}
                className={`week-pill ${slot === s ? "on" : ""}`}
                onClick={() => setSlot(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="row gap-2" style={{ marginTop: 20 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setSelected(null)}>
              Back
            </button>
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={confirmAdd}>
              Add to {slot}
            </button>
          </div>
        </>
      )}
    </Sheet>
    </>
  );
}

function FoodResult({ food, onPick }) {
  return (
    <button
      className="meal-row"
      style={{ width: "100%", background: "none", border: "none", textAlign: "left", cursor: "pointer" }}
      onClick={onPick}
    >
      <div className="info">
        <div className="fn">{food.name}</div>
        <div className="fp">
          {food.unit}
          {food.external ? " · database" : ""}
        </div>
      </div>
      <div className="macros">
        <div className="cal">{food.cal}</div>
        <div className="pro">{food.p}g</div>
      </div>
    </button>
  );
}
