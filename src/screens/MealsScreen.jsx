import { useState } from "react";
import { useStore, todayKey } from "../store.jsx";
import {
  MEAL_TARGETS,
  MEAL_IDEAS,
  GROCERY,
  GLP1_NOTES,
} from "../data/plan.js";
import { MEAL_SLOTS } from "../data/foods.js";
import Ring from "../components/Ring.jsx";
import AddFoodSheet from "../components/AddFoodSheet.jsx";
import { IconChevron } from "../components/icons.jsx";
import BrandLogo from "../components/BrandLogo.jsx";

export default function MealsScreen() {
  const { state, actions } = useStore();
  const dateKey = todayKey();
  const [adding, setAdding] = useState(false);
  const [showRef, setShowRef] = useState(false);

  const day = state.meals[dateKey] || { items: [], water: 0 };
  const totals = day.items.reduce(
    (a, it) => ({ cal: a.cal + (it.cal || 0), p: a.p + (it.p || 0) }),
    { cal: 0, p: 0 }
  );
  const water = day.water || 0;

  const bySlot = MEAL_SLOTS.map((s) => ({
    slot: s,
    items: day.items.filter((i) => i.slot === s),
  })).filter((g) => g.items.length);

  return (
    <div className="scroll">
      <header className="train-head">
        <div className="brandrow">
          <BrandLogo height={24} />
          <span className="mode-badge">
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="h-title">
          <div className="kicker">GLP-1 · {MEAL_TARGETS.protein}g protein goal</div>
          <h1>Today's Meals</h1>
        </div>
      </header>

      <main className="content">
        <div className="rings">
          <div className="ring-card">
            <div className="rlab">Calories</div>
            <Ring value={totals.cal} max={MEAL_TARGETS.calories} center={totals.cal} unit={`/${MEAL_TARGETS.calories}`} />
          </div>
          <div className="ring-card">
            <div className="rlab">Protein</div>
            <Ring value={totals.p} max={MEAL_TARGETS.protein} color="var(--good)" center={`${Math.round(totals.p)}g`} unit={`/${MEAL_TARGETS.protein}`} />
          </div>
          <div className="ring-card">
            <div className="rlab">Water</div>
            <Ring value={water} max={MEAL_TARGETS.waterOz} color="var(--teal)" center={water} unit={`/${MEAL_TARGETS.waterOz}oz`} />
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={() => setAdding(true)}>
          + Add Food
        </button>

        {bySlot.length === 0 ? (
          <div className="card empty-hint">
            Nothing logged yet today. Tap <b>Add Food</b> to search the database, scan a barcode, or pick a common food.
          </div>
        ) : (
          <div className="meal-list">
            {bySlot.map((g) => (
              <div key={g.slot}>
                <div className="slot-head">{g.slot}</div>
                {g.items.map((it) => (
                  <div className="meal-row" key={it.ts}>
                    <div className="info">
                      <div className="fn">{it.name}</div>
                      <div className="fp">
                        {it.qty && it.qty !== 1 ? `${it.qty}× ` : ""}
                        {it.unit || "serving"}
                      </div>
                    </div>
                    <div className="macros">
                      <div className="cal">{it.cal}</div>
                      <div className="pro">{it.p}g</div>
                    </div>
                    <button className="del" aria-label="Remove" onClick={() => actions.removeMeal(dateKey, it.ts)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* water */}
        <div className="card" style={{ padding: 14 }}>
          <div className="section-label" style={{ margin: "0 0 10px" }}>
            Water
          </div>
          <div className="water-row">
            <button className="water-btn" onClick={() => actions.setWater(dateKey, water - 8)}>
              −
            </button>
            <div className="water-val">
              <span className="n tnum">{water}</span> <span className="u">/ {MEAL_TARGETS.waterOz} oz</span>
            </div>
            <button className="water-btn" onClick={() => actions.setWater(dateKey, water + 8)}>
              +
            </button>
          </div>
        </div>

        {/* reference content */}
        <button className={`collapse-head ${showRef ? "open" : ""}`} onClick={() => setShowRef((v) => !v)}>
          Meal ideas & grocery list
          <span className="chev">
            <IconChevron width="18" height="18" />
          </span>
        </button>
        {showRef && (
          <div className="ref-list">
            {MEAL_IDEAS.map((sec) => (
              <div key={sec.title}>
                <div className="ref-cat">{sec.title}</div>
                <div className="card">
                  {sec.items.map((it) => (
                    <div className="ref-item" key={it}>
                      {it}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="ref-cat">One-Trip Grocery List</div>
            <div className="card">
              <div className="ref-item">{GROCERY}</div>
            </div>
            <div className="ref-cat">GLP-1 Training Notes</div>
            <div className="card">
              {GLP1_NOTES.map((n) => (
                <div className="ref-item" key={n}>
                  {n}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <AddFoodSheet open={adding} onClose={() => setAdding(false)} dateKey={dateKey} />
    </div>
  );
}
