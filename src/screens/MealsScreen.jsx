import { useState } from "react";
import { useStore, todayKey, weekDates } from "../store.jsx";
import { MEAL_TARGETS, MEAL_IDEAS, GROCERY, GLP1_NOTES } from "../data/plan.js";
import { MEAL_SLOTS } from "../data/foods.js";
import Ring from "../components/Ring.jsx";
import AddFoodSheet from "../components/AddFoodSheet.jsx";
import { IconChevron } from "../components/icons.jsx";
import BrandLogo from "../components/BrandLogo.jsx";
import CoachCard from "../components/CoachCard.jsx";
import SupplementsSection from "../components/SupplementsSection.jsx";
import { nutritionCoach } from "../lib/coach.js";

const WATER_ADDS = [
  { label: "Cup", oz: 8 },
  { label: "Bottle", oz: 16 },
  { label: "Big", oz: 24 },
];

function dayTotals(meals, key) {
  const d = meals[key] || { items: [], water: 0 };
  const t = d.items.reduce(
    (a, it) => ({ cal: a.cal + (it.cal || 0), p: a.p + (it.p || 0) }),
    { cal: 0, p: 0 }
  );
  return { ...t, water: d.water || 0, count: d.items.length };
}

export default function MealsScreen() {
  const { state, actions } = useStore();
  const today = todayKey();
  const [selected, setSelected] = useState(today);
  const [anchor, setAnchor] = useState(new Date());
  const [adding, setAdding] = useState(false);
  const [showRef, setShowRef] = useState(false);

  const week = weekDates(anchor);
  const totals = dayTotals(state.meals, selected);
  const water = totals.water;

  const day = state.meals[selected] || { items: [], water: 0 };
  const bySlot = MEAL_SLOTS.map((s) => ({
    slot: s,
    items: day.items.filter((i) => i.slot === s),
  })).filter((g) => g.items.length);

  // weekly summary
  const weekStats = week.map((d) => dayTotals(state.meals, d.key));
  const daysWithData = weekStats.filter((s) => s.count > 0);
  const avgCal = daysWithData.length
    ? Math.round(daysWithData.reduce((a, s) => a + s.cal, 0) / daysWithData.length)
    : 0;
  const avgP = daysWithData.length
    ? Math.round(daysWithData.reduce((a, s) => a + s.p, 0) / daysWithData.length)
    : 0;
  const daysHitP = weekStats.filter((s) => s.p >= MEAL_TARGETS.protein).length;

  const shiftWeek = (dir) => {
    const a = new Date(anchor);
    a.setDate(a.getDate() + dir * 7);
    setAnchor(a);
    // keep selection inside the viewed week
    setSelected(weekDates(a)[0].key);
  };

  const selDate = new Date(selected + "T12:00:00");
  const isToday = selected === today;

  return (
    <div className="scroll">
      <header className="train-head">
        <div className="brandrow">
          <BrandLogo height={24} />
          <span className="mode-badge">
            {isToday
              ? "Today"
              : selDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="h-title">
          <div className="kicker">GLP-1 · {MEAL_TARGETS.protein}g protein goal</div>
          <h1>Nutrition</h1>
        </div>

        {/* week strip */}
        <div className="week-nav">
          <button className="wk-arrow" onClick={() => shiftWeek(-1)} aria-label="Previous week">‹</button>
          <div className="week-strip">
            {week.map((d) => {
              const st = dayTotals(state.meals, d.key);
              const pct = Math.min(1, st.p / MEAL_TARGETS.protein);
              return (
                <button
                  key={d.key}
                  className={`wcell ${d.key === selected ? "on" : ""} ${d.key === today ? "istoday" : ""}`}
                  onClick={() => setSelected(d.key)}
                >
                  <span className="wl">{d.label}</span>
                  <span className="wn">{d.dom}</span>
                  <span className="wbar"><span style={{ width: `${pct * 100}%` }} /></span>
                </button>
              );
            })}
          </div>
          <button className="wk-arrow" onClick={() => shiftWeek(1)} aria-label="Next week">›</button>
        </div>
      </header>

      <main className="content">
        <CoachCard msg={{ name: "Nutrition Coach", ...nutritionCoach(state, { dateKey: selected, isToday }) }} />

        {/* weekly summary */}
        <div className="mini-stats">
          <div className="mini-stat">
            <div className="k">{avgP}g</div>
            <div className="l">Avg protein/day</div>
          </div>
          <div className="mini-stat">
            <div className="k">{avgCal || "—"}</div>
            <div className="l">Avg calories</div>
          </div>
          <div className="mini-stat">
            <div className="k" style={{ color: "var(--good)" }}>{daysHitP}/7</div>
            <div className="l">Protein goal days</div>
          </div>
        </div>

        {/* selected-day rings */}
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
          + Add Food {isToday ? "" : "to this day"}
        </button>

        {bySlot.length === 0 ? (
          <div className="card empty-hint">
            Nothing logged for {isToday ? "today" : "this day"}. Tap <b>Add Food</b> to
            search the database, scan a barcode, or pick a common food.
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
                    <button className="del" aria-label="Remove" onClick={() => actions.removeMeal(selected, it.ts)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* hydration tracker */}
        <div className="card hydration">
          <div className="spread">
            <div className="section-label" style={{ margin: 0 }}>💧 Hydration</div>
            <div className="hyd-count tnum">
              {water} <span>/ {MEAL_TARGETS.waterOz} oz</span>
            </div>
          </div>
          <div className="hyd-bar">
            <span style={{ width: `${Math.min(100, (water / MEAL_TARGETS.waterOz) * 100)}%` }} />
          </div>
          <div className="hyd-adds">
            {WATER_ADDS.map((w) => (
              <button key={w.label} className="hyd-chip" onClick={() => actions.setWater(selected, water + w.oz)}>
                <span className="ho">+{w.oz}</span>
                <span className="hln">{w.label}</span>
              </button>
            ))}
            <button className="hyd-chip undo" onClick={() => actions.setWater(selected, Math.max(0, water - 8))} aria-label="Undo 8 oz">
              −8
            </button>
          </div>
        </div>

        {/* supplements */}
        <SupplementsSection />

        {/* reference content */}
        <button className={`collapse-head ${showRef ? "open" : ""}`} onClick={() => setShowRef((v) => !v)}>
          Meal ideas & grocery list
          <span className="chev"><IconChevron width="18" height="18" /></span>
        </button>
        {showRef && (
          <div className="ref-list">
            {MEAL_IDEAS.map((sec) => (
              <div key={sec.title}>
                <div className="ref-cat">{sec.title}</div>
                <div className="card">
                  {sec.items.map((it) => (
                    <div className="ref-item" key={it}>{it}</div>
                  ))}
                </div>
              </div>
            ))}
            <div className="ref-cat">One-Trip Grocery List</div>
            <div className="card"><div className="ref-item">{GROCERY}</div></div>
            <div className="ref-cat">GLP-1 Training Notes</div>
            <div className="card">
              {GLP1_NOTES.map((n) => (
                <div className="ref-item" key={n}>{n}</div>
              ))}
            </div>
          </div>
        )}
      </main>

      <AddFoodSheet open={adding} onClose={() => setAdding(false)} dateKey={selected} />
    </div>
  );
}
