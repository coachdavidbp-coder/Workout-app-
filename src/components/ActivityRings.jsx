import { useState } from "react";
import { useStore } from "../store.jsx";
import { activityRings, SCOPES } from "../lib/activity.js";
import { haptic } from "../lib/fx.js";

// Apple-Fitness-style triple ring: Move / Exercise / Workouts,
// with Day · Week · Month · All scopes.
export default function ActivityRings() {
  const { state } = useStore();
  const [scope, setScope] = useState("day");
  const data = activityRings(state, scope);
  const paced = scope !== "all";

  return (
    <div className="rings-card">
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
        <TripleRing rings={data.rings} allClosed={data.allClosed} />

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
    </div>
  );
}

function TripleRing({ rings, allClosed }) {
  const R = [82, 60, 38];
  const SW = 17;
  return (
    <svg className={`triple-ring ${allClosed ? "glow" : ""}`} viewBox="0 0 200 200">
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
              strokeDashoffset={c * (1 - Math.min(1, r.pct))}
              transform="rotate(-90 100 100)"
              style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.2,0.9,0.3,1)" }}
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
