import { useState } from "react";
import { useStore, todayKey } from "../store.jsx";
import { PLAN_LIST, DAY_NAMES } from "../data/plans.js";
import { defaultTargets, DIETS } from "../data/plan.js";
import BrandLogo from "../components/BrandLogo.jsx";
import { haptic } from "../lib/fx.js";

const GOALS = [
  { id: "lose", label: "Lose fat" },
  { id: "strength", label: "Build strength" },
  { id: "faster", label: "Get faster" },
  { id: "maintain", label: "Maintain" },
];

export default function Onboarding() {
  const { actions } = useStore();
  const [step, setStep] = useState(0);
  const [f, setF] = useState({
    name: "", sex: "", heightFt: "", heightIn: "", currentWeight: "",
    goalWeight: "", goal: "lose", diet: "balanced", planId: "gridiron",
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
    actions.setProfile({
      name: f.name.trim(),
      sex: f.sex,
      heightIn: heightIn || null,
      startWeight: weight,
      goalWeight: parseFloat(f.goalWeight) || 0,
      goal: f.goal,
      diet: f.diet,
      planId: f.planId,
      proteinGoal: t.protein,
      calorieGoal: t.calories,
      waterGoal: t.waterOz,
      onboarded: true,
    });
    if (weight) actions.addWeighIn({ date: todayKey(), weight, bodyFat: null });
    haptic("success");
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
            <div className="stack gap-3">
              {PLAN_LIST.map((pl) => (
                <button key={pl.id} className={`plan-card ${f.planId === pl.id ? "on" : ""}`} onClick={() => { set("planId", pl.id); haptic(); }}>
                  <div className="plan-top">
                    <span className="plan-emoji">{pl.accent}</span>
                    <span className="plan-name">{pl.name}</span>
                    {f.planId === pl.id && <span className="plan-check">✓</span>}
                  </div>
                  <div className="plan-tag">{pl.tagline}</div>
                  <div className="plan-focus">{pl.focus}</div>
                  <div className="plan-chips">
                    {pl.equipment.map((e) => <span key={e} className="plan-chip">{e}</span>)}
                  </div>
                </button>
              ))}
              <button className={`plan-card ${f.planId === "custom" ? "on" : ""}`} onClick={() => { set("planId", "custom"); haptic(); }}>
                <div className="plan-top">
                  <span className="plan-emoji">⚙️</span>
                  <span className="plan-name">Build your own</span>
                  {f.planId === "custom" && <span className="plan-check">✓</span>}
                </div>
                <div className="plan-tag">Design a plan you actually like</div>
                <div className="plan-focus">Start from a template, then edit days, exercises &amp; intervals in Profile → Program.</div>
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
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={finish}>
            Build my plan
          </button>
        )}
      </div>
    </div>
  );
}
