// =========================================================
// Apple-Fitness-style activity rings.
//   Move     — calories burned      (daily goal: profile.moveGoal)
//   Exercise — minutes trained      (daily goal: profile.exerciseGoal)
//   Workouts — sessions completed   (goal scales from the plan's training days)
// Scopes: day | week | month | all. Week/month goals scale by days elapsed
// so the ring reflects being "on pace", not the whole period up front.
// For `all`, rings show how often you CLOSED each ring (consistency).
// =========================================================
import { todayKey } from "../store.jsx";
import { trainingCount } from "../data/plans.js";

export const RING_COLORS = {
  move: "#FF375F",
  exercise: "#6FE04A",
  train: "#4CD6FF",
};

export const SCOPES = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "all", label: "All" },
];

const clamp01 = (n) => (isFinite(n) ? Math.max(0, Math.min(1, n)) : 0);

function noon(d) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

function listDays(from, to) {
  const out = [];
  const d = noon(from);
  const end = noon(to);
  while (d <= end) {
    out.push(todayKey(d));
    d.setDate(d.getDate() + 1);
  }
  return out;
}

// Earliest date this account has any logged data for.
function firstLoggedDate(state) {
  const keys = [
    ...Object.keys(state.activityLog || {}),
    ...Object.keys(state.meals || {}),
    ...(state.weights || []).map((w) => w.date),
    ...(state.runSessions || []).map((r) => r.date),
  ].filter(Boolean).sort();
  return keys[0] || todayKey();
}

export function rangeFor(state, scope) {
  const today = noon(new Date());
  if (scope === "week") {
    const from = noon(today);
    from.setDate(from.getDate() - from.getDay()); // Sunday-first, matches the app
    return { from, to: today };
  }
  if (scope === "month") {
    const from = noon(new Date(today.getFullYear(), today.getMonth(), 1));
    return { from, to: today };
  }
  if (scope === "all") {
    return { from: noon(new Date(firstLoggedDate(state) + "T12:00")), to: today };
  }
  return { from: today, to: today };
}

export function activityRings(state, scope = "day") {
  const prof = state.profile || {};
  const gMove = Math.max(50, parseInt(prof.moveGoal, 10) || 600);
  const gEx = Math.max(5, parseInt(prof.exerciseGoal, 10) || 30);
  const perWeek = Math.max(1, trainingCount(state));
  const log = state.activityLog || {};

  const { from, to } = rangeFor(state, scope);
  const days = listDays(from, to);
  const n = Math.max(1, days.length);

  let move = 0, ex = 0, train = 0, activeDays = 0;
  const closed = { move: 0, exercise: 0, train: 0 };
  let bestMove = 0;

  for (const k of days) {
    const a = log[k] || {};
    const c = a.calories || 0;
    const m = a.minutes || 0;
    const w = a.workouts || 0;
    move += c; ex += m; train += w;
    if (c > bestMove) bestMove = c;
    if (c >= gMove) closed.move++;
    if (m >= gEx) closed.exercise++;
    if (w >= 1) closed.train++;
    if (c || m || w) activeDays++;
  }

  const paced = scope !== "all";
  const goals = paced
    ? { move: gMove * n, exercise: gEx * n, train: Math.max(1, Math.round((perWeek * n) / 7)) }
    : null;

  const ring = (id, label, unit, value, goal, closedCount) => ({
    id, label, unit, value, goal,
    color: RING_COLORS[id],
    pct: paced ? clamp01(value / goal) : clamp01(closedCount / n),
    closedDays: closedCount,
  });

  const rings = [
    ring("move", "Move", "CAL", Math.round(move), goals?.move, closed.move),
    ring("exercise", "Exercise", "MIN", Math.round(ex), goals?.exercise, closed.exercise),
    ring("train", "Workouts", "", train, goals?.train, closed.train),
  ];

  return {
    scope, days: n, activeDays, trackedFrom: days[0], closed, bestMove,
    dailyGoals: { move: gMove, exercise: gEx },
    allClosed: paced && rings.every((r) => r.pct >= 1),
    rings,
  };
}
