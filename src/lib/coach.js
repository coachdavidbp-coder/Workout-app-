// =========================================================
// The Coach — an honest, pushing voice (Tempo-style) that
// reacts to what you actually logged. Pure rules, no network.
// Returns { tone: "push"|"good"|"neutral", title, body }.
// =========================================================
import { DAYS, TRAINING_DAY_COUNT, MEAL_TARGETS } from "../data/plan.js";

function weekDoneCount(state, week) {
  return DAYS.filter((d) => d.type !== "rest" && state.done[`w${week}-${d.id}`]).length;
}

// ---------------- workout coach ----------------
export function workoutCoach(state, { week, dayId, day, todayId }) {
  const key = `w${week}-${dayId}`;
  const done = !!state.done[key];
  const isToday = dayId === todayId;
  const weekDone = weekDoneCount(state, week);
  const remaining = TRAINING_DAY_COUNT - weekDone;

  if (day.type === "rest") {
    if (weekDone >= 5)
      return {
        tone: "good",
        title: "Recovery is a weapon.",
        body: `${weekDone}/${TRAINING_DAY_COUNT} banked this week. Rest hard, eat your protein, and come back Sunday ready to hit it again.`,
      };
    if (weekDone <= 2)
      return {
        tone: "push",
        title: "Rest — don't get comfortable.",
        body: `Only ${weekDone} sessions in the books this week. Saturday's for recovery, not excuses. Next week you settle the score.`,
      };
    return {
      tone: "neutral",
      title: "Earn tomorrow.",
      body: "Legs up, water in, stretch it out. The work you put in this week grows on days like this.",
    };
  }

  const log = state.liftLogs[key] || {};
  const runLog = state.runLogs[key] || {};
  const feel = log.feel;

  if (!done) {
    if (isToday)
      return {
        tone: "push",
        title: "This one's not optional.",
        body: `${day.name} is on the board. Nobody's coming to do it for you — first set, right now. ${remaining} left this week.`,
      };
    return {
      tone: "neutral",
      title: "Still open.",
      body: `${day.name} hasn't been logged. Knock it out or log what you did — we don't leave sessions half-finished.`,
    };
  }

  // done — coach off how it felt + whether it was logged
  const hasWeights =
    day.type === "lift" &&
    Object.values(log.exercises || {}).some((e) => e && e.weight);
  const loggedRun = day.type === "cardio" && (runLog.intervals || []).length > 0;

  if (feel && feel <= 2)
    return {
      tone: "good",
      title: "That was ugly. Good.",
      body: "You finished a session you wanted to quit — that's the whole game. Protein and sleep tonight, you earned it.",
    };
  if (feel >= 4)
    return {
      tone: "push",
      title: "Felt strong? Then it was too light.",
      body: "Love the energy — now the standard goes up. Next time add weight or slow the negative. We don't coast.",
    };
  if (day.type === "lift" && !hasWeights)
    return {
      tone: "push",
      title: "Logged it — now log the numbers.",
      body: "Marked done but no weights in. We beat numbers, not vibes. Tap each lift and put in what you moved.",
    };
  if (day.type === "cardio" && !loggedRun)
    return {
      tone: "push",
      title: "Log your speeds.",
      body: "Session's done but the intervals are empty. Put your mph in — if we don't track it, we can't beat it.",
    };

  return {
    tone: "good",
    title: "Banked.",
    body: `Solid work. That's ${weekDone}/${TRAINING_DAY_COUNT} this week. Next time: one more rep or five more pounds.`,
  };
}

// ---------------- nutrition coach ----------------
export function nutritionCoach(state, { dateKey, isToday }) {
  const meals = state.meals[dateKey] || { items: [], water: 0 };
  const totals = meals.items.reduce(
    (a, it) => ({ cal: a.cal + (it.cal || 0), p: a.p + (it.p || 0) }),
    { cal: 0, p: 0 }
  );
  const water = meals.water || 0;
  const gp = MEAL_TARGETS.protein;
  const gw = MEAL_TARGETS.waterOz;
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
