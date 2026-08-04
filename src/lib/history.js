// =========================================================
// What you did last time, and what to aim for this time.
//
// The logs were write-only: every week opened with an empty weight field, so
// you either remembered what you lifted or guessed. Everything here is a read
// over data already stored — nothing new gets tracked.
//
// Logs are keyed by week and day and then by the name you actually performed,
// so a swapped exercise carries its own history rather than inheriting the
// one it replaced.
// =========================================================

const DAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const cleanReps = (reps) =>
  (reps || []).map((r) => parseInt(r, 10)).filter((n) => Number.isFinite(n) && n > 0);

// Most recent logged performance of this exercise before the given week/day.
// Searches back across weeks, and within a week across earlier days, so a
// lift that appears twice a week still chains correctly.
export function lastPerformance(state, name, week, dayId) {
  if (!name) return null;
  const logs = state?.liftLogs || {};
  const fromDay = Math.max(0, DAY_IDS.indexOf(dayId));

  for (let w = week; w >= 1; w--) {
    const startDay = w === week ? fromDay - 1 : DAY_IDS.length - 1;
    for (let d = startDay; d >= 0; d--) {
      const entry = logs[`w${w}-${DAY_IDS[d]}`]?.exercises?.[name];
      if (!entry) continue;
      const weight = parseFloat(entry.weight);
      const reps = cleanReps(entry.reps);
      if (!Number.isFinite(weight) && reps.length === 0) continue;
      return {
        week: w,
        dayId: DAY_IDS[d],
        weight: Number.isFinite(weight) ? weight : null,
        reps,
        volume: Number.isFinite(weight) ? weight * reps.reduce((a, b) => a + b, 0) : 0,
      };
    }
  }
  return null;
}

// "4×10" → { sets: 4, reps: 10 }. Per-leg and "Max" targets have no single
// number to chase, so they come back with reps null.
export function parseTarget(target) {
  const t = String(target || "");
  const m = t.match(/^(\d+)\s*×\s*(\d+)/);
  if (!m) {
    const sets = parseInt(t, 10);
    return { sets: Number.isFinite(sets) ? sets : null, reps: null };
  }
  return { sets: parseInt(m[1], 10), reps: parseInt(m[2], 10) };
}

// What to do about it. Deliberately conservative: add weight only once every
// prescribed rep has been hit, because chasing load through missed reps is
// how a lower back gets aggravated.
export function nextTarget(last, target) {
  const { reps: want } = parseTarget(target);
  if (!last || last.weight == null || last.reps.length === 0) return null;

  const low = Math.min(...last.reps);
  const load = last.weight;

  if (want == null) {
    return { kind: "match", weight: load, text: `Match ${load} lb and beat your reps.` };
  }
  if (low >= want) {
    const bump = load >= 100 ? 10 : load >= 50 ? 5 : 2.5;
    return {
      kind: "up",
      weight: load + bump,
      text: `You hit every rep at ${load} lb. Go up to ${load + bump}.`,
    };
  }
  const gap = want - low;
  return {
    kind: "hold",
    weight: load,
    text:
      gap === 1
        ? `One rep short last time. Stay at ${load} lb and finish all ${want}.`
        : `Stay at ${load} lb until every set reaches ${want}.`,
  };
}

// "55 lb × 10/10/9"
export function summarise(last) {
  if (!last) return null;
  const w = last.weight != null ? `${last.weight} lb` : null;
  const r = last.reps.length ? last.reps.join("/") : null;
  if (w && r) return `${w} × ${r}`;
  return w || (r ? `${r} reps` : null);
}

// ---------------------------------------------------------
// Volume against bodyweight — the chart that matters on a cut.
// ---------------------------------------------------------

// Total weight moved in a week: every logged set, weight × reps.
export function weekVolume(state, week) {
  const logs = state?.liftLogs || {};
  let total = 0;
  for (const d of DAY_IDS) {
    const ex = logs[`w${week}-${d}`]?.exercises || {};
    for (const name in ex) {
      const wt = parseFloat(ex[name].weight);
      if (!Number.isFinite(wt)) continue;
      total += wt * cleanReps(ex[name].reps).reduce((a, b) => a + b, 0);
    }
  }
  return Math.round(total);
}

// Bodyweight nearest a date, so the two series line up week by week.
function weightNear(state, dateKey) {
  const ws = [...(state?.weights || [])]
    .filter((w) => w && w.date && Number.isFinite(parseFloat(w.weight)))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!ws.length) return null;
  let best = ws[0];
  for (const w of ws) if (w.date <= dateKey) best = w;
  return parseFloat(best.weight);
}

// One row per program week: what you moved, and what you weighed.
export function volumeVsBodyweight(state, weeks, dateForWeek) {
  const rows = [];
  for (let w = 1; w <= weeks; w++) {
    const vol = weekVolume(state, w);
    if (vol <= 0) continue;
    rows.push({ week: w, volume: vol, bodyweight: weightNear(state, dateForWeek(w)) });
  }
  return rows;
}

// The headline: are you holding strength while the scale drops?
export function cutVerdict(rows) {
  const withBw = rows.filter((r) => r.bodyweight != null);
  if (rows.length < 2) return null;
  const first = rows[0], last = rows[rows.length - 1];
  const volPct = first.volume > 0 ? ((last.volume - first.volume) / first.volume) * 100 : 0;
  const bwDelta =
    withBw.length >= 2 ? withBw[withBw.length - 1].bodyweight - withBw[0].bodyweight : null;
  return {
    volPct: Math.round(volPct),
    bwDelta: bwDelta == null ? null : Math.round(bwDelta * 10) / 10,
    winning: volPct >= -5 && bwDelta != null && bwDelta < 0,
  };
}
