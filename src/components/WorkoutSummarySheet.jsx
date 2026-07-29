import Sheet from "./Sheet.jsx";
import { setsFor } from "../data/plans.js";
import { fmtDuration, fmtPace } from "../lib/progress.js";

const FEELS = ["😩", "😕", "🙂", "💪", "🔥"];

// End-of-workout recap: time, calories, every lift you logged (or your run
// stats), how it felt, and a closing line. Opened from the Train screen once
// the workout is marked complete.
export default function WorkoutSummarySheet({ open, onClose, state, week, dayId, day, sessionSec, estCals }) {
  if (!day) return null;
  const log = state.liftLogs?.[`w${week}-${dayId}`] || {};
  const runLog = state.runLogs?.[`w${week}-${dayId}`] || { intervals: [] };

  // ---- lift recap ----
  const exRows = (day.exercises || []).map((ex) => {
    const l = log.exercises?.[ex.name] || {};
    const reps = (l.reps || []).filter((r) => r !== "" && r != null);
    return { name: ex.name, target: setsFor(ex, week), weight: l.weight, reps };
  });
  const setsLogged = exRows.reduce((a, r) => a + r.reps.length, 0);
  const volume = exRows.reduce(
    (a, r) => a + (parseFloat(r.weight) || 0) * r.reps.reduce((s, x) => s + (parseFloat(x) || 0), 0),
    0
  );

  // ---- run recap ----
  const speeds = (runLog.intervals || []).map((i) => parseFloat(i.mph)).filter((n) => !isNaN(n));
  const top = speeds.length ? Math.max(...speeds) : null;
  const dist = parseFloat(runLog.distanceMi) || 0;
  const durSec = (parseInt(runLog.durMin) || 0) * 60 + (parseInt(runLog.durSec) || 0);
  const pace = dist > 0 && durSec > 0 ? durSec / 60 / dist : null;

  const feel = log.feel;

  return (
    <Sheet open={open} onClose={onClose}>
      <h3 className="sheet-title">Workout summary</h3>
      <div className="sheet-sub">{day.name} · Week {week}</div>

      <div className="session-summary" style={{ marginTop: 16 }}>
        <div className="summary-stat">
          <div className="k tnum">{fmtDuration(sessionSec)}</div>
          <div className="l">Total time</div>
        </div>
        <div className="summary-stat">
          <div className="k tnum" style={{ color: "var(--amber)" }}>{estCals}</div>
          <div className="l">Est. calories</div>
        </div>
        <div className="summary-stat">
          <div className="k tnum">{day.type === "cardio" ? (dist ? dist.toFixed(1) : "—") : setsLogged}</div>
          <div className="l">{day.type === "cardio" ? "Miles" : "Sets logged"}</div>
        </div>
      </div>

      {day.type === "lift" && (
        <>
          <div className="section-label" style={{ marginTop: 18 }}>Lifts</div>
          <div className="ex-card">
            {exRows.map((r) => (
              <div className="summary-ex" key={r.name}>
                <div className="se-name">{r.name}</div>
                <div className="se-val">
                  {r.weight ? `${r.weight} lb` : "—"}
                  {r.reps.length ? ` · ${r.reps.join("/")}` : ""}
                </div>
              </div>
            ))}
          </div>
          {volume > 0 && (
            <p className="summary-note">Total volume moved: <b>{Math.round(volume).toLocaleString()} lb</b></p>
          )}
        </>
      )}

      {day.type === "cardio" && (
        <>
          <div className="section-label" style={{ marginTop: 18 }}>Run</div>
          <div className="mini-stats">
            <div className="mini-stat"><div className="k">{pace ? fmtPace(pace).replace("/mi", "") : "—"}</div><div className="l">Pace /mi</div></div>
            <div className="mini-stat"><div className="k">{durSec ? fmtDuration(durSec) : "—"}</div><div className="l">Duration</div></div>
            <div className="mini-stat"><div className="k" style={{ color: "var(--ac-hi)" }}>{top ? top.toFixed(1) : "—"}</div><div className="l">Top MPH</div></div>
          </div>
        </>
      )}

      {feel && (
        <p className="summary-note" style={{ marginTop: 14 }}>
          How it felt: <span style={{ fontSize: 18 }}>{FEELS[feel - 1]}</span>
        </p>
      )}

      <p className="summary-closing">Logged and in the books. Recover, refuel, and come back for the next one. 💪</p>

      <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={onClose}>
        Close
      </button>
    </Sheet>
  );
}
