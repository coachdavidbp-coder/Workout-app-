import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { beep, haptic } from "../lib/fx.js";
import { speak } from "../lib/voice.js";

// Full-screen countdown used for Rest and Warm-up. Auto-starts, ticks the
// last 3 seconds, then BUZZES (long tone + strong vibration) at zero so you
// know to move without watching the screen. X closes it; a done button runs
// an optional follow-up action (e.g. start the workout after a warm-up).
// Rendered through a portal so it overlays the tab bar and any open sheet.
export default function CountdownTimer({
  label = "Rest",
  seconds = 60,
  accent = "rest",          // rest | warmup
  voice = false,
  doneLabel = "Done",
  onComplete,               // fired when the done button is tapped
  onClose,
}) {
  const [total, setTotal] = useState(seconds);
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);
  const remRef = useRef(seconds);
  const tick = useRef(null);
  const wakeRef = useRef(null);

  // keep the screen awake during the countdown
  useEffect(() => {
    (async () => { try { wakeRef.current = await navigator.wakeLock?.request("screen"); } catch (e) { /* ignore */ } })();
    return () => { try { wakeRef.current?.release(); } catch (e) { /* ignore */ } };
  }, []);

  const buzzer = () => {
    // long two-tone buzzer + strong haptic — the "get moving" signal
    beep(880, 0.5, 0.32);
    setTimeout(() => beep(1120, 0.55, 0.32), 240);
    haptic("success");
    try { navigator.vibrate?.([0, 240, 120, 240, 120, 360]); } catch (e) { /* ignore */ }
    if (voice) speak(accent === "warmup" ? "Warm-up done. Let's get to work." : "Time. Back to it.");
  };

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      remRef.current -= 1;
      if (remRef.current > 0) {
        setRemaining(remRef.current);
        if (remRef.current <= 3) { beep(700, 0.09, 0.28); haptic("light"); }
        return;
      }
      clearInterval(tick.current);
      setRemaining(0);
      setRunning(false);
      setDone(true);
      buzzer();
    }, 1000);
    return () => clearInterval(tick.current);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const addTime = (s) => {
    remRef.current += s;
    setTotal((t) => Math.max(t, remRef.current));
    setRemaining(remRef.current);
    if (done) { setDone(false); setRunning(true); }
  };

  const skipToEnd = () => {
    clearInterval(tick.current);
    remRef.current = 0;
    setRemaining(0);
    setRunning(false);
    setDone(true);
    buzzer();
  };

  const finish = () => { onComplete?.(); onClose(); };

  const pct = total ? 1 - remaining / total : 0;

  return createPortal(
    <div className="timer-overlay">
      <div className={`itimer ${done ? "done" : accent}`}>
        <div className="it-top">
          <button className="it-close" onClick={onClose} aria-label="Close timer">✕</button>
          <div className="it-round">{label}</div>
          <span style={{ width: 40 }} />
        </div>

        <div className="it-phase">{done ? "Done" : label}</div>
        <div className="it-count tnum">{done ? "✓" : fmt(remaining)}</div>

        <div className="it-progress"><span style={{ width: `${done ? 100 : pct * 100}%` }} /></div>

        <div className="it-controls">
          {!done ? (
            <>
              <button className="btn" onClick={() => setRunning((r) => !r)}>{running ? "Pause" : "Resume"}</button>
              <button className="btn" onClick={() => addTime(30)}>+30s</button>
              <button className="btn btn-primary it-main" onClick={skipToEnd}>Skip</button>
            </>
          ) : (
            <button className="btn btn-primary it-main" onClick={finish}>{doneLabel}</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function fmt(s) {
  s = Math.max(0, Math.round(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
