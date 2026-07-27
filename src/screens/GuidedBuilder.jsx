import { useState } from "react";
import { useStore } from "../store.jsx";
import { generatePlan } from "../lib/planGen.js";
import { haptic } from "../lib/fx.js";
import { toast } from "../lib/toast.js";

// =========================================================
// Guided plan builder — a short questionnaire that builds a
// full personalized program from what you like & own.
// =========================================================

const EQUIP = [
  { id: "db", emoji: "🏋️", label: "Dumbbells" },
  { id: "kb", emoji: "🔔", label: "Kettlebell" },
  { id: "bb", emoji: "🏋️‍♂️", label: "Barbell" },
  { id: "band", emoji: "🎗️", label: "Resistance bands" },
  { id: "bench", emoji: "🛋️", label: "A bench" },
  { id: "bw", emoji: "🤸", label: "Just my bodyweight" },
];

const FOCUS = [
  { id: "toning", emoji: "✨", label: "Tone & sculpt", sub: "Lean, defined, strong" },
  { id: "weightloss", emoji: "🔥", label: "Lose fat", sub: "Burn calories, stay lean" },
  { id: "glutes", emoji: "🍑", label: "Glutes & legs", sub: "Lower-body focus" },
  { id: "upperlower", emoji: "💪", label: "Upper / lower split", sub: "Balanced whole body" },
  { id: "strength", emoji: "🏆", label: "Get stronger", sub: "Push, pull & leg days" },
  { id: "athletic", emoji: "⚡", label: "Athletic & powerful", sub: "Explosive, full body" },
  { id: "fullbody", emoji: "🎯", label: "Full body", sub: "Simple, hits everything" },
];

const CARDIO = [
  { id: "hiit", emoji: "💨", label: "Sprint intervals", sub: "Short, all-out bursts" },
  { id: "steady", emoji: "🏃", label: "Steady runs", sub: "Moderate, longer efforts" },
  { id: "mix", emoji: "🔀", label: "A mix of both", sub: "Sprints + steady runs" },
  { id: "none", emoji: "🚫", label: "No cardio", sub: "Just lifting for now" },
];

const LENGTH = [
  { id: "short", emoji: "⏱️", label: "Short & quick", sub: "~30 min, 4 moves" },
  { id: "med", emoji: "⏲️", label: "Standard", sub: "~45 min, 5 moves" },
  { id: "long", emoji: "🕐", label: "Longer", sub: "~60 min, 6 moves" },
];

const LEVEL = [
  { id: "beg", emoji: "🌱", label: "Newer to this", sub: "Fewer sets, learn the moves" },
  { id: "int", emoji: "🔥", label: "Experienced", sub: "More volume, more intensity" },
];

export default function GuidedBuilder({ onClose }) {
  const { actions } = useStore();
  const [step, setStep] = useState(0);
  const [a, setA] = useState({
    equipment: [], days: 4, focus: "toning", cardio: "mix", length: "med", level: "beg",
  });
  const set = (k, v) => setA((p) => ({ ...p, [k]: v }));
  const toggleEquip = (id) => {
    haptic();
    setA((p) => ({
      ...p,
      equipment: p.equipment.includes(id)
        ? p.equipment.filter((x) => x !== id)
        : [...p.equipment, id],
    }));
  };

  const STEPS = ["equipment", "days", "focus", "cardio", "length", "level"];
  const canNext =
    step !== 0 || a.equipment.length > 0; // must pick at least one equipment option

  const finish = () => {
    const plan = generatePlan(a);
    actions.setProfile({ customPlan: plan, planId: "custom" });
    haptic("success");
    toast({ emoji: "⚡", title: "Your plan is ready!", sub: plan.name, tone: "good" });
    onClose?.();
  };

  const next = () => {
    if (!canNext) return;
    if (step < STEPS.length - 1) { setStep(step + 1); haptic(); }
    else finish();
  };

  return (
    <div className="builder">
      <div className="builder-head">
        <button className="it-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="builder-title">Build your plan</div>
        <div className="onb-dots" style={{ marginLeft: "auto" }}>
          {STEPS.map((_, i) => <span key={i} className={`onb-dot ${i <= step ? "on" : ""}`} />)}
        </div>
      </div>

      <div className="builder-body">
        {step === 0 && (
          <>
            <h1 className="onb-title">What do you have?</h1>
            <p className="onb-sub">Pick everything you can train with. We'll only program moves you can actually do.</p>
            <div className="quiz-grid">
              {EQUIP.map((e) => (
                <button
                  key={e.id}
                  className={`quiz-card ${a.equipment.includes(e.id) ? "on" : ""}`}
                  onClick={() => toggleEquip(e.id)}
                >
                  <span className="quiz-emoji">{e.emoji}</span>
                  <span className="quiz-label">{e.label}</span>
                  {a.equipment.includes(e.id) && <span className="quiz-check">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="onb-title">How many days a week?</h1>
            <p className="onb-sub">Be honest — a plan you'll actually finish beats a perfect one you skip.</p>
            <div className="row gap-2" style={{ flexWrap: "wrap" }}>
              {[2, 3, 4, 5, 6].map((d) => (
                <button key={d} className={`day-pick ${a.days === d ? "on" : ""}`} onClick={() => { set("days", d); haptic(); }}>
                  {d}<small>days</small>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="onb-title">What's your goal?</h1>
            <p className="onb-sub">This shapes how your week is built.</p>
            <div className="stack gap-2">
              {FOCUS.map((f) => (
                <QuizRow key={f.id} item={f} on={a.focus === f.id} onClick={() => { set("focus", f.id); haptic(); }} />
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="onb-title">How do you like to do cardio?</h1>
            <p className="onb-sub">We'll work it into your week around your lifts.</p>
            <div className="stack gap-2">
              {CARDIO.map((c) => (
                <QuizRow key={c.id} item={c} on={a.cardio === c.id} onClick={() => { set("cardio", c.id); haptic(); }} />
              ))}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="onb-title">How long per session?</h1>
            <p className="onb-sub">More moves = longer workouts. Pick what fits your schedule.</p>
            <div className="stack gap-2">
              {LENGTH.map((l) => (
                <QuizRow key={l.id} item={l} on={a.length === l.id} onClick={() => { set("length", l.id); haptic(); }} />
              ))}
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="onb-title">Where are you at?</h1>
            <p className="onb-sub">We'll set your sets & intensity to match.</p>
            <div className="stack gap-2">
              {LEVEL.map((l) => (
                <QuizRow key={l.id} item={l} on={a.level === l.id} onClick={() => { set("level", l.id); haptic(); }} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="onb-foot" style={{ padding: "12px 16px calc(12px + env(safe-area-inset-bottom))" }}>
        {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>Back</button>}
        <button className="btn btn-primary" style={{ flex: 1 }} disabled={!canNext} onClick={next}>
          {step < STEPS.length - 1 ? "Continue" : "Build my plan ⚡"}
        </button>
      </div>
    </div>
  );
}

function QuizRow({ item, on, onClick }) {
  return (
    <button className={`quiz-row ${on ? "on" : ""}`} onClick={onClick}>
      <span className="quiz-row-emoji">{item.emoji}</span>
      <span className="quiz-row-text">
        <span className="quiz-row-label">{item.label}</span>
        <span className="quiz-row-sub">{item.sub}</span>
      </span>
      {on && <span className="quiz-check">✓</span>}
    </button>
  );
}
