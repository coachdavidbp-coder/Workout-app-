// =========================================================
// Does the calorie target match what the scale is actually doing?
//
// The goal was a number you set once and never revisited, so it could be
// wrong for weeks without anything noticing. This reads the weigh-in trend
// and says whether to hold, eat more, or eat less.
//
// Rate of loss is fitted by least squares rather than measured first-to-last,
// so a single dehydrated morning can't swing the verdict.
// =========================================================

const KCAL_PER_LB = 3500;

// Least-squares slope in lb per day, from [{date, weight}].
function slopePerDay(points) {
  const n = points.length;
  if (n < 2) return null;
  const t0 = points[0].t;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (const p of points) {
    const x = (p.t - t0) / 86400000;
    sx += x; sy += p.w; sxx += x * x; sxy += x * p.w;
  }
  const denom = n * sxx - sx * sx;
  if (!denom) return null;
  return (n * sxy - sx * sy) / denom;
}

export function weightTrend(state, days = 28) {
  const cutoff = Date.now() - days * 86400000;
  const points = (state?.weights || [])
    .map((w) => ({ t: new Date(`${w.date}T12:00:00`).getTime(), w: parseFloat(w.weight) }))
    .filter((p) => Number.isFinite(p.t) && Number.isFinite(p.w) && p.t >= cutoff)
    .sort((a, b) => a.t - b.t);

  if (points.length < 3) return { ok: false, reason: "few", count: points.length };

  const spanDays = (points[points.length - 1].t - points[0].t) / 86400000;
  if (spanDays < 10) return { ok: false, reason: "short", count: points.length, spanDays };

  const perDay = slopePerDay(points);
  if (perDay == null) return { ok: false, reason: "few", count: points.length };

  return {
    ok: true,
    count: points.length,
    spanDays: Math.round(spanDays),
    perWeek: Math.round(perDay * 7 * 100) / 100,
    latest: points[points.length - 1].w,
  };
}

// The band we want to be inside, in lb/week. Half to one percent of
// bodyweight a week is the usual range for losing fat without shedding
// muscle alongside it; below that is slow enough to feel pointless, above it
// and the lean mass starts going too.
export function targetBand(state, bodyweightLb) {
  const goal = state?.profile?.goal || "lose";
  const bw = bodyweightLb || parseFloat(state?.profile?.startWeight) || 200;
  if (goal === "lose") {
    return { min: Math.round(bw * 0.005 * 10) / 10, max: Math.round(bw * 0.01 * 10) / 10 };
  }
  if (goal === "maintain") return { min: -0.4, max: 0.4 };
  // strength / faster — a slow gain is fine, a fast one isn't
  return { min: -0.6, max: 0.1 };
}

export function calorieAdvice(state) {
  const trend = weightTrend(state);
  const current = parseInt(state?.profile?.calorieGoal, 10) || 0;
  if (!trend.ok) {
    return {
      ok: false,
      reason: trend.reason,
      current,
      text:
        trend.reason === "short"
          ? "Keep weighing in — two weeks of data and this can tell you whether the target is right."
          : "Log a few more weigh-ins and this will start checking your target against the scale.",
    };
  }

  const band = targetBand(state, trend.latest);
  const goal = state?.profile?.goal || "lose";
  // Losing shows as a negative slope; talk about it as a positive rate.
  const rate = goal === "lose" ? -trend.perWeek : trend.perWeek;

  let verdict, delta, text;
  if (goal === "lose" && rate < 0) {
    verdict = "gaining";
    delta = -300;
    text = `The scale is up about ${Math.abs(rate).toFixed(1)} lb a week. Take 300 calories off and hold it for two weeks.`;
  } else if (rate > band.max) {
    verdict = "fast";
    const excess = rate - band.max;
    delta = Math.round((excess * KCAL_PER_LB) / 7 / 50) * 50;
    text = `Down ${rate.toFixed(1)} lb a week — quicker than the ${band.min}–${band.max} that keeps muscle on. Add ${delta} calories.`;
  } else if (rate < band.min) {
    verdict = "slow";
    const short = band.min - rate;
    delta = -Math.round((short * KCAL_PER_LB) / 7 / 50) * 50;
    text =
      rate <= 0.05
        ? `The scale hasn't moved in ${trend.spanDays} days. Drop ${Math.abs(delta)} calories.`
        : `Down ${rate.toFixed(1)} lb a week — slower than the ${band.min}–${band.max} you're after. Drop ${Math.abs(delta)} calories.`;
  } else {
    verdict = "good";
    delta = 0;
    text = `Down ${rate.toFixed(1)} lb a week, right in the ${band.min}–${band.max} band. Leave the target where it is.`;
  }

  // A hard floor so this can never talk someone into starving — not a
  // target. It has to sit well below any sane goal, or it clamps a
  // "drop 300" straight back up into "add 100".
  const floor = Math.max(1500, Math.round(trend.latest * 6));
  const suggested = current ? Math.max(floor, current + delta) : 0;
  const worthIt = current > 0 && Math.abs(suggested - current) >= 50;

  return {
    ok: true,
    verdict,
    rate: Math.round(rate * 10) / 10,
    band,
    spanDays: trend.spanDays,
    count: trend.count,
    current,
    suggested: worthIt ? suggested : current,
    canApply: worthIt,
    text,
  };
}
