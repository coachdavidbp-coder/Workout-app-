// =========================================================
// The Coach — an honest, pushing voice (Tempo-style) that
// reacts to what you actually logged. Pure rules, no network.
// Returns { tone: "push"|"good"|"neutral", title, body }.
// =========================================================
import { daysOf, trainingCount } from "../data/plans.js";
import { targetsFor } from "../data/plan.js";

function weekDoneCount(state, week) {
  return daysOf(state).filter((d) => d.type !== "rest" && state.done[`w${week}-${d.id}`]).length;
}

// Most recent weight logged for an exercise in a week BEFORE `week`.
function prevWeight(state, dayId, exName, week) {
  for (let w = week - 1; w >= 1; w--) {
    const wt = parseFloat(state.liftLogs[`w${w}-${dayId}`]?.exercises?.[exName]?.weight);
    if (wt) return wt;
  }
  return null;
}

// dispatcher used by the Train screen
export function trainingCoach(state, ctx) {
  if (ctx.day.type === "rest") return restCoach(state, ctx);
  if (ctx.day.type === "cardio") return runCoach(state, ctx);
  return strengthCoach(state, ctx);
}

function restCoach(state, { week }) {
  const weekDone = weekDoneCount(state, week);
  if (weekDone >= 5)
    return {
      tone: "good",
      name: "Coach",
      title: "Recovery is a weapon.",
      body: `${weekDone}/${trainingCount(state)} banked this week. Rest hard, eat your protein, come back ready.`,
    };
  if (weekDone <= 2)
    return {
      tone: "push",
      name: "Coach",
      title: "Rest — don't get comfortable.",
      body: `Only ${weekDone} sessions this week. Saturday's for recovery, not excuses. Next week you settle the score.`,
    };
  return {
    tone: "neutral",
    name: "Coach",
    title: "Earn tomorrow.",
    body: "Legs up, water in, stretch it out. The work you put in grows on days like this.",
  };
}

// ---------------- strength coach ----------------
export function strengthCoach(state, { week, dayId, day, todayId }) {
  const key = `w${week}-${dayId}`;
  const done = !!state.done[key];
  const isToday = dayId === todayId;
  const log = state.liftLogs[key] || {};
  const feel = log.feel;
  const NAME = "Strength Coach";

  if (!done) {
    return isToday
      ? { tone: "push", name: NAME, title: "This one's not optional.", body: `${day.name}. Nobody's lifting it for you — get the first set in.` }
      : { tone: "neutral", name: NAME, title: "Still open.", body: `${day.name} isn't logged. Knock it out or log what you did.` };
  }

  const exLogs = log.exercises || {};
  const hasWeights = Object.values(exLogs).some((e) => e && e.weight);
  if (!hasWeights)
    return { tone: "push", name: NAME, title: "Log the numbers.", body: "Marked done but no weights in. We beat numbers, not vibes — tap each lift and enter what you moved." };

  // progress vs previous weeks on this same day
  let up = 0, downOrSame = 0, upExample = null;
  for (const ex of day.exercises) {
    const now = parseFloat(exLogs[ex.name]?.weight);
    if (!now) continue;
    const prev = prevWeight(state, dayId, ex.name, week);
    if (prev == null) continue;
    if (now > prev) { up++; if (!upExample) upExample = `${ex.name} ${prev}→${now} lb`; }
    else downOrSame++;
  }

  if (up > 0)
    return { tone: "good", name: NAME, title: `You're getting stronger.`, body: `${up} lift${up > 1 ? "s" : ""} up on last time${upExample ? ` — ${upExample}` : ""}. That's the whole point. Keep climbing.` };
  if (feel >= 4)
    return { tone: "push", name: NAME, title: "Felt strong? Too light.", body: "Great energy — now the standard goes up. Next session add weight or slow the negative." };
  if (feel && feel <= 2)
    return { tone: "good", name: NAME, title: "That was ugly. Good.", body: "You finished a session you wanted to quit. Protein and sleep tonight — you earned it." };
  if (downOrSame > 0)
    return { tone: "neutral", name: NAME, title: "Held the line.", body: "Same weights as last time. Next session, pick one lift and add 5 lb or a rep. Small wins compound." };
  return { tone: "good", name: NAME, title: "Banked.", body: "Solid session logged. Next time, one more rep or five more pounds." };
}

