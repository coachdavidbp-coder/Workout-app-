// =========================================================
// US vs Them — global store.
// Persists to Firestore when signed in, else to localStorage.
// Exposes state + typed actions via React context.
// =========================================================
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  isCloud,
  watchAuth,
  cloudLoad,
  cloudSave,
  cloudWatch,
} from "./lib/firebase.js";

const LOCAL_KEY = "usvsthem-v1";

// ---- seed: your GLP-1 weigh-ins imported from the scale screenshots ----
const SEED_WEIGHTS = [
  { date: "2026-06-23", weight: 306.3, bodyFat: 40.6 },
  { date: "2026-06-25", weight: 305.3, bodyFat: null },
  { date: "2026-06-28", weight: 302.6, bodyFat: null },
  { date: "2026-06-30", weight: 299.1, bodyFat: 41.7 },
  { date: "2026-07-01", weight: 300.3, bodyFat: null },
  { date: "2026-07-03", weight: 300.6, bodyFat: null },
  { date: "2026-07-05", weight: 301.3, bodyFat: null },
  { date: "2026-07-07", weight: 298.2, bodyFat: 39.2 },
  { date: "2026-07-10", weight: 297.3, bodyFat: 39.4 },
  { date: "2026-07-11", weight: 297.9, bodyFat: null },
  { date: "2026-07-12", weight: 296.7, bodyFat: 39.6 },
];

// ---- seed: sensible starter supplement list (fully editable) ----
const SEED_SUPPS = [
  { id: "whey", name: "Whey Protein", dose: "1 scoop", freq: "daily" },
  { id: "creatine", name: "Creatine", dose: "5 g", freq: "daily" },
  { id: "multivit", name: "Multivitamin", dose: "1 tablet", freq: "daily" },
  { id: "vitd", name: "Vitamin D3", dose: "2000 IU", freq: "daily" },
  { id: "electrolytes", name: "Electrolytes", dose: "1 packet", freq: "daily" },
];

export const DEFAULT_STATE = {
  version: 1,
  profile: {
    name: "Coach",
    startWeight: 315, // GLP-1 journey start
    goalWeight: 250,
  },
  week: 1,
  done: {}, // { "w1-sun": true }
  liftLogs: {}, // { "w1-sun": { feel, bodyweight, exercises: { name: {weight, reps:[], startWt, endWt} } } }
  runLogs: {}, // { "w1-tue": { intervals: [{mph, incline}], done } }
  meals: {}, // { "2026-07-26": { items: [{name, cal, p, qty, slot}], water } }
  weights: SEED_WEIGHTS, // [{date, weight, bodyFat}]
  supplements: SEED_SUPPS, // [{id, name, dose, freq}]
  suppLog: {}, // { "2026-07-26": { whey: true, ... } }
};

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ---------- helpers ----------
export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function currentDayId(d = new Date()) {
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][d.getDay()];
}

// Sunday-first array of 7 days for the week containing `anchor`.
export function weekDates(anchor = new Date()) {
  const base = new Date(anchor);
  base.setHours(12, 0, 0, 0);
  const start = new Date(base);
  start.setDate(base.getDate() - base.getDay()); // back to Sunday
  const labels = ["S", "M", "T", "W", "T", "F", "S"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { key: todayKey(d), date: d, label: labels[i], dom: d.getDate() };
  });
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) {
    /* ignore */
  }
  return DEFAULT_STATE;
}

function saveLocal(state) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
  } catch (e) {
    /* storage unavailable — keep going in memory */
  }
}

const StoreCtx = createContext(null);

