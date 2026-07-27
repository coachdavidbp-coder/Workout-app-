// =========================================================
// Progress math — "am I getting stronger / faster?"
// Derives strength trends from liftLogs (week-over-week) and
// running trends from runSessions (date timeline).
// =========================================================
import { daysOf, WEEKS } from "../data/plans.js";

const liftDaysOf = (state) => daysOf(state).filter((d) => d.type === "lift");

function sumReps(reps) {
  return (reps || []).reduce((a, r) => a + (parseFloat(r) || 0), 0);
}

// total training volume (weight × reps) per week across all lifts
export function weeklyStrength(state) {
  return WEEKS.map((w) => {
    let volume = 0;
    let sets = 0;
    for (const day of liftDaysOf(state)) {
      const ex = state.liftLogs[`w${w}-${day.id}`]?.exercises || {};
      for (const name in ex) {
        const wt = parseFloat(ex[name].weight) || 0;
        const reps = sumReps(ex[name].reps);
        if (wt && reps) {
          volume += wt * reps;
          sets += (ex[name].reps || []).filter((r) => r).length;
        }
      }
    }
    return { week: w, volume: Math.round(volume), sets };
  });
}

// per-exercise best weight by week + delta first→last
export function liftProgress(state) {
  const out = [];
  for (const day of liftDaysOf(state)) {
    for (const ex of day.exercises) {
      const byWeek = {};
      for (const w of WEEKS) {
        const wt = parseFloat(state.liftLogs[`w${w}-${day.id}`]?.exercises?.[ex.name]?.weight);
        if (wt) byWeek[w] = wt;
      }
      const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);
      if (!weeks.length) continue;
      const first = byWeek[weeks[0]];
      const last = byWeek[weeks[weeks.length - 1]];
      out.push({ name: ex.name, byWeek, first, last, delta: last - first, weeksLogged: weeks.length });
    }
  }
  // most-improved first, then heaviest
  return out.sort((a, b) => b.delta - a.delta || b.last - a.last);
}

export function strengthSummary(state) {
  const wk = weeklyStrength(state).filter((w) => w.volume > 0);
  const lifts = liftProgress(state);
  const improved = lifts.filter((l) => l.delta > 0).length;
  const volFirst = wk.length ? wk[0].volume : 0;
  const volLast = wk.length ? wk[wk.length - 1].volume : 0;
  return {
    weekly: weeklyStrength(state),
    lifts,
    improved,
    logged: lifts.length,
    volumeDelta: volLast - volFirst,
    hasData: wk.length > 0,
  };
}

// ---------------- running ----------------
export function paceOf(session) {
  if (!session.distanceMi || !session.durationSec) return null;
  return session.durationSec / 60 / session.distanceMi; // min per mile
}

export function runTrend(state) {
  return [...(state.runSessions || [])]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({ ...s, pace: paceOf(s) }));
}

export function runningSummary(state) {
  const runs = runTrend(state);
  const withPace = runs.filter((r) => r.pace != null);
  const totalDistance = runs.reduce((a, r) => a + (parseFloat(r.distanceMi) || 0), 0);
  const topSpeed = runs.reduce((a, r) => Math.max(a, parseFloat(r.topMph) || 0), 0);
  const bestPace = withPace.length ? Math.min(...withPace.map((r) => r.pace)) : null;
  let faster = null;
  if (withPace.length >= 2) faster = withPace[0].pace - withPace[withPace.length - 1].pace; // + = faster now
  return { runs, withPace, totalDistance, topSpeed, bestPace, faster, hasData: runs.length > 0 };
}

// ---------------- personal bests ----------------
export function personalBests(state) {
  const lifts = liftProgress(state);
  const heaviest = lifts.length
    ? lifts.reduce((a, b) => (b.last > a.last ? b : a))
    : null;
  const rs = runningSummary(state);
  const longestRun = (state.runSessions || []).reduce((a, r) => Math.max(a, parseFloat(r.distanceMi) || 0), 0);
  const bestWeekVol = weeklyStrength(state).reduce((a, w) => Math.max(a, w.volume), 0);
  return {
    heaviest, // {name, last}
    topSpeed: rs.topSpeed || 0,
    bestPace: rs.bestPace,
    longestRun,
    bestWeekVol,
  };
}

// ---------------- weekly activity (calendar) ----------------
// last `n` weeks of completed workouts, oldest→newest.
export function weeklyActivity(state, n = 8) {
  const out = [];
  const base = new Date();
  base.setHours(12, 0, 0, 0);
  base.setDate(base.getDate() - base.getDay()); // this Sunday
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(base);
    start.setDate(base.getDate() - i * 7);
    let workouts = 0;
    for (let d = 0; d < 7; d++) {
      const day = new Date(start);
      day.setDate(start.getDate() + d);
      const key = ymd(day);
      workouts += state.activityLog?.[key]?.workouts || 0;
    }
    out.push({ label: `${start.getMonth() + 1}/${start.getDate()}`, value: workouts });
  }
  return out;
}

function ymd(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------------- formatting ----------------
export function fmtDuration(sec) {
  sec = Math.max(0, Math.round(sec || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function fmtPace(minPerMi) {
  if (minPerMi == null || !isFinite(minPerMi)) return "—";
  const m = Math.floor(minPerMi);
  const s = Math.round((minPerMi - m) * 60);
  return `${m}:${String(s).padStart(2, "0")}/mi`;
}
