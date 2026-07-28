import { useState } from "react";
import { useStore } from "../store.jsx";
import BrandLogo from "../components/BrandLogo.jsx";
import RunTracker from "../components/RunTracker.jsx";
import RouteMiniMap from "../components/RouteMiniMap.jsx";
import { IconRun } from "../components/icons.jsx";
import { fmtDuration, fmtPace, runningSummary } from "../lib/progress.js";
import { haptic } from "../lib/fx.js";

const fmtLong = (d) =>
  new Date(d + "T00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

export default function RunScreen() {
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const summary = runningSummary(state);
  const outdoor = [...summary.runs].reverse().filter((r) => r.outdoor);

  return (
    <div className="scroll">
      <header className="train-head">
        <div className="brandrow">
          <BrandLogo height={24} />
          <span className="mode-badge">🏃 GPS</span>
        </div>
        <div className="h-title">
          <div className="kicker">Outdoor</div>
          <h1>Go for a Run</h1>
        </div>
      </header>

      <main className="content">
        <div className="run-hero">
          <div className="run-hero-ico"><IconRun width="34" height="34" /></div>
          <div className="run-hero-txt">
            <div className="rh-k">Run or walk with live GPS</div>
            <div className="rh-s">Your route on a map, real-time pace, mile splits and voice callouts.</div>
          </div>
        </div>

        <button className="btn btn-primary btn-block run-start-btn" onClick={() => { haptic("success"); setOpen(true); }}>
          ▶ Start run / walk
        </button>

        <div className="mini-stats" style={{ marginTop: 14 }}>
          <div className="mini-stat">
            <div className="k" style={{ color: "var(--good)" }}>{summary.totalDistance.toFixed(1)}</div>
            <div className="l">Total miles</div>
          </div>
          <div className="mini-stat">
            <div className="k">{summary.bestPace ? fmtPace(summary.bestPace).replace("/mi", "") : "—"}</div>
            <div className="l">Best pace /mi</div>
          </div>
          <div className="mini-stat">
            <div className="k" style={{ color: "var(--ac-hi)" }}>{summary.topSpeed ? summary.topSpeed.toFixed(1) : "—"}</div>
            <div className="l">Top mph</div>
          </div>
        </div>

        <div className="section-title">Recent outdoor runs</div>
        {outdoor.length === 0 ? (
          <div className="empty-hint">No outdoor runs yet. Tap <b>Start run / walk</b> and head outside — your route and splits will show up here.</div>
        ) : (
          <div className="run-cards">
            {outdoor.slice(0, 8).map((r) => (
              <div className="run-card" key={`${r.date}-${r.dayId}`}>
                <div className="rc-top">
                  <div className="rc-when">{r.mode === "Walk" ? "🚶" : "🏃"} {fmtLong(r.date)}</div>
                  <div className="rc-dist tnum">{r.distanceMi ? `${r.distanceMi} mi` : "—"}</div>
                </div>
                <div className="rc-meta">
                  {r.durationSec ? fmtDuration(r.durationSec) : "—"}
                  {r.pace ? ` · ${fmtPace(r.pace)}` : ""}
                  {r.topMph ? ` · ${parseFloat(r.topMph).toFixed(1)} mph top` : ""}
                </div>
                {Array.isArray(r.route) && r.route.length > 1 && <RouteMiniMap route={r.route} />}
              </div>
            ))}
          </div>
        )}
      </main>

      {open && <RunTracker onClose={() => setOpen(false)} />}
    </div>
  );
}
