import { useState } from "react";
import Sheet from "./Sheet.jsx";
import { useStore } from "../store.jsx";
import { planFor, planMeta, trainingCount } from "../data/plans.js";
import { bodyweight } from "../lib/gamify.js";
import { recommendGoals, spread, ACTIVITY_LEVELS, GOAL_LABELS } from "../lib/goals.js";
import { RING_COLORS } from "../lib/activity.js";
import { haptic } from "../lib/fx.js";
import { toast } from "../lib/toast.js";

// Asks the few things we can't infer (age, how active you are day-to-day,
// what you're chasing) and recommends Move / Exercise / Workouts ring goals —
// with the day / week / month version of each. Everything stays editable.
export default function GoalWizardSheet({ open, onClose }) {
  const { state, actions } = useStore();
  const prof = state.profile || {};
  const plan = planFor(state);
  const meta = planMeta(plan);

  const [age, setAge] = useState(prof.age ? String(prof.age) : "");
  const [sex, setSex] = useState(prof.sex || "m");
  const [level, setLevel] = useState(prof.activityLevel || "moderate");
  const [goal, setGoal] = useState(prof.goal || "lose");
  const [manual, setManual] = useState(false);
  const [mMove, setMMove] = useState(String(prof.moveGoal ?? 600));
  const [mEx, setMEx] = useState(String(prof.exerciseGoal ?? 30));
  const [mWk, setMWk] = useState(String(prof.workoutsGoal ?? trainingCount(state)));

  const weightLb = bodyweight(state) || prof.startWeight || 180;
  const rec = recommendGoals({
    sex, age, heightIn: prof.heightIn, weightLb,
    activityLevel: level, goal,
    trainingDays: meta.trainingDays || trainingCount(state),
    avgMin: meta.avgMin,
  });

  const apply = (g) => {
    actions.setProfile({
      age: parseInt(age, 10) || null,
      sex,
      activityLevel: level,
      moveGoal: g.moveGoal,
      exerciseGoal: g.exerciseGoal,
      workoutsGoal: g.workoutsGoal,
    });
    haptic("success");
    toast({ emoji: "🎯", title: "Ring goals set", sub: `${g.moveGoal} cal · ${g.exerciseGoal} min · ${g.workoutsGoal} workouts/wk`, tone: "good" });
    onClose();
  };

  const rows = [
    { id: "move", label: "Move", unit: "cal", value: rec.moveGoal },
    { id: "exercise", label: "Exercise", unit: "min", value: rec.exerciseGoal },
  ];

  return (
    <Sheet open={open} onClose={onClose}>
      <h3 className="sheet-title">Recommend my goals</h3>
      <div className="sheet-sub">A few answers and we'll do the math</div>

      <div className="gw-fields">
        <div className="gw-field">
          <label>Age</label>
          <input type="number" inputMode="numeric" placeholder="25" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div className="gw-field">
          <label>Sex</label>
          <div className="row gap-2">
            {[["m", "Male"], ["f", "Female"]].map(([id, lab]) => (
              <button key={id} className={`week-pill ${sex === id ? "on" : ""}`} onClick={() => setSex(id)}>{lab}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="section-label" style={{ marginTop: 16 }}>Day-to-day activity (outside workouts)</div>
      <div className="gw-levels">
        {ACTIVITY_LEVELS.map((l) => (
          <button key={l.id} className={`gw-level ${level === l.id ? "on" : ""}`} onClick={() => { setLevel(l.id); haptic(); }}>
            <span className="gwl-name">{l.label}</span>
            <span className="gwl-blurb">{l.blurb}</span>
          </button>
        ))}
      </div>

      <div className="section-label" style={{ marginTop: 16 }}>Main goal</div>
      <div className="row gap-2" style={{ flexWrap: "wrap" }}>
        {Object.entries(GOAL_LABELS).map(([id, lab]) => (
          <button key={id} className={`week-pill ${goal === id ? "on" : ""}`} onClick={() => { setGoal(id); haptic(); }}>{lab}</button>
        ))}
      </div>

      {/* recommendation */}
      <div className="gw-rec">
        <div className="gw-rec-head">
          <span>Recommended</span>
          <span className="gw-bmr">Resting burn ≈ {rec.bmr.toLocaleString()} cal · total ≈ {rec.tdee.toLocaleString()} cal/day</span>
        </div>

        <div className="gw-table">
          <div className="gw-thead">
            <span />
            <span>Day</span>
            <span>Week</span>
            <span>Month</span>
          </div>
          {rows.map((r) => {
            const s = spread(r.value);
            return (
              <div className="gw-trow" key={r.id}>
                <span className="gw-metric">
                  <i style={{ background: RING_COLORS[r.id] }} />{r.label}
                </span>
                <span className="tnum b">{s.day}<em>{r.unit}</em></span>
                <span className="tnum">{s.week.toLocaleString()}</span>
                <span className="tnum">{s.month.toLocaleString()}</span>
              </div>
            );
          })}
          <div className="gw-trow">
            <span className="gw-metric"><i style={{ background: RING_COLORS.train }} />Workouts</span>
            <span className="tnum b">1<em>on days</em></span>
            <span className="tnum">{rec.workoutsGoal}</span>
            <span className="tnum">{rec.workoutsGoal * 4}</span>
          </div>
        </div>

        <div className="gw-why">
          Based on your body data at <b>{Math.round(weightLb)} lb</b>, a <b>{rec.level.label.toLowerCase()}</b> lifestyle,
          and <b>{plan.name}</b> asking for {meta.trainingDays} sessions of ~{meta.avgMin} min each week.
        </div>

        <button className="btn btn-primary btn-block" onClick={() => apply(rec)}>Use these goals</button>
      </div>

      <button className="gw-manual-toggle" onClick={() => setManual((m) => !m)}>
        {manual ? "▾ Hide manual goals" : "▸ I'd rather set my own"}
      </button>

      {manual && (
        <div className="gw-manual">
          <div className="gw-field">
            <label>Move (cal/day)</label>
            <input type="number" inputMode="numeric" value={mMove} onChange={(e) => setMMove(e.target.value)} />
          </div>
          <div className="gw-field">
            <label>Exercise (min/day)</label>
            <input type="number" inputMode="numeric" value={mEx} onChange={(e) => setMEx(e.target.value)} />
          </div>
          <div className="gw-field">
            <label>Workouts / week</label>
            <input type="number" inputMode="numeric" value={mWk} onChange={(e) => setMWk(e.target.value)} />
          </div>
          <button
            className="btn btn-block"
            style={{ marginTop: 10 }}
            onClick={() => apply({
              moveGoal: Math.max(50, parseInt(mMove, 10) || 600),
              exerciseGoal: Math.max(5, parseInt(mEx, 10) || 30),
              workoutsGoal: Math.max(1, Math.min(7, parseInt(mWk, 10) || 6)),
            })}
          >
            Save my goals
          </button>
        </div>
      )}
    </Sheet>
  );
}
