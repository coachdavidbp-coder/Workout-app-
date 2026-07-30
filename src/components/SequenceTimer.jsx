import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { beep, haptic } from "../lib/fx.js";
import { speak } from "../lib/voice.js";
import { totalSeconds } from "../lib/sequence.js";

// Guided warm-up / cool-down: shows the move you're on RIGHT NOW, how long
// it lasts, what's next, and counts the last few seconds down out loud.
//
// The clock runs off wall-time (an end timestamp), not a tick counter, so
// leaving the app and coming back shows the correct time instead of a frozen
// one. iOS still freezes JS in the background, so a notification fires on
// completion when the app isn't in front.
export default function SequenceTimer({
  title = "Warm-up",
  steps = [],
  accent = "warmup",
  voice = true,
  countdownFrom = 5,
  doneLabel = "Done",
  donePhase,
  doneNote,
  onComplete,
  onClose,
}) {
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(steps[0]?.seconds || 0);
  const [running, setRunning] = useState(true);
  const [done, setDone] = useState(false);

  const endAtRef = useRef(Date.now() + (steps[0]?.seconds || 0) * 1000);
  const idxRef = useRef(0);
  const spokeRef = useRef(-1);
  const tick = useRef(null);
  const wakeRef = useRef(null);

  const step = steps[idx] || steps[steps.length - 1] || { label: title, seconds: 0 };
  const next = steps[idx + 1] || null;
  const total = totalSeconds(steps);
  const elapsedBefore = steps.slice(0, idx).reduce((a, s) => a + s.seconds, 0);
  const overallLeft = Math.max(0, total - elapsedBefore - (step.seconds - remaining));

  useEffect(() => {
    (async () => {
      try { wakeRef.current = await navigator.wakeLock?.request("screen"); } catch (e) { /* ignore */ }
      try { if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission(); } catch (e) { /* ignore */ }
    })();
    return () => { try { wakeRef.current?.release(); } catch (e) { /* ignore */ } };
  }, []);

  const notify = (body) => {
    try {
      if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
        new Notification("US vs Them", { body, tag: "seq-timer", silent: false });
      }
    } catch (e) { /* ignore */ }
  };

  const finishAll = () => {
    setDone(true);
    setRunning(false);
    beep(880, 0.5, 0.32);
    setTimeout(() => beep(1120, 0.55, 0.32), 240);
    haptic("success");
    try { navigator.vibrate?.([0, 240, 120, 240, 120, 360]); } catch (e) { /* ignore */ }
    if (voice) speak(accent === "warmup" ? "Warm-up done. Let's get to work." : "Nice work. All done.");
    notify(`${title} complete.`);
  };

  const advance = (to) => {
    if (to >= steps.length) { finishAll(); return; }
    idxRef.current = to;
    spokeRef.current = -1;
    setIdx(to);
    setRemaining(steps[to].seconds);
    endAtRef.current = Date.now() + steps[to].seconds * 1000;
    beep(760, 0.16); haptic("medium");
    if (voice) speak(`Next. ${steps[to].label}. ${Math.round(steps[to].seconds / 5) * 5} seconds.`);
    notify(`Next: ${steps[to].label}`);
  };

  // wall-clock tick
  useEffect(() => {
    if (!running || done) return;
    const run = () => {
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= countdownFrom && left > 0 && spokeRef.current !== left) {
        spokeRef.current = left;
        beep(700, 0.09, 0.28);
        haptic("light");
        if (voice) speak(String(left), { rate: 1.15 });
      }
      if (left <= 0) advance(idxRef.current + 1);
    };
    tick.current = setInterval(run, 250);
    const onVis = () => { if (!document.hidden) run(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(tick.current); document.removeEventListener("visibilitychange", onVis); };
  }, [running, done]); // eslint-disable-line react-hooks/exhaustive-deps

  const pause = () => {
    if (running) { setRunning(false); }
    else { endAtRef.current = Date.now() + remaining * 1000; setRunning(true); }
    haptic();
  };
  const skip = () => { haptic(); advance(idxRef.current + 1); };
  const addTime = (s) => { endAtRef.current += s * 1000; setRemaining((r) => r + s); haptic(); };

  const pct = step.seconds ? 1 - remaining / step.seconds : 0;

  return createPortal(
    <div className="timer-overlay">
      <div className={`itimer ${done ? "done" : accent}`}>
        <div className="it-top">
          <button className="it-close" onClick={onClose} aria-label="Close">✕</button>
          <div className="it-round">{done ? title : `${title} · ${idx + 1}/${steps.length}`}</div>
          <span style={{ width: 40 }} />
        </div>

        {done ? (
          <>
            <div className="it-phase">{donePhase || "Complete"}</div>
            <div className="it-count tnum">✓</div>
            {doneNote && <div className="it-note">{doneNote}</div>}
          </>
        ) : (
          <>
            <div className="seq-now">{step.label}</div>
            <div className="it-count tnum">{fmt(remaining)}</div>
            {step.cue && <p className="seq-cue">{step.cue}</p>}
            <div className="seq-next">
              {next ? <>Next · <b>{next.label}</b> · {fmt(next.seconds)}</> : "Last one — finish strong."}
            </div>
          </>
        )}

        <div className="it-progress"><span style={{ width: `${done ? 100 : pct * 100}%` }} /></div>
        {!done && <div className="it-elapsed tnum">{fmt(overallLeft)} left of {fmt(total)}</div>}

        <div className="it-controls">
          {done ? (
            <button className="btn btn-primary it-main" onClick={() => { onComplete?.(); onClose(); }}>{doneLabel}</button>
          ) : (
            <>
              <button className="btn" onClick={pause}>{running ? "Pause" : "Resume"}</button>
              <button className="btn" onClick={() => addTime(30)}>+30s</button>
              <button className="btn btn-primary it-main" onClick={skip}>Skip ›</button>
            </>
          )}
        </div>

        {!done && (
          <div className="seq-list">
            {steps.map((s, i) => (
              <span key={i} className={`seq-pip ${i < idx ? "done" : i === idx ? "on" : ""}`} title={s.label} />
            ))}
          </div>
        )}

        {!done && <button className="rt-exit-bottom" onClick={onClose}>‹ Exit</button>}
      </div>
    </div>,
    document.body
  );
}

function fmt(s) {
  s = Math.max(0, Math.round(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
