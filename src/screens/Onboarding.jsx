import { useState } from "react";
import { useStore, todayKey } from "../store.jsx";
import { PLAN_LIST, DAY_NAMES, DURATION_OPTIONS, planMeta, getPlan } from "../data/plans.js";
import { recommendGoals, ACTIVITY_LEVELS } from "../lib/goals.js";
import { defaultTargets, DIETS } from "../data/plan.js";
import BrandLogo from "../components/BrandLogo.jsx";
import { haptic } from "../lib/fx.js";
import GuidedBuilder from "./GuidedBuilder.jsx";

const GOALS = [
  { id: "lose", label: "Lose fat" },
  { id: "strength", label: "Build strength" },
  { id: "faster", label: "Get faster" },
  { id: "maintain", label: "Maintain" },
];

export default function Onboarding() {
  const { actions } = useStore();
  const [step, setStep] = useState(0);
  const [guiding, setGuiding] = useState(false);
  const [f, setF] = useState({
    name: "", sex: "", heightFt: "", heightIn: "", currentWeight: "",
    goalWeight: "", goal: "lose", diet: "balanced", planId: "gridiron", programWeeks: 4,
    age: "", activityLevel: "moderate",
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const canNext =
    (step === 0 && f.name.trim()) ||
    (step === 1 && f.currentWeight && f.goalWeight) ||
    step === 2;

  const finish = () => {
    const weight = parseFloat(f.currentWeight) || 0;
    const heightIn = (parseInt(f.heightFt) || 0) * 12 + (parseInt(f.heightIn) || 0);
    const t = defaultTargets({ weight: weight || 180, goal: f.goal, sex: f.sex, diet: f.diet });
    // Ring goals from the same recommender the Goals wizard uses, so a new
    // account starts on real targets instead of the generic defaults.
    const pm = planMeta(getPlan(f.planId));
    const rec = recommendGoals({
      sex: f.sex, age: f.age, heightIn, weightLb: weight || 180,
      activityLevel: f.activityLevel, goal: f.goal,
      trainingDays: pm.trainingDays, avgMin: pm.avgMin,
    });
    actions.setProfile({
      name: f.name.trim(),
      sex: f.sex,
      heightIn: heightIn || null,
      startWeight: weight,
      goalWeight: parseFloat(f.goalWeight) || 0,
      goal: f.goal,
      diet: f.diet,
      planId: f.planId,
      programWeeks: f.programWeeks,
      age: parseInt(f.age, 10) || null,
      activityLevel: f.activityLevel,
      moveGoal: rec.moveGoal,
      exerciseGoal: rec.exerciseGoal,
      workoutsGoal: rec.workoutsGoal,
      proteinGoal: t.protein,
      calorieGoal: t.calories,
      waterGoal: t.waterOz,
      onboarded: true,
    });
    if (weight) actions.addWeighIn({ date: todayKey(), weight, bodyFat: null });
    haptic("success");
  };

  // "Build my plan": if they chose the custom route, run the guided quiz
  // first (it sets the customPlan), then commit the rest of the profile.
  const submit = () => {
    if (f.planId === "custom") setGuiding(true);
    else finish();
  };

  return (
    <div className="onb">
      <div className="onb-head">
        <BrandLogo height={26} />
        <div className="onb-dots">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`onb-dot ${i <= step ? "on" : ""}`} />
          ))}
        </div>
      </div>

      <div className="onb-body">
        {step === 0 && (
          <>
            <h1 className="onb-title">Let's build your plan</h1>
            <p className="onb-sub">First, who's training?</p>
            <label className="onb-label">Your name</label>
            <input className="login-input" placeholder="e.g. David" value={f.name} onChange={(e) => set("name", e.target.value)} autoFocus />
            <label className="onb-label">Sex <span className="onb-opt">(for a better calorie estimate)</span></label>
            <div className="row gap-2">
              {[["f", "Female"], ["m", "Male"], ["", "Prefer not to say"]].map(([v, l]) => (
                <button key={l} className={`week-pill ${f.sex === v ? "on" : ""}`} onClick={() => set("sex", v)}>{l}</button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="onb-title">Your numbers</h1>
            <p className="onb-sub">We build your protein, calorie &amp; water targets around these.</p>
            <label className="onb-label">Height</label>
            <div className="row gap-2">
              <input className="login-input" inputMode="numeric" placeholder="ft" value={f.heightFt} onChange={(e) => set("heightFt", e.target.value)} />
              <input className="login-input" inputMode="numeric" placeholder="in" value={f.heightIn} onChange={(e) => set("heightIn", e.target.value)} />
            </div>
            <div className="row gap-2" style={{ marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="onb-label">Current weight (lb)</label>
                <input className="login-input" inputMode="decimal" placeholder="180" value={f.currentWeight} onChange={(e) => set("currentWeight", e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label className="onb-label">Goal weight (lb)</label>
                <input className="login-input" inputMode="decimal" placeholder="160" value={f.goalWeight} onChange={(e) => set("goalWeight", e.target.value)} />
              </div>
            </div>
            <div className="row gap-2" style={{ marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label className="onb-label">Age</label>
                <input className="login-input" inputMode="numeric" placeholder="25" value={f.age} onChange={(e) => set("age", e.target.value)} />
              </div>
              <div style={{ flex: 2 }}>
                <label className="onb-label">Everyday activity (outside workouts)</label>
                <select className="login-input" value={f.activityLevel} onChange={(e) => set("activityLevel", e.target.value)}>
                  {ACTIVITY_LEVELS.map((l) => <option key={l.id} value={l.id}>{l.label} — {l.blurb}</option>)}
                </select>
              </div>
            </div>
            <label className="onb-label">Primary goal</label>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              {GOALS.map((g) => (
                <button key={g.id} className={`week-pill ${f.goal === g.id ? "on" : ""}`} onClick={() => set("goal", g.id)}>{g.label}</button>
              ))}
            </div>
            <label className="onb-label">Eating style</label>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              {Object.values(DIETS).map((d) => (
                <button key={d.id} className={`week-pill ${f.diet === d.id ? "on" : ""}`} onClick={() => set("diet", d.id)}>{d.name}</button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="onb-title">Pick your program</h1>
            <p className="onb-sub">You can change this later in your profile.</p>

            <div className="dur-card">
              <div className="dur-lab">How long?<small>Weeks past 4 repeat the block — same days, heavier</small></div>
              <div className="dur-chips">
                {DURATION_OPTIONS.map((n) => (
                  <button
                    key={n}
                    className={`dur-chip ${f.programWeeks === n ? "on" : ""}`}
                    onClick={() => { set("programWeeks", n); haptic(); }}
                  >
                    {n} wk
                  </button>
                ))}
              </div>
            </div>

            <div className="plan-list">
              {PLAN_LIST.map((pl) => {
                const meta = planMeta(pl);
                const on = f.planId === pl.id;
                const [g1, g2] = pl.grad || ["#334155", "#64748B"];
                return (
                  <button
                    key={pl.id}
                    className={`plan-hero ${on ? "on" : ""}`}
                    style={{ backgroundImage: `linear-gradient(135deg, ${g1} 0%, ${g2} 100%)` }}
                    onClick={() => { set("planId", pl.id); haptic(); }}
                  >
                    <div className="ph-head">
                      <span className="ph-name">{pl.name}</span>
                      <span className="ph-emoji">{pl.accent}</span>
                    </div>
                    <div className="ph-focus">{pl.focus}</div>
                    <div className="ph-meta">
                      {f.programWeeks} WEEKS · {meta.trainingDays} DAYS/WK · ~{meta.avgMin} MIN/DAY
                    </div>
                    <span className={`ph-pill ${on ? "on" : ""}`}>{on ? "✓ Selected" : "Choose this plan"}</span>
                  </button>
                );
              })}

              <button
                className={`plan-hero custom ${f.planId === "custom" ? "on" : ""}`}
                style={{ backgroundImage: "linear-gradient(135deg, #475569 0%, #94A3B8 100%)" }}
                onClick={() => { set("planId", "custom"); haptic(); }}
              >
                <div className="ph-head">
                  <span className="ph-name">Build your own</span>
                  <span className="ph-emoji">⚙️</span>
                </div>
                <div className="ph-focus">A program shaped around what you like and own</div>
                <div className="ph-meta">{f.programWeeks} WEEKS · YOUR DAYS · YOUR LIFTS</div>
                <span className={`ph-pill ${f.planId === "custom" ? "on" : ""}`}>
                  {f.planId === "custom" ? "✓ Selected" : "Build it"}
                </span>
              </button>
            </div>
          </>
        )}
      </div>

      <div className="onb-foot">
        {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>Back</button>}
        {step < 2 ? (
          <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canNext} onClick={() => canNext && setStep(step + 1)}>
            Continue
          </button>
        ) : (
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={submit}>
            {f.planId === "custom" ? "Build my plan ⚡" : "Build my plan"}
          </button>
        )}
      </div>

      {guiding && <GuidedBuilder onClose={() => { setGuiding(false); finish(); }} />}
    </div>
  );
}
