// =========================================================
// Gamification — XP, levels, streaks, badges, daily challenge,
// daily reward, calories. All derived from logged data (offline,
// free). No points are "spent"; everything recomputes from truth.
// =========================================================
import { daysOf, trainingCount } from "../data/plans.js";
import { targetsFor } from "../data/plan.js";
import { todayKey, currentDayId } from "../store.jsx";

// ---------- calories ----------
export function caloriesForSession(durationSec, type, weightLb = 290) {
  if (!durationSec) return 0;
  const met = type === "cardio" ? 8.5 : type === "lift" ? 5 : 4;
  const kg = weightLb / 2.20462;
  const min = durationSec / 60;
  return Math.round((met * 3.5 * kg) / 200 * min);
}

export function bodyweight(state) {
  const w = [...(state.weights || [])].sort((a, b) => a.date.localeCompare(b.date));
  return w.length ? w[w.length - 1].weight : state.profile?.startWeight || 290;
}

// ---------- active dates + streak ----------
function proteinDaysSet(state) {
  const set = new Set();
  const gp = targetsFor(state.profile).protein;
  for (const date in state.meals || {}) {
    const p = (state.meals[date].items || []).reduce((a, it) => a + (it.p || 0), 0);
    if (p >= gp) set.add(date);
  }
  return set;
}

export function activeDates(state) {
  const set = new Set();
  for (const d in state.activityLog || {}) if (state.activityLog[d].workouts > 0) set.add(d);
  for (const w of state.weights || []) set.add(w.date);
  for (const d of proteinDaysSet(state)) set.add(d);
  return set;
}

function dayOffset(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return todayKey(d);
}

export function streak(state) {
  const set = activeDates(state);
  // current streak: count back from today (or yesterday if today empty)
  let current = 0;
  let start = set.has(todayKey()) ? 0 : set.has(dayOffset(1)) ? 1 : -1;
  if (start >= 0) {
    let n = start;
    while (set.has(dayOffset(n))) { current++; n++; }
  }
  // best streak across all active dates
  const days = [...set].sort();
  let best = 0, run = 0, prev = null;
  for (const d of days) {
    if (prev) {
      const gap = (new Date(d) - new Date(prev)) / 86400000;
      run = gap === 1 ? run + 1 : 1;
    } else run = 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best };
}

// ---------- totals ----------
export function totals(state) {
  const workouts = Object.values(state.activityLog || {}).reduce((a, x) => a + (x.workouts || 0), 0);
  const calories = Object.values(state.activityLog || {}).reduce((a, x) => a + (x.calories || 0), 0);
  const proteinDays = proteinDaysSet(state).size;
  const weighIns = (state.weights || []).length;
  const runs = (state.runSessions || []).length;
  return { workouts, calories, proteinDays, weighIns, runs };
}

// ---------- XP + level ----------
export function totalXP(state) {
  const t = totals(state);
  const s = streak(state);
  return t.workouts * 50 + t.proteinDays * 25 + t.runs * 15 + t.weighIns * 5 + s.current * 10;
}

const TITLES = ["Walk-On", "Rookie", "Special Teams", "Starter", "Playmaker", "Captain", "All-Conference", "All-American", "Champion", "Legend"];

function levelStart(l) {
  // cumulative XP to reach level l (l>=1); req to advance from l = 100 + (l-1)*50
  let x = 0;
  for (let k = 1; k < l; k++) x += 100 + (k - 1) * 50;
  return x;
}

export function levelInfo(xp) {
  let l = 1;
  while (levelStart(l + 1) <= xp) l++;
  const start = levelStart(l);
  const span = 100 + (l - 1) * 50;
  const into = xp - start;
  return {
    level: l,
    into,
    span,
    pct: Math.min(1, into / span),
    title: TITLES[Math.min(l - 1, TITLES.length - 1)] + (l > TITLES.length ? ` ${l - TITLES.length + 1}` : ""),
    toNext: span - into,
  };
}

