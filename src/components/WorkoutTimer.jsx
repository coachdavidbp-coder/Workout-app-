import { useEffect, useRef, useState } from "react";
import { useStore } from "../store.jsx";
import { fmtDuration } from "../lib/progress.js";
import { speak, randomEncouragement, stopSpeaking } from "../lib/voice.js";
import { beep, haptic } from "../lib/fx.js";

// Stopwatch that records how long a workout took (saved to state.durations).
// Start runs a spoken 5-second countdown, then the clock; you can Pause/
// Resume, Restart (fresh countdown), or End (stop & save the final time).
// `startSignal` — when it increments (e.g. you open a lift), the timer
// auto-starts so total time + calories capture without tapping Start.
export default function WorkoutTimer({ week, dayId, voice = true, startSignal = 0 }) {
  const { state, actions } = useStore();
  const key = `w${week}-${dayId}`;
  const saved = state.durations?.[key] || 0;

  const [elapsed, setElapsed] = useState(saved);
  const [running, setRunning] = useState(false);
  const [countdown, setCountdown] = useState(0); // 0 = not counting; 5..1 while counting
  const tick = useRef(null);
  const cd = useRef(null);
  const elapsedRef = useRef(saved);

  // if the underlying saved value changes (day switch), resync & clear counts
  useEffect(() => {
    setElapsed(saved);
    elapsedRef.current = saved;
    setRunning(false);
    clearInterval(cd.current);
    setCountdown(0);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // auto-start when the user actually starts working (opens a lift, etc.)
  useEffect(() => {
    if (startSignal > 0) { clearInterval(cd.current); setCountdown(0); setRunning(true); }
  }, [startSignal]);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
      if (elapsedRef.current % 5 === 0) actions.setDuration(week, dayId, elapsedRef.current);
      // coach checks in mid-workout every 2.5 min
      if (voice && elapsedRef.current > 0 && elapsedRef.current % 150 === 0) {
        speak(randomEncouragement());
      }
    }, 1000);
    return () => clearInterval(tick.current);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => { clearInterval(cd.current); clearInterval(tick.current); }, []);

  // 5-4-3-2-1-Go countdown, then start the clock. fresh=true zeroes the time.
  const startCountdown = (fresh) => {
    clearInterval(cd.current);
    if (fresh) { elapsedRef.current = 0; setElapsed(0); actions.setDuration(week, dayId, 0); }
    setRunning(false);
    let n = 5;
    setCountdown(n);
    beep(600); haptic("light");
    if (voice) speak("5");
    cd.current = setInterval(() => {
      n -= 1;
      if (n > 0) {
        setCountdown(n);
        beep(600); haptic("light");
        if (voice) speak(String(n));
      } else {
        clearInterval(cd.current);
        setCountdown(0);
        beep(950, 0.3); haptic("success");
        if (voice) speak("Go!");
        setRunning(true);
      }
    }, 1000);
  };

  const cancelCountdown = () => { clearInterval(cd.current); setCountdown(0); };

  const toggle = () => {
    if (running) actions.setDuration(week, dayId, elapsedRef.current);
    setRunning((r) => !r);
  };

  const end = () => {
    clearInterval(cd.current); setCountdown(0);
    setRunning(false);
    actions.setDuration(week, dayId, elapsedRef.current);
    stopSpeaking();
    if (voice && elapsedRef.current > 0) speak("That's time. Great work.");
    haptic("success");
  };

  const counting = countdown > 0;
  const idle = !running && !counting && elapsed === 0;

  return (
    <div className={`wtimer ${running ? "run" : ""} ${counting ? "counting" : ""}`}>
      <div className="wt-left">
        <div className="wt-label">{counting ? "Get ready…" : "Workout time"}</div>
        <div className="wt-clock tnum">{counting ? countdown : fmtDuration(elapsed)}</div>
      </div>
      <div className="wt-controls">
        {counting ? (
          <button className="wt-go pause" onClick={cancelCountdown}>Cancel</button>
        ) : idle ? (
          <button className="wt-go" onClick={() => startCountdown(true)}>Start</button>
        ) : (
          <>
            <button className={`wt-go ${running ? "pause" : ""}`} onClick={toggle}>
              {running ? "Pause" : "Resume"}
            </button>
            <button className="wt-mini" onClick={() => startCountdown(true)}>Restart</button>
            <button className="wt-mini end" onClick={end}>End</button>
          </>
        )}
      </div>
    </div>
  );
}
