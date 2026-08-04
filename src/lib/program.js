// =========================================================
// Where you actually are in the program, and what you've missed.
//
// The week used to be whatever you last tapped, which meant the app didn't
// know what day of the plan it was on — it just showed you a week. This
// works it out from the date you started, so opening the app on a Thursday
// in week three lands on Thursday of week three.
//
// A training day that's in the past and was never logged counts as missed.
// That's derived rather than stored: skipping a day and never touching the
// app again should still register as a skipped day.
// =========================================================
import { daysOf, programWeeks } from "../data/plans.js";

const DAY_IDS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Local-noon dates throughout, so daylight saving can't shift a day.
const noon = (key) => new Date(`${key}T12:00:00`);
export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const addDays = (key, n) => {
  const d = noon(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
};
export const daysBetween = (aKey, bKey) =>
  Math.round((noon(bKey) - noon(aKey)) / 86400000);

// The day the program began. Persisted on the profile once it's known;
// otherwise inferred from the first thing ever logged, then today.
export function programStart(state) {
  const set = state?.profile?.programStart;
  if (set) return set;
  const logged = Object.keys(state?.activityLog || {}).sort();
  return logged[0] || dateKey();
}

// Plans run Sunday→Saturday, so week 1 is the calendar week the program
// started in. That makes the week roll over on Sunday, which is what a
// training week does.
function startSunday(state) {
  const s = programStart(state);
  return addDays(s, -noon(s).getDay());
}

export function programPosition(state, todayK = dateKey()) {
  const sun = startSunday(state);
  const total = programWeeks(state);
  const elapsed = Math.max(0, daysBetween(sun, todayK));
  const weekRaw = Math.floor(elapsed / 7) + 1;
  return {
    start: programStart(state),
    startSunday: sun,
    week: Math.min(total, Math.max(1, weekRaw)),
    weekRaw,
    totalWeeks: total,
    finished: weekRaw > total,
    dayId: DAY_IDS[noon(todayK).getDay()],
    dayNumber: elapsed + 1,
  };
}

// The calendar date a given program day falls on.
export function dateForProgramDay(state, week, dayId) {
  const offset = (week - 1) * 7 + Math.max(0, DAY_IDS.indexOf(dayId));
  return addDays(startSunday(state), offset);
}

// "rest" | "done" | "missed" | "today" | "upcoming"
export function dayStatus(state, week, day, todayK = dateKey()) {
  if (!day || day.type === "rest") return "rest";
  if (state?.done?.[`w${week}-${day.id}`]) return "done";
  const dk = dateForProgramDay(state, week, day.id);
  if (state?.missed?.[dk]) return "missed";
  const diff = daysBetween(dk, todayK);
  if (diff > 0) return "missed";     // it's been and gone, nothing logged
  if (diff === 0) return "today";
  return "upcoming";
}

// Tally across everything up to and including today.
export function programStats(state, todayK = dateKey()) {
  const pos = programPosition(state, todayK);
  const days = daysOf(state);
  let done = 0, missed = 0, remaining = 0, total = 0;
  const upTo = Math.min(pos.totalWeeks, Math.max(1, pos.weekRaw));
  for (let w = 1; w <= pos.totalWeeks; w++) {
    for (const d of days) {
      if (d.type === "rest") continue;
      total++;
      if (w > upTo) { remaining++; continue; }
      const st = dayStatus(state, w, d, todayK);
      if (st === "done") done++;
      else if (st === "missed") missed++;
      else remaining++;
    }
  }
  return { done, missed, remaining, total, week: pos.week, totalWeeks: pos.totalWeeks };
}