// ---------------- running coach ----------------
export function runCoach(state, { week, dayId, day, todayId }) {
  const key = `w${week}-${dayId}`;
  const done = !!state.done[key];
  const isToday = dayId === todayId;
  const runLog = state.runLogs[key] || {};
  const NAME = "Running Coach";

  if (!done) {
    return isToday
      ? { tone: "push", name: NAME, title: "Time to run.", body: `${day.name}. Fire up the interval timer and hit every rep — no coasting on the walk breaks.` }
      : { tone: "neutral", name: NAME, title: "Still open.", body: `${day.name} isn't logged. Get it in and log your speeds.` };
  }

  const speeds = (runLog.intervals || []).map((i) => parseFloat(i.mph)).filter((n) => !isNaN(n));
  const sessions = [...(state.runSessions || [])].sort((a, b) => a.date.localeCompare(b.date));
  const loggedAnything = speeds.length > 0 || sessions.length > 0;

  if (!loggedAnything)
    return { tone: "push", name: NAME, title: "Log your speeds.", body: "Session's done but empty. Put your mph (or mile time) in — if we don't track it, we can't beat it." };

  // faster than before?
  if (sessions.length >= 2) {
    const prev = sessions[sessions.length - 2];
    const last = sessions[sessions.length - 1];
    if (prev.topMph && last.topMph && parseFloat(last.topMph) > parseFloat(prev.topMph))
      return { tone: "good", name: NAME, title: "You're running faster.", body: `Top speed ${prev.topMph}→${last.topMph} mph vs last run. Speed is a skill — you're building it.` };
    if (prev.distanceMi && last.distanceMi && prev.durationSec && last.durationSec) {
      const pPrev = prev.durationSec / prev.distanceMi, pLast = last.durationSec / last.distanceMi;
      if (pLast < pPrev)
        return { tone: "good", name: NAME, title: "Pace is dropping.", body: "You covered the same ground quicker than last time. That's real progress — keep the intervals honest." };
    }
  }

  if (speeds.length)
    return { tone: "push", name: NAME, title: "Logged. Now beat it.", body: `Top sprint ${Math.max(...speeds).toFixed(1)} mph today. Next run, one interval goes faster. That's the standard.` };
  return { tone: "good", name: NAME, title: "In the books.", body: "Run logged. Consistency first, speed follows. Same time next week — a little faster." };
}

// ---------------- nutrition coach ----------------
export function nutritionCoach(state, { dateKey, isToday }) {
  const meals = state.meals[dateKey] || { items: [], water: 0 };
  const totals = meals.items.reduce(
    (a, it) => ({ cal: a.cal + (it.cal || 0), p: a.p + (it.p || 0) }),
    { cal: 0, p: 0 }
  );
  const water = meals.water || 0;
  const T = targetsFor(state.profile);
  const gp = T.protein;
  const gw = T.waterOz;
  const shortP = gp - totals.p;

  if (meals.items.length === 0)
    return {
      tone: isToday ? "push" : "neutral",
      title: isToday ? "Empty plate, empty tank." : "Nothing logged here.",
      body: isToday
        ? "On a GLP-1 the appetite hides — that's exactly when you have to be intentional. Start with protein and build from there."
        : "No food tracked for this day. Log it so we can see the real picture.",
    };

  if (shortP > 15)
    return {
      tone: "push",
      title: `You're ${Math.round(shortP)}g short on protein.`,
      body: "That's muscle you're leaving on the table while the scale drops. Lean meat or a shake before the day's out — no negotiation.",
    };

  if (shortP > 0)
    return {
      tone: "good",
      title: "Protein's right there.",
      body: `Only ${Math.round(shortP)}g to go — one shake and you've got it. Don't leave it on the table this close to the line.`,
    };

  // protein hit
  if (water < gw * 0.5)
    return {
      tone: "push",
      title: "Protein's handled — now drink.",
      body: `${Math.round(totals.p)}g protein, that's the number. But you're at ${water}oz water. Dehydrated muscles don't perform. Fill the bottle.`,
    };

  if (totals.cal < 1000)
    return {
      tone: "neutral",
      title: "Protein good — watch the deficit.",
      body: "You hit protein but calories are very low. A big deficit on a GLP-1 drains your training. Don't undereat — add quality calories.",
    };

  return {
    tone: "good",
    title: "That's a championship day.",
    body: `${Math.round(totals.p)}g protein, ${water}oz water. This is exactly how you keep muscle while the weight comes off. Repeat it tomorrow.`,
  };
}

// ---------------- fatigue / deload check ----------------
// Looks for the honest signals that you're digging a hole: sessions you
// marked missed, repeated low "how did that feel" scores, and finishing a
// full block. Returns null when there's nothing to say — the coach should
// stay quiet unless it has a reason.
export function fatigueCheck(state) {
  const today = new Date();
  const keys = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const missed7 = keys.slice(0, 7).filter((k) => state.missed?.[k]).length;
  const missed14 = keys.filter((k) => state.missed?.[k]).length;

  // most recent feel scores across all logged days
  const feels = Object.values(state.liftLogs || {})
    .map((l) => l?.feel)
    .filter((f) => typeof f === "number");
  const recentFeels = feels.slice(-4);
  const rough = recentFeels.filter((f) => f <= 2).length;

  const active7 = keys.slice(0, 7).filter((k) => (state.activityLog?.[k]?.workouts || 0) > 0).length;

  if (rough >= 3 && recentFeels.length >= 3) {
    return {
      tone: "push", kind: "deload",
      title: "Time to back off — on purpose.",
      body: "Three of your last four sessions felt rough. That's a body asking for a lighter week, not a weaker one. Cut the weight ~20% for a week, keep every session, then come back and hit numbers you couldn't touch before.",
    };
  }
  if (missed7 >= 3) {
    return {
      tone: "push", kind: "missed",
      title: `${missed7} sessions missed this week.`,
      body: "Life happens — but three is a pattern, not an accident. Pick the two you'll actually make next week and protect them. Two real sessions beat six planned ones.",
    };
  }
  if (missed14 >= 4 && missed7 <= 1) {
    return {
      tone: "good", kind: "recovering",
      title: "You're pulling it back.",
      body: "Rough couple of weeks, but this one's cleaner. That's the part most people never do — keep it going.",
    };
  }
  if (active7 >= 6) {
    return {
      tone: "push", kind: "highload",
      title: "Six days on. Watch the tank.",
      body: "Big week. Make the next rest day a real one — sleep, food, water — so this turns into muscle instead of a hole you have to climb out of.",
    };
  }
  return null;
}
