import { useState } from "react";
import { useStore } from "../store.jsx";
import { planFor, mkProto } from "../data/plans.js";
import { haptic } from "../lib/fx.js";
import { toast } from "../lib/toast.js";

const DAYS = [
  ["sun", "Sun"], ["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"],
  ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"],
];

// Turn a stored plan into an editable draft.
function toDraft(plan) {
  const byId = {};
  (plan.days || []).forEach((d) => (byId[d.id] = d));
  return DAYS.map(([id, label]) => {
    const d = byId[id] || { name: "Rest", type: "rest" };
    const p0 = d.protocol?.[0] || {};
    return {
      id, label,
      name: d.name || "",
      type: d.type || "rest",
      exercises: (d.exercises || []).map((e) => ({ name: e.name, sets: (e.sets && e.sets[0]) || "3×12" })),
      rounds: p0.rounds || 8,
      work: p0.seconds || 20,
      rest: p0.rest || 60,
    };
  });
}

export default function CustomPlanBuilder({ onClose }) {
  const { state, actions } = useStore();
  const existing = state.profile.planId === "custom" && state.profile.customPlan
    ? state.profile.customPlan
    : planFor({ profile: { planId: "custom", customPlan: state.profile.customPlan } });
  const [name, setName] = useState(existing.name || "My Program");
  const [days, setDays] = useState(() => toDraft(existing));

  const setDay = (i, patch) => setDays((ds) => ds.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  const addEx = (i) => setDay(i, { exercises: [...days[i].exercises, { name: "", sets: "3×12" }] });
  const setEx = (i, j, patch) => setDay(i, { exercises: days[i].exercises.map((e, k) => (k === j ? { ...e, ...patch } : e)) });
  const delEx = (i, j) => setDay(i, { exercises: days[i].exercises.filter((_, k) => k !== j) });

  const save = () => {
    const plan = {
      id: "custom", name: name.trim() || "My Program", accent: "⚙️",
      tagline: "Your custom plan", equipment: ["Your gear"], focus: "Custom",
      days: days.map((d) => {
        const base = { id: d.id, label: d.label, name: d.name.trim() || d.label, warmup: d.type === "rest" ? "" : "5 min easy warm-up", note: "" };
        if (d.type === "lift") {
          return { ...base, type: "lift", exercises: d.exercises
            .filter((e) => e.name.trim())
            .map((e) => ({ name: e.name.trim(), sets: [e.sets, e.sets, e.sets, e.sets], video: null, q: `${e.name.trim()} form` })) };
        }
        if (d.type === "cardio") {
          const rounds = parseInt(d.rounds) || 8, work = parseInt(d.work) || 20, rest = parseInt(d.rest) || 60;
          return { ...base, type: "cardio", protocol: mkProto(rounds, work, rest) };
        }
        return { ...base, type: "rest", note: "Full recovery. Rest is where the work pays off." };
      }),
    };
    actions.setProfile({ customPlan: plan, planId: "custom" });
    haptic("success");
    toast({ emoji: "⚙️", title: "Your program is set", sub: plan.name, tone: "good" });
    onClose?.();
  };

  return (
    <div className="builder">
      <div className="builder-head">
        <button className="it-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="builder-title">Build your program</div>
        <button className="link-btn" onClick={save}>Save</button>
      </div>

      <div className="builder-body">
        <label className="onb-label">Program name</label>
        <input className="login-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah's Sprint Plan" />

        {days.map((d, i) => (
          <div className="card build-day" key={d.id}>
            <div className="build-day-top">
              <span className="build-dow">{d.label}</span>
              <input className="login-input build-name" value={d.name} placeholder="Day name (e.g. Legs)" onChange={(e) => setDay(i, { name: e.target.value })} />
            </div>
            <div className="row gap-2" style={{ marginTop: 10 }}>
              {[["lift", "Lift"], ["cardio", "Cardio"], ["rest", "Rest"]].map(([v, l]) => (
                <button key={v} className={`week-pill ${d.type === v ? "on" : ""}`} onClick={() => setDay(i, { type: v })}>{l}</button>
              ))}
            </div>

            {d.type === "lift" && (
              <div style={{ marginTop: 12 }}>
                {d.exercises.map((e, j) => (
                  <div className="build-ex" key={j}>
                    <input className="login-input" style={{ flex: 2 }} value={e.name} placeholder="Exercise" onChange={(ev) => setEx(i, j, { name: ev.target.value })} />
                    <input className="login-input" style={{ flex: 1, minWidth: 0 }} value={e.sets} placeholder="3×12" onChange={(ev) => setEx(i, j, { sets: ev.target.value })} />
                    <button className="del" onClick={() => delEx(i, j)} aria-label="Remove">×</button>
                  </div>
                ))}
                <button className="add-interval" style={{ borderRadius: 10, marginTop: 4 }} onClick={() => addEx(i)}>+ Add exercise</button>
              </div>
            )}

            {d.type === "cardio" && (
              <div className="ex-log" style={{ marginTop: 12 }}>
                <div className="numfield"><label>Rounds</label><input type="number" inputMode="numeric" value={d.rounds} onChange={(e) => setDay(i, { rounds: e.target.value })} /></div>
                <div className="numfield"><label>Work (s)</label><input type="number" inputMode="numeric" value={d.work} onChange={(e) => setDay(i, { work: e.target.value })} /></div>
                <div className="numfield"><label>Rest (s)</label><input type="number" inputMode="numeric" value={d.rest} onChange={(e) => setDay(i, { rest: e.target.value })} /></div>
              </div>
            )}
          </div>
        ))}

        <button className="btn btn-primary btn-block" style={{ margin: "8px 0 20px" }} onClick={save}>Save my program</button>
      </div>
    </div>
  );
}
