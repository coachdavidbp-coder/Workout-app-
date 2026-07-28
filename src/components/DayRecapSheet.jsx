import Sheet from "./Sheet.jsx";
import { useStore, todayKey, currentDayId } from "../store.jsx";
import { daysOf, dayById } from "../data/plans.js";
import { targetsFor } from "../data/plan.js";
import { fmtDuration } from "../lib/progress.js";
import { streak, totalXP, levelInfo } from "../lib/gamify.js";

const DAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// End-of-day recap: what you trained (or didn't), how you ate, movement,
// streak, and tomorrow's preview.
export default function DayRecapSheet({ open, onClose }) {
  const { state } = useStore();
  const dateKey = todayKey();
  const week = state.week;
  const todayId = currentDayId();
  const day = dayById(state, todayId) || { type: "rest", name: "Rest" };
  const doneKey = `w${week}-${todayId}`;
  const workedOut = !!state.done[doneKey];
  const missed = !!state.missed?.[dateKey];
  const sessionSec = state.durations?.[doneKey] || 0;

  const meals = state.meals[dateKey] || { items: [], water: 0 };
  const totals = meals.items.reduce((a, it) => ({ cal: a.cal + (it.cal || 0), p: a.p + (it.p || 0) }), { cal: 0, p: 0 });
  const T = targetsFor(state.profile);
  const proteinHit = totals.p >= T.protein;
  const waterHit = (meals.water || 0) >= T.waterOz;

  const runsToday = (state.runSessions || []).filter((r) => r.date === dateKey);
  const act = state.activityLog?.[dateKey] || { calories: 0 };

  const s = streak(state);
  const lvl = levelInfo(totalXP(state));

  const tomorrow = dayById(state, DAY_IDS[(new Date().getDay() + 1) % 7]);

  // training status line
  let trainStatus, trainTone;
  if (day.type === "rest") { trainStatus = "Rest day — recovery is part of the plan."; trainTone = "neutral"; }
  else if (workedOut) { trainStatus = `✓ ${day.name} done${sessionSec ? ` · ${fmtDuration(sessionSec)}` : ""}`; trainTone = "good"; }
  else if (missed) { trainStatus = "No workout today — logged as rest. Back at it tomorrow."; trainTone = "warn"; }
  else { trainStatus = `${day.name} not logged yet.`; trainTone = "warn"; }

  // closing line
  const wins = [workedOut || day.type === "rest", proteinHit, waterHit].filter(Boolean).length;
  const closing = wins >= 3
    ? "Complete day. This is exactly how the work compounds — do it again tomorrow. 💪"
    : wins === 2
    ? "Solid day. Tighten up one thing tomorrow and you're dialed."
    : missed || (!workedOut && day.type !== "rest")
    ? "Off day happens. Don't stack two — tomorrow you settle the score."
    : "Every day on the board counts. Keep stacking.";

  const Row = ({ icon, label, value, tone }) => (
    <div className="recap-row">
      <span className="rr-ico">{icon}</span>
      <span className="rr-label">{label}</span>
      <span className={`rr-val ${tone || ""}`}>{value}</span>
    </div>
  );

  return (
    <Sheet open={open} onClose={onClose}>
      <h3 className="sheet-title">Today's recap</h3>
      <div className="sheet-sub">{new Date(dateKey + "T00:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div>

      <div className="recap-status" data-tone={trainTone}>{trainStatus}</div>

      <div className="recap-list">
        <Row icon="🍽️" label="Calories" value={`${Math.round(totals.cal)}${T.calories ? ` / ${T.calories}` : ""}`} />
        <Row icon="🥩" label="Protein" value={`${Math.round(totals.p)}g / ${T.protein}g`} tone={proteinHit ? "good" : "warn"} />
        <Row icon="💧" label="Water" value={`${meals.water || 0} / ${T.waterOz} oz`} tone={waterHit ? "good" : "warn"} />
        {runsToday.length > 0 && (
          <Row icon="🏃" label="Movement" value={`${runsToday.reduce((a, r) => a + (parseFloat(r.distanceMi) || 0), 0).toFixed(1)} mi`} tone="good" />
        )}
        {act.calories > 0 && <Row icon="🔥" label="Active burn" value={`~${act.calories} cal`} />}
        <Row icon="🔥" label="Streak" value={`${s.current} day${s.current === 1 ? "" : "s"}`} />
        <Row icon="⭐" label="Level" value={`${lvl.level} · ${lvl.title}`} />
      </div>

      {tomorrow && (
        <div className="recap-tomorrow">
          <span>Tomorrow</span>
          <b>{tomorrow.type === "rest" ? "🛌 Rest day" : `${tomorrow.name}`}</b>
        </div>
      )}

      <p className="recap-closing">{closing}</p>

      <button className="btn btn-primary btn-block" style={{ marginTop: 8 }} onClick={onClose}>Close</button>
    </Sheet>
  );
}