// ---------- badges ----------
export function badges(state) {
  const t = totals(state);
  const s = streak(state);
  const bw = bodyweight(state);
  const lost = (state.profile?.startWeight || bw) - bw;
  const topSpeed = (state.runSessions || []).reduce((a, r) => Math.max(a, parseFloat(r.topMph) || 0), 0);
  // week sweeps
  let sweeps = 0;
  for (let w = 1; w <= 4; w++) {
    const all = daysOf(state).filter((d) => d.type !== "rest").every((d) => state.done[`w${w}-${d.id}`]);
    if (all) sweeps++;
  }
  const list = [
    { id: "first", name: "First Rep", desc: "Complete a workout", emoji: "🏈", earned: t.workouts >= 1 },
    { id: "w5", name: "Warming Up", desc: "5 workouts", emoji: "🔥", earned: t.workouts >= 5 },
    { id: "w10", name: "Committed", desc: "10 workouts", emoji: "💪", earned: t.workouts >= 10 },
    { id: "w25", name: "Grinder", desc: "25 workouts", emoji: "⚙️", earned: t.workouts >= 25 },
    { id: "w50", name: "Relentless", desc: "50 workouts", emoji: "🦾", earned: t.workouts >= 50 },
    { id: "streak3", name: "Rolling", desc: "3-day streak", emoji: "📈", earned: s.best >= 3 },
    { id: "streak7", name: "Unbreakable", desc: "7-day streak", emoji: "⚡", earned: s.best >= 7 },
    { id: "streak14", name: "Obsessed", desc: "14-day streak", emoji: "🌟", earned: s.best >= 14 },
    { id: "protein", name: "Fueled", desc: "Hit protein goal", emoji: "🍗", earned: t.proteinDays >= 1 },
    { id: "run1", name: "On the Run", desc: "Log a run", emoji: "🏃", earned: t.runs >= 1 },
    { id: "speed", name: "Speed Demon", desc: "Hit 12+ mph", emoji: "💨", earned: topSpeed >= 12 },
    { id: "sweep", name: "Perfect Week", desc: "6/6 in a week", emoji: "🧹", earned: sweeps >= 1 },
    { id: "program", name: "Program Slayer", desc: "All 4 weeks done", emoji: "🏆", earned: sweeps >= 4 },
    { id: "lost10", name: "Down 10", desc: "Lose 10 lb", emoji: "⬇️", earned: lost >= 10 },
    { id: "lost25", name: "Down 25", desc: "Lose 25 lb", emoji: "🎯", earned: lost >= 25 },
  ];
  return list;
}

// ---------- unlockable profile icons ----------
export function profileIcons(state) {
  const lvl = levelInfo(totalXP(state)).level;
  const earnedBadges = new Set(badges(state).filter((b) => b.earned).map((b) => b.id));
  return [
    { id: "football", emoji: "🏈", name: "Gridiron", unlocked: true },
    { id: "flex", emoji: "💪", name: "Muscle", unlocked: lvl >= 3 },
    { id: "fire", emoji: "🔥", name: "On Fire", unlocked: earnedBadges.has("streak7") },
    { id: "bolt", emoji: "⚡", name: "Bolt", unlocked: lvl >= 5 },
    { id: "speed", emoji: "💨", name: "Burner", unlocked: earnedBadges.has("speed") },
    { id: "goat", emoji: "🐐", name: "GOAT", unlocked: lvl >= 8 },
    { id: "crown", emoji: "👑", name: "King", unlocked: lvl >= 10 },
    { id: "trophy", emoji: "🏆", name: "Champion", unlocked: earnedBadges.has("program") },
  ];
}

export function currentIcon(state) {
  const id = state.game?.profileIcon;
  const icons = profileIcons(state);
  const found = icons.find((i) => i.id === id && i.unlocked);
  return found || icons[0];
}

// ---------- daily challenge ----------
function dayOfYear(d = new Date()) {
  const start = new Date(d.getFullYear(), 0, 0);
  return Math.floor((d - start) / 86400000);
}

