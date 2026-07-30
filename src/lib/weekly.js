// =========================================================
// Weekly report — a Sunday-style summary built only from
// date-keyed logs, so it lines up with real calendar weeks
// (program weeks are a separate idea and don't belong here).
// =========================================================
import { todayKey } from "../store.jsx";
import { targetsFor } from "../data/plan.js";

function noon(d) { const x = new Date(d); x.setHours(12, 0, 0, 0); return x; }

// offset 0 = the week containing today, -1 = last week.
export function weekRange(offset = 0) {
  const t = noon(new Date());
  const start = noon(t);
  start.setDate(t.getDate() - t.getDay() + offset * 7);
  const end = noon(start);
  end.setDate(start.getDate() + 6);
  return { start, end };
}

function daysOfWeek(offset) {
  const { start } = weekRange(offset);
  return Array.from({ length: 7 }, (_, i) => {
    const d = noon(start);
    d.setDate(start.getDate() + i);
    return todayKey(d);
  });
}

function tally(state, offset) {
  const keys = daysOfWeek(offset);
  const today = todayKey();
  const log = state.activityLog || {};
  const T = targetsFor(state.profile);

  let workouts = 0, minutes = 0, calories = 0, proteinDays = 0, activeDays = 0, missed = 0;
  for (const k of keys) {
    if (k > today) continue; // don't count days that haven't happened
    const a = log[k] || {};
    workouts += a.workouts || 0;
    minutes += a.minutes || 0;
    calories += a.calories || 0;
    if ((a.workouts || 0) || (a.minutes || 0)) activeDays++;
    const m = state.meals?.[k];
    if (m && (m.items || []).reduce((s, it) => s + (it.p || 0), 0) >= T.protein) proteinDays++;
    if (state.missed?.[k]) missed++;
  }

  const runs = (state.runSessions || []).filter((r) => keys.includes(r.date));
  const miles = runs.reduce((a, r) => a + (parseFloat(r.distanceMi) || 0), 0);

  const weights = (state.weights || []).filter((w) => keys.includes(w.date));
  const weighIns = weights.length;
  const weightDelta =
    weights.length >= 2 ? weights[weights.length - 1].weight - weights[0].weight : null;

  return { workouts, minutes, calories, miles, proteinDays, activeDays, missed, runs: runs.length, weighIns, weightDelta };
}

const delta = (now, prev) => (prev === 0 ? (now > 0 ? null : 0) : Math.round(((now - prev) / prev) * 100));

export function weeklyReport(state, offset = 0) {
  const cur = tally(state, offset);
  const prev = tally(state, offset - 1);
  const { start, end } = weekRange(offset);

  const rows = [
    { id: "workouts", label: "Workouts", value: cur.workouts, prev: prev.workouts, unit: "" },
    { id: "minutes", label: "Training time", value: cur.minutes, prev: prev.minutes, unit: "min" },
    { id: "calories", label: "Calories burned", value: Math.round(cur.calories), prev: Math.round(prev.calories), unit: "cal" },
    { id: "miles", label: "Distance", value: Math.round(cur.miles * 10) / 10, prev: Math.round(prev.miles * 10) / 10, unit: "mi" },
    { id: "protein", label: "Protein goal hit", value: cur.proteinDays, prev: prev.proteinDays, unit: "days" },
    { id: "active", label: "Active days", value: cur.activeDays, prev: prev.activeDays, unit: "of 7" },
  ].map((r) => ({ ...r, change: delta(r.value, r.prev) }));

  // headline: the biggest honest story of the week
  let headline;
  if (cur.activeDays === 0) headline = "Nothing logged this week. Fresh start tomorrow.";
  else if (cur.workouts > prev.workouts) headline = `${cur.workouts} workouts — up from ${prev.workouts} last week.`;
  else if (cur.workouts === prev.workouts && cur.workouts > 0) headline = `${cur.workouts} workouts, same as last week. Consistency is the point.`;
  else if (cur.miles > prev.miles && cur.miles > 0) headline = `${cur.miles.toFixed(1)} miles — your biggest running week in a fortnight.`;
  else headline = `${cur.workouts} workout${cur.workouts === 1 ? "" : "s"} in. Next week you settle the score.`;

  return { rows, cur, prev, headline, start, end, offset };
}