export function StoreProvider({ children }) {
  // mode: "loading" | "local" | "cloud" | "signedout"
  const [mode, setMode] = useState(isCloud() ? "loading" : "local");
  const [user, setUser] = useState(null);
  const [state, setState] = useState(() => (isCloud() ? DEFAULT_STATE : loadLocal()));
  const saveTimer = useRef(null);
  const unsubDoc = useRef(null);
  const skipNextCloudSave = useRef(false);

  // ---- auth wiring (cloud only) ----
  useEffect(() => {
    if (!isCloud()) return;
    const unsub = watchAuth(async (u) => {
      if (unsubDoc.current) {
        unsubDoc.current();
        unsubDoc.current = null;
      }
      if (!u) {
        setUser(null);
        setMode("signedout");
        return;
      }
      setUser(u);
      // load existing cloud doc; if empty, seed from local (one-time migration)
      let data = await cloudLoad(u.uid);
      if (!data) {
        const local = loadLocal();
        data = local && local !== DEFAULT_STATE ? local : DEFAULT_STATE;
        await cloudSave(u.uid, data);
      }
      skipNextCloudSave.current = true;
      setState({ ...DEFAULT_STATE, ...data });
      setMode("cloud");
      // live updates from other devices
      unsubDoc.current = cloudWatch(u.uid, (remote) => {
        skipNextCloudSave.current = true;
        setState((prev) => ({ ...prev, ...remote }));
      });
    });
    return () => {
      unsub && unsub();
      if (unsubDoc.current) unsubDoc.current();
    };
  }, []);

  // ---- persistence ----
  useEffect(() => {
    if (mode === "local") {
      saveLocal(state);
    } else if (mode === "cloud" && user) {
      if (skipNextCloudSave.current) {
        skipNextCloudSave.current = false;
        return;
      }
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        cloudSave(user.uid, state).catch(() => {});
      }, 600);
    }
  }, [state, mode, user]);

  // ---- immutable update helper ----
  function update(mutator) {
    setState((prev) => {
      const next = structuredClone(prev);
      mutator(next);
      return next;
    });
  }

  // ---------- actions ----------
  const actions = {
    setWeek: (w) => update((s) => (s.week = w)),

    toggleDone: (week, dayId) =>
      update((s) => {
        const key = `w${week}-${dayId}`;
        s.done[key] = !s.done[key];
      }),

    setFeel: (week, dayId, feel) =>
      update((s) => {
        const key = `w${week}-${dayId}`;
        s.liftLogs[key] = s.liftLogs[key] || { exercises: {} };
        s.liftLogs[key].feel = feel;
      }),

    setDayBodyweight: (week, dayId, bw) =>
      update((s) => {
        const key = `w${week}-${dayId}`;
        s.liftLogs[key] = s.liftLogs[key] || { exercises: {} };
        s.liftLogs[key].bodyweight = bw;
      }),

    setExerciseLog: (week, dayId, exName, patch) =>
      update((s) => {
        const key = `w${week}-${dayId}`;
        s.liftLogs[key] = s.liftLogs[key] || { exercises: {} };
        s.liftLogs[key].exercises = s.liftLogs[key].exercises || {};
        s.liftLogs[key].exercises[exName] = {
          ...(s.liftLogs[key].exercises[exName] || {}),
          ...patch,
        };
      }),

    setInterval: (week, dayId, idx, patch) =>
      update((s) => {
        const key = `w${week}-${dayId}`;
        s.runLogs[key] = s.runLogs[key] || { intervals: [] };
        const list = s.runLogs[key].intervals;
        list[idx] = { ...(list[idx] || {}), ...patch };
      }),

    addInterval: (week, dayId) =>
      update((s) => {
        const key = `w${week}-${dayId}`;
        s.runLogs[key] = s.runLogs[key] || { intervals: [] };
        s.runLogs[key].intervals.push({ mph: "", incline: "" });
      }),

    removeInterval: (week, dayId, idx) =>
      update((s) => {
        const key = `w${week}-${dayId}`;
        if (s.runLogs[key]?.intervals) s.runLogs[key].intervals.splice(idx, 1);
      }),

    addMeal: (dateKey, item) =>
      update((s) => {
        s.meals[dateKey] = s.meals[dateKey] || { items: [], water: 0 };
        s.meals[dateKey].items.push({ ...item, ts: Date.now() });
      }),

    removeMeal: (dateKey, ts) =>
      update((s) => {
        if (s.meals[dateKey])
          s.meals[dateKey].items = s.meals[dateKey].items.filter(
            (i) => i.ts !== ts
          );
      }),

    setWater: (dateKey, oz) =>
      update((s) => {
        s.meals[dateKey] = s.meals[dateKey] || { items: [], water: 0 };
        s.meals[dateKey].water = Math.max(0, oz);
      }),

    addWeighIn: ({ date, weight, bodyFat }) =>
      update((s) => {
        const existingIdx = s.weights.findIndex((w) => w.date === date);
        const entry = { date, weight, bodyFat: bodyFat ?? null };
        if (existingIdx >= 0) s.weights[existingIdx] = entry;
        else s.weights.push(entry);
        s.weights.sort((a, b) => a.date.localeCompare(b.date));
      }),

    removeWeighIn: (date) =>
      update((s) => {
        s.weights = s.weights.filter((w) => w.date !== date);
      }),

    setProfile: (patch) => update((s) => Object.assign(s.profile, patch)),

    // ---- supplements ----
    addSupplement: ({ name, dose, freq }) =>
      update((s) => {
        s.supplements = s.supplements || [];
        s.supplements.push({ id: uid(), name, dose: dose || "", freq: freq || "daily" });
      }),

    removeSupplement: (id) =>
      update((s) => {
        s.supplements = (s.supplements || []).filter((x) => x.id !== id);
      }),

    toggleSupp: (dateKey, id) =>
      update((s) => {
        s.suppLog = s.suppLog || {};
        s.suppLog[dateKey] = s.suppLog[dateKey] || {};
        s.suppLog[dateKey][id] = !s.suppLog[dateKey][id];
      }),

    replaceState: (next) => setState({ ...DEFAULT_STATE, ...next }),
  };

  return (
    <StoreCtx.Provider value={{ state, mode, user, actions }}>
      {children}
    </StoreCtx.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
