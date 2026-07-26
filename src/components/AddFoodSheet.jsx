import { useEffect, useMemo, useRef, useState } from "react";
import Sheet from "./Sheet.jsx";
import { IconSearch } from "./icons.jsx";
import { BUILTIN_FOODS, MEAL_SLOTS } from "../data/foods.js";
import { searchFoods, lookupBarcode } from "../lib/foodApi.js";
import { useStore, todayKey } from "../store.jsx";

export default function AddFoodSheet({ open, onClose, dateKey }) {
  const { actions } = useStore();
  const [q, setQ] = useState("");
  const [slot, setSlot] = useState("Breakfast");
  const [selected, setSelected] = useState(null); // food being portioned
  const [qty, setQty] = useState("1");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [barcode, setBarcode] = useState("");
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

  const doBarcode = async () => {
    const code = barcode.trim();
    if (!code) return;
    setLoading(true);
    setErr("");
    try {
      const food = await lookupBarcode(code);
      if (food) setSelected(food);
      else setErr("No product found for that barcode.");
    } catch (e) {
      setErr("Barcode lookup failed.");
    } finally {
      setLoading(false);
    }
  };

  const confirmAdd = () => {
    const n = parseFloat(qty) || 1;
    actions.addMeal(dateKey, {
      name: selected.name,
      cal: Math.round(selected.cal * n),
      p: Math.round(selected.p * n * 10) / 10,
      qty: n,
      slot,
      unit: selected.unit,
    });
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      {!selected ? (
        <>
          <h3 className="sheet-title">Add Food</h3>
          <div className="sheet-sub">Built-in foods + full database search</div>

          <div className="row gap-2" style={{ marginTop: 14, background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 12, padding: "4px 12px" }}>
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
          </div>

          {/* barcode */}
          <div className="row gap-2" style={{ marginTop: 10 }}>
            <input
              className="login-input"
              inputMode="numeric"
              placeholder="Barcode number"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
            />
            <button className="btn" onClick={doBarcode}>
              Look up
            </button>
          </div>

          {err && <p className="login-err" style={{ marginTop: 10 }}>{err}</p>}

          <div className="section-label" style={{ marginTop: 16 }}>
            {q.trim().length >= 3 ? "Database results" : "Common foods"}
          </div>
          <div className="meal-list">
            {builtinMatches.map((f) => (
              <FoodResult key={f.id} food={f} onPick={() => { setSelected(f); setQty("1"); }} />
            ))}
            {loading && <div className="empty-hint">Searching…</div>}
            {results.map((f, i) => (
              <FoodResult key={`off-${i}`} food={f} onPick={() => { setSelected(f); setQty("1"); }} />
            ))}
            {!loading && q.trim().length >= 3 && results.length === 0 && builtinMatches.length === 0 && (
              <div className="empty-hint">No matches. Try a simpler term.</div>
            )}
          </div>
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
                {Math.round(selected.p * (parseFloat(qty) || 1) * 10) / 10}g
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
