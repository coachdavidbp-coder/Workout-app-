import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import HowToVideo from "./HowToVideo.jsx";
import { beep, haptic } from "../lib/fx.js";
import { speak } from "../lib/voice.js";
import { totalSeconds } from "../lib/sequence.js";

// Guided warm-up / cool-down: shows the move you're on RIGHT NOW, how long
// it lasts, what's next, and counts the last few seconds down out loud.
//
// With `previewSteps`, each move opens on a ready screen — name, length, cue
// and the how-to video — and only starts counting when you tap Start. That
// suits stretching, where you want to see the shape before the clock runs.
//
// The clock runs off wall-time (an end timestamp), not a tick counter, so
// leaving the app and coming back shows the correct time instead of a frozen
// one. iOS still freezes JS in the background, so a notification fires when a
// step or the sequence finishes while the app isn't in front.
export default function SequenceTimer({
  title = "Warm-up",
  steps = [],
  accent = "warmup",
  voice = true,
  countdownFrom = 5,
  previewSteps = false,
  doneLabel = "Done",
  donePhase,
  doneNote,
  onComplete,
  onClose,
}) {
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(steps[0]?.seconds || 0);
  // preview → waiting on Start | running → counting | done → finished
  const [phase, setPhase] = useState(previewSteps ? "preview" : "running");

  const endAtRef = useRef(Date.now() + (steps[0]?.seconds || 0) * 1000);
  const idxRef = useRef(0);
  const spokeRef = useRef(-1);
  const tick = useRef(null);
  const wakeRef = useRef(null);

  const step = steps[idx] || steps[steps.length - 1] || { label: title, seconds: 0 };
  const next = steps[idx + 1] || null;
  const done = phase === "done";
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
    setPhase("done");
    beep(880, 0.5, 0.32);
    setTimeout(() => beep(1120, 0.55, 0.32), 240);
    haptic("success");
    try { navigator.vibrate?.([0, 240, 120, 240, 120, 360]); } catch (e) { /* ignore */ }
    if (voice) speak(accent === "warmup" ? "Warm-up done. Let's get to work." : "Nice work. All done.");
    notify(`${title} complete.`);
  };

  // Move to a step. With previews we stop on the ready screen first.
  const goTo = (to) => {
    if (to >= steps.length) { finishAll(); return; }
    idxRef.current = to;
    spokeRef.current = -1;
    setIdx(to);
    setRemaining(steps[to].seconds);
    beep(760, 0.16); haptic("medium");
    if (previewSteps) {
      setPhase("preview");
      if (voice) speak(`Next. ${steps[to].label}.`);
      notify(`Next: ${steps[to].label}`);
    } else {
      endAtRef.current = Date.now() + steps[to].seconds * 1000;
      setPhase("running");
      if (voice) speak(`Next. ${steps[to].label}. ${Math.round(steps[to].seconds / 5) * 5} seconds.`);
      notify(`Next: ${steps[to].label}`);
    }
  };

  const startStep = () => {
    endAtRef.current = Date.now() + remaining * 1000;
    setPhase("running");
    spokeRef.current = -1;
    beep(880, 0.14); haptic("success");
    if (voice) speak(`${step.label}. ${Math.round(step.seconds / 5) * 5} seconds. Go.`);
  };

  // wall-clock tick
  useEffect(() => {
    if (phase !== "running") return;
    const run = () => {
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(left);
      if (left <= countdownFrom && left > 0 && spokeRef.current !== left) {
        spokeRef.current = left;
        beep(700, 0.09, 0.28);
        haptic("light");
        if (voice) speak(String(left), { rate: 1.15 });
      }
      if (left <= 0) goTo(idxRef.current + 1);
    };
    tick.current = setInterval(run, 250);
    const onVis = () => { if (!document.hidden) run(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(tick.current); document.removeEventListener("visibilitychange", onVis); };
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const pause = () => {
    if (phase === "running") setPhase("paused");
    else { endAtRef.current = Date.now() + remaining * 1000; setPhase("running"); }
    haptic();
  };
  const skip = () => { haptic(); goTo(idxRef.current + 1); };
  const addTime = (s) => { endAtRef.current += s * 1000; setRemaining((r) => r + s); haptic(); };

  const pct = step.seconds ? 1 - remaining / step.seconds : 0;
  const preview = phase === "preview";

  return createPortal(
    <div className="timer-overlay">
      <div className={`itimer ${done ? "done" : accent} ${preview ? "previewing" : ""}`}>
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
        ) : preview ? (
          <>
            <div className="it-phase">Up next</div>
            <div className="seq-now">{step.label}</div>
            <div className="seq-len tnum">{fmt(step.seconds)}</div>
            {step.cue && <p className="seq-cue">{step.cue}</p>}
            {step.q && (
              <div className="seq-video">
                <HowToVideo query={step.q} title={`${step.label} how-to`} />
              </div>
            )}
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

        {!preview && <div className="it-progress"><span style={{ width: `${done ? 100 : pct * 100}%` }} /></div>}
        {!done && !preview && <div className="it-elapsed tnum">{fmt(overallLeft)} left of {fmt(total)}</div>}

        <div className="it-controls">
          {done ? (
            <button className="btn btn-primary it-main" onClick={() => { onComplete?.(); onClose(); }}>{doneLabel}</button>
          ) : preview ? (
            <>
              <button className="btn btn-primary it-main" onClick={startStep}>▶ Start · {fmt(step.seconds)}</button>
              <button className="btn" onClick={skip}>Skip ›</button>
            </>
          ) : (
            <>
              <button className="btn" onClick={pause}>{phase === "running" ? "Pause" : "Resume"}</button>
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