export function dailyChallenge(state) {
  const tk = todayKey();
  const meals = state.meals[tk] || { items: [], water: 0 };
  const proteinToday = meals.items.reduce((a, it) => a + (it.p || 0), 0);
  const water = meals.water || 0;
  const todayId = currentDayId();
  const done = !!state.done[`w${state.week}-${todayId}`];
  const activeToday = activeDates(state).has(tk);
  const T = targetsFor(state.profile);

  const pool = [
    { id: "protein", text: `Hit ${T.protein}g protein today`, xp: 25, done: proteinToday >= T.protein },
    { id: "workout", text: "Complete today's workout", xp: 50, done },
    { id: "water", text: `Drink ${T.waterOz} oz of water`, xp: 20, done: water >= T.waterOz },
    { id: "move", text: "Move today — log a lift or a run", xp: 40, done: activeToday },
    { id: "fuel", text: "Log every meal + hit protein", xp: 30, done: proteinToday >= T.protein && meals.items.length >= 3 },
  ];
  const c = pool[dayOfYear() % pool.length];
  return { ...c, claimed: !!state.game?.claimedDays?.[`${tk}-${c.id}`], todayKey: tk };
}

// ---------- quote ----------
const QUOTES = [
  "Us vs Them. Prove them wrong today.",
  "The work you skip is the work they'll beat you with.",
  "Discipline is choosing what you want most over what you want now.",
  "Nobody's coming. It's on you — and that's good news.",
  "Small wins, stacked daily, become unstoppable.",
  "You don't have to be great to start. You have to start to be great.",
  "Hard now, or hard later. Pick your hard.",
  "Champions do extra when no one's watching.",
  "Fall in love with the process and the results come.",
  "Every rep is a vote for who you're becoming.",
];
export function quoteOfDay() {
  return QUOTES[dayOfYear() % QUOTES.length];
}

// ---------- coach motivation (college football head coaches) ----------
const COACH_QUOTES = [
  // Dan Lanning · Oregon
  { text: "They're fighting for clicks. We're fighting for wins. There's a difference.", coach: "Dan Lanning", team: "Oregon" },
  { text: "Rooted in substance, not flash.", coach: "Dan Lanning", team: "Oregon" },
  { text: "It never hurts when somebody pours gasoline on the fire.", coach: "Dan Lanning", team: "Oregon" },
  { text: "It's not gonna be on your tombstone how many games you won. People remember the dash in between.", coach: "Dan Lanning", team: "Oregon" },
  { text: "Win the day.", coach: "Dan Lanning", team: "Oregon" },
  // Nick Saban · Alabama
  { text: "Don't waste a failure. Learn from it and get better.", coach: "Nick Saban", team: "Alabama" },
  { text: "The process is what you do day in and day out to be successful.", coach: "Nick Saban", team: "Alabama" },
  { text: "Mediocre people don't like high achievers, and high achievers don't like mediocre people.", coach: "Nick Saban", team: "Alabama" },
  // Bear Bryant · Alabama
  { text: "It's not the will to win that matters — everyone has that. It's the will to prepare to win that matters.", coach: "Bear Bryant", team: "Alabama" },
  { text: "If you believe in yourself and never quit, you'll be a winner.", coach: "Bear Bryant", team: "Alabama" },
  // Lou Holtz · Notre Dame
  { text: "Ability is what you're capable of doing. Motivation determines what you do. Attitude determines how well you do it.", coach: "Lou Holtz", team: "Notre Dame" },
  { text: "It's not the load that breaks you down, it's the way you carry it.", coach: "Lou Holtz", team: "Notre Dame" },
  // Deion Sanders · Colorado
  { text: "You've got to believe. If you don't believe, you can't achieve.", coach: "Deion Sanders", team: "Colorado" },
  { text: "I'm coming — and I'm bringing my luggage with me.", coach: "Deion Sanders", team: "Colorado" },
  // Dabo Swinney · Clemson
  { text: "Bloom where you're planted.", coach: "Dabo Swinney", team: "Clemson" },
  { text: "The best is yet to come.", coach: "Dabo Swinney", team: "Clemson" },
  // Kirby Smart · Georgia
  { text: "Trust your preparation, then cut it loose.", coach: "Kirby Smart", team: "Georgia" },
  // Urban Meyer · Ohio State
  { text: "The team that plays best together always wins.", coach: "Urban Meyer", team: "Ohio State" },
  // Marcus Freeman · Notre Dame
  { text: "Standards, not feelings.", coach: "Marcus Freeman", team: "Notre Dame" },
  // Pete Carroll · USC
  { text: "Always compete.", coach: "Pete Carroll", team: "USC" },
];
export function coachQuoteOfDay() {
  return COACH_QUOTES[dayOfYear() % COACH_QUOTES.length];
}

