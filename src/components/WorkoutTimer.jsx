import { useEffect, useRef, useState } from "react";
import { useStore } from "../store.jsx";
import { fmtDuration } from "../lib/progress.js";

// Stopwatch that records how long a workout took (saved to state.durations).
export default function WorkoutTimer({ week, dayId }) {
  const { state, actions } = useStore();
  const key = `w${week}-${dayId}`;
  const saved = state.durations?.[key] || 0;

  const [elapsed, setElapsed] = useState(saved);
  const [running, setRunning] = useState(false);
  const tick = useRef(null);
  const elapsedRef = useRef(saved);

  // if the underlying saved value changes (day switch), resync
  useEffect(() => {
    setElapsed(saved);
    elapsedRef.current = saved;
    setRunning(false);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current % 5 === 0) actions.setDuration(week, dayId, elapsedRef.current);
    }, 1000);
    return () => clearInterval(tick.current);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = () => {
    if (running) actions.setDuration(week, dayId, elapsedRef.current);
    setRunning((r) => !r);
  };
  const reset = () => {
    setRunning(false);
    elapsedRef.current = 0;
    setElapsed(0);
    actions.setDuration(week, dayId, 0);
  };

  return (
    <div className={`wtimer ${running ? "run" : ""}`}>
      <div className="wt-left">
        <div className="wt-label">Workout time</div>
        <div className="wt-clock tnum">{fmtDuration(elapsed)}</div>
      </div>
      <div className="wt-controls">
        <button className={`wt-go ${running ? "pause" : ""}`} onClick={toggle}>
          {running ? "Pause" : elapsed ? "Resume" : "Start"}
        </button>
        {elapsed > 0 && !running && (
          <button className="wt-reset" onClick={reset} aria-label="Reset timer">
            ↺
          </button>
        )}
      </div>
    </div>
  );
}
