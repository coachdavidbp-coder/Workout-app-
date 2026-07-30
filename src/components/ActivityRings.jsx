import { useState } from "react";
import { useStore } from "../store.jsx";
import { activityRings, SCOPES } from "../lib/activity.js";
import GoalWizardSheet from "./GoalWizardSheet.jsx";
import { useMountedFlag } from "../lib/anim.js";
import { haptic } from "../lib/fx.js";
import Lottie from "./Lottie.jsx";
import checkAnim from "../data/lottie/check.json";

// Triple activity ring: Move / Exercise / Workouts, with
// Day · Week · Month · All scopes and a goal recommender.
export default function ActivityRings() {
  const { state } = useStore();
  const [scope, setScope] = useState("day");
  const [goalsOpen, setGoalsOpen] = useState(false);
  const data = activityRings(state, scope);
  const paced = scope !== "all";

  return (
    <div className="rings-card">
      <div className="rings-head">
        <span className="rings-goals-lab">
          Goals · {data.dailyGoals.move} cal · {data.dailyGoals.exercise} min
        </span>
        <button className="rings-goals-btn" onClick={() => { haptic(); setGoalsOpen(true); }}>
          Set goals
        </button>
      </div>

      <div className="rings-seg">
        {SCOPES.map((s) => (
          <button
            key={s.id}
            className={`rseg ${scope === s.id ? "on" : ""}`}
            onClick={() => { setScope(s.id); haptic(); }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="rings-body">
        <div className="ring-wrap">
          <TripleRing rings={data.rings} allClosed={data.allClosed} />
          {/* Closing all three is the day's win — mark it in the middle of
              the rings rather than only in the line underneath. */}
          {data.allClosed && <Lottie data={checkAnim} size={72} className="ring-check" />}
        </div>

        <div className="rings-legend">
          {data.rings.map((r) => (
            <div className="rleg" key={r.id}>
              <div className="rleg-top">
                <span className="rleg-dot" style={{ background: r.color }} />
                <span className="rleg-label">{r.label}</span>
              </div>
              {paced ? (
                <div className="rleg-val" style={{ color: r.color }}>
                  {r.value.toLocaleString()}
                  <span className="rleg-goal">/{r.goal.toLocaleString()}{r.unit ? ` ${r.unit}` : ""}</span>
                </div>
              ) : (
                <div className="rleg-val" style={{ color: r.color }}>
                  {r.value.toLocaleString()}
                  <span className="rleg-goal">{r.unit ? ` ${r.unit}` : ""} total</span>
                </div>
              )}
              <div className="rleg-sub">
                {paced
                  ? `${Math.round(r.pct * 100)}%${data.days > 1 ? ` · closed ${r.closedDays}/${data.days}d` : ""}`
                  : `closed ${r.closedDays} of ${data.days} days`}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rings-foot">
        {scope === "day" && (data.allClosed ? "🏆 All three rings closed today." : "Close all three to bank the day.")}
        {scope === "week" && `${data.activeDays} active day${data.activeDays === 1 ? "" : "s"} this week · goals scale as the week goes.`}
        {scope === "month" && `${data.activeDays} active day${data.activeDays === 1 ? "" : "s"} this month · best burn ${data.bestMove} cal.`}
        {scope === "all" && `Since ${fmt(data.trackedFrom)} · ${data.activeDays} active days out of ${data.days}.`}
      </div>

      <GoalWizardSheet open={goalsOpen} onClose={() => setGoalsOpen(false)} />
    </div>
  );
}

export function TripleRing({ rings, allClosed, className = "" }) {
  const R = [82, 60, 38];
  const SW = 17;
  // Fill from empty on mount rather than snapping to the final value.
  const grown = useMountedFlag();
  return (
    <svg className={`triple-ring ${className} ${allClosed ? "glow" : ""}`} viewBox="0 0 200 200">
      {rings.map((r, i) => {
        const rad = R[i];
        const c = 2 * Math.PI * rad;
        return (
          <g key={r.id}>
            <circle cx="100" cy="100" r={rad} fill="none" stroke={r.color} strokeWidth={SW} opacity="0.18" />
            <circle
              cx="100" cy="100" r={rad} fill="none"
              stroke={r.color} strokeWidth={SW} strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - (grown ? Math.min(1, r.pct) : 0))}
              transform="rotate(-90 100 100)"
              style={{ transition: `stroke-dashoffset .9s cubic-bezier(.2,.9,.3,1) ${i * 0.09}s` }}
            />
          </g>
        );
      })}
    </svg>
  );
}

function fmt(key) {
  try {
    return new Date(key + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch (e) { return key; }
}