// ---------- recent activity ----------
export function recentActivity(state, limit = 6) {
  const events = [];
  for (const d in state.activityLog || {}) {
    const a = state.activityLog[d];
    if (a.workouts > 0) events.push({ date: d, emoji: "✅", label: `Completed a workout${a.calories ? ` · ${a.calories} kcal` : ""}` });
  }
  for (const r of state.runSessions || []) {
    events.push({ date: r.date, emoji: "🏃", label: `Ran${r.distanceMi ? ` ${r.distanceMi} mi` : ""}${r.topMph ? ` · ${parseFloat(r.topMph).toFixed(1)} mph top` : ""}` });
  }
  for (const w of state.weights || []) {
    events.push({ date: w.date, emoji: "⚖️", label: `Weigh-in · ${w.weight} lb` });
  }
  return events.sort((a, b) => b.date.localeCompare(a.date)).slice(0, limit);
}

// ---------- celebration triggers (confetti only for real wins) ----------
// Did any lift in this day beat its best weight from another week?
export function strengthPRHit(state, week, dayId) {
  const day = daysOf(state).find((d) => d.id === dayId);
  if (!day || day.type !== "lift") return false;
  const cur = state.liftLogs[`w${week}-${dayId}`]?.exercises || {};
  for (const ex of day.exercises) {
    const now = parseFloat(cur[ex.name]?.weight);
    if (!now) continue;
    let prevMax = 0, had = false;
    for (let w = 1; w <= 4; w++) {
      if (w === week) continue;
      const p = parseFloat(state.liftLogs[`w${w}-${dayId}`]?.exercises?.[ex.name]?.weight);
      if (p) { had = true; prevMax = Math.max(prevMax, p); }
    }
    if (had && now > prevMax) return true;
  }
  return false;
}

// Faster top speed or better pace than any previous run.
export function runPRHit(state, { topMph, pace }) {
  const runs = state.runSessions || [];
  if (!runs.length) return false;
  const bestSpeed = Math.max(...runs.map((r) => parseFloat(r.topMph) || 0));
  if (topMph && bestSpeed && topMph > bestSpeed) return true;
  const paces = runs
    .map((r) => (r.distanceMi && r.durationSec ? r.durationSec / 60 / r.distanceMi : Infinity))
    .filter((x) => isFinite(x));
  if (pace && paces.length && pace < Math.min(...paces)) return true;
  return false;
}

// Would completing today push the streak onto a milestone?
export function streakMilestoneHit(state) {
  const set = activeDates(state);
  const tk = todayKey();
  if (set.has(tk)) return false; // already counted today
  set.add(tk);
  let n = 0, i = 0;
  while (set.has(dayOffset(i))) { n++; i++; }
  return [3, 7, 14, 21, 30, 50, 75, 100].includes(n);
}

// next incomplete training day this week (or today)
export function continueDay(state) {
  const order = daysOf(state).filter((d) => d.type !== "rest");
  const todayId = currentDayId();
  const todayDay = daysOf(state).find((d) => d.id === todayId);
  if (todayDay && todayDay.type !== "rest" && !state.done[`w${state.week}-${todayId}`]) return todayDay;
  return order.find((d) => !state.done[`w${state.week}-${d.id}`]) || todayDay || order[0];
}
