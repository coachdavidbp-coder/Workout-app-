import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import HowToVideo from "./HowToVideo.jsx";
import { beep, haptic } from "../lib/fx.js";
import { speak } from "../lib/voice.js";
import { subscribeSession } from "../lib/sessionClock.js";

// One runner for the whole guided part of a session.
//
// It takes *blocks* — stretch, then warm-up, then the yoga at the end — and
// walks them end to end without ever handing you back to a list with another
// Start button on it. Between blocks it pauses on a handoff card so you know
// what just finished and what's coming, then carries straight on.
//
// The "left of" figure counts every step in every block, so the number on
// screen is how much guided work is left in the session, not how much is left
// of whichever block you happen to be in.
//
// A block with `previewSteps` opens each move on a ready screen — name,
// length, cue and the how-to video — and only counts down when you tap Start.
// That suits stretching, where you want to see the shape first.
//
// The clock runs off wall-time (an end timestamp), not a tick counter, so
// leaving the app and coming back shows the correct time instead of a frozen
// one. iOS still freezes JS in the background, so a notification fires when a
// step or a block finishes while the app isn't in front.
export default function SequenceTimer({
  blocks = [],
  voice = true,
  doneLabel = "Done",
  donePhase,
  doneNote,
  onComplete,
  onClose,
}) {
  // The one session clock, mirrored here so a guided block doesn't look
  // like a separate timer running alongside the workout.
  const [session, setSession_] = useState(0);
  useEffect(() => subscribeSession((sec) => setSession_(sec)), []);

  const list = blocks.filter((b) => b && (b.steps || []).length);
  const first = list[0] || { title: "", steps: [], accent: "warmup" };

  const [bi, setBi] = useState(0);
  const [idx, setIdx] = useState(0);
  // showing → untimed, move on when you're ready | preview → waiting on Start
  // running | paused | handoff → between blocks | done
  const [phase, setPhase] = useState(
    first.untimed ? "showing" : first.previewSteps ? "preview" : "running"
  );
  const [remaining, setRemaining] = useState(first.steps[0]?.seconds || 0);

  const at = useRef({ bi: 0, idx: 0 });
  const endAtRef = useRef(Date.now() + (first.steps[0]?.seconds || 0) * 1000);
  const spokeRef = useRef(-1);
  const tick = useRef(null);
  const wakeRef = useRef(null);

  const block = list[bi] || first;
  const steps = block.steps || [];
  const step = steps[idx] || steps[steps.length - 1] || { label: block.title, seconds: 0 };
  const next = steps[idx + 1] || null;
  const nextBlock = list[bi + 1] || null;
  const done = phase === "done";
  const handoff = phase === "handoff";
  const preview = phase === "preview";
  const showing = phase === "showing";
  const untimed = !!block.untimed;
  const countdownFrom = block.countdownFrom ?? 5;

  // Time left across the whole run. Untimed blocks are left out of both
  // numbers — a move you do at your own pace has no length to count down, and
  // folding a made-up one in would make the total a lie.
  const secs = (arr) => arr.reduce((a, s) => a + s.seconds, 0);
  const timedOf = (bs) => bs.filter((b) => !b.untimed).flatMap((b) => b.steps);
  const total = secs(timedOf(list));
  const behind =
    secs(timedOf(list.slice(0, bi))) + (untimed ? 0 : secs(steps.slice(0, idx)));
  const overallLeft = Math.max(0, total - behind - (untimed ? 0 : step.seconds - remaining));
  const laterTimed = secs(timedOf(list.slice(bi + 1)));

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
    if (voice) speak("That's the whole thing. Nice work.");
    notify("Session block complete.");
  };

  // Land on a step. With previews we stop on the ready screen first.
  const land = (b, i) => {
    at.current = { bi: b, idx: i };
    spokeRef.current = -1;
    setBi(b);
    setIdx(i);
    const s = list[b].steps[i];
    setRemaining(s.seconds);
    beep(760, 0.16); haptic("medium");
    if (list[b].untimed) {
      setPhase("showing");
      if (voice) speak(`Next. ${s.label}.`);
    } else if (list[b].previewSteps) {
      setPhase("preview");
      if (voice) speak(`Next. ${s.label}.`);
    } else {
      endAtRef.current = Date.now() + s.seconds * 1000;
      setPhase("running");
      if (voice) speak(`Next. ${s.label}. ${Math.round(s.seconds / 5) * 5} seconds.`);
    }
    notify(`Next: ${s.label}`);
  };

  // End of a step: next step, next block, or done.
  const advance = () => {
    const { bi: b, idx: i } = at.current;
    if (i + 1 < list[b].steps.length) { land(b, i + 1); return; }
    if (b + 1 < list.length) {
      setPhase("handoff");
      beep(880, 0.34, 0.3);
      haptic("success");
      if (voice) speak(`${list[b].title} done. ${list[b + 1].title} next.`);
      notify(`${list[b].title} done — ${list[b + 1].title} next.`);
      return;
    }
    finishAll();
  };

  const startStep = () => {
    endAtRef.current = Date.now() + remaining * 1000;
    setPhase("running");
    spokeRef.current = -1;
    beep(880, 0.14); haptic("success");
    if (voice) speak(`${step.label}. ${Math.round(step.seconds / 5) * 5} seconds. Go.`);
  };

  const continueOn = () => { haptic(); land(at.current.bi + 1, 0); };

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
      if (left <= 0) advance();
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
  const skip = () => { haptic(); advance(); };
  const addTime = (s) => { endAtRef.current += s * 1000; setRemaining((r) => r + s); haptic(); };

  const pct = step.seconds ? 1 - remaining / step.seconds : 0;
  const timed = !done && !handoff && !preview && !showing;

  if (!list.length) return null;

  return createPortal(
    <div className="timer-overlay">
      <div className={`itimer ${done ? "done" : block.accent || "warmup"} ${preview ? "previewing" : ""}`}>
        <div className="it-top">
          <button className="it-close" onClick={onClose} aria-label="Close">✕</button>
          <div className="it-round">
            {done ? "Session" : handoff ? block.title : `${block.title} · ${idx + 1}/${steps.length}`}
          </div>
          <span className="it-session tnum">{session > 0 ? fmt(session) : ""}</span>
        </div>

        {done ? (
          <>
            <div className="it-phase">{donePhase || "Complete"}</div>
            <div className="it-count tnum">✓</div>
            {doneNote && <div className="it-note">{doneNote}</div>}
          </>
        ) : handoff ? (
          <>
            <div className="it-phase">{block.title} done</div>
            <div className="it-count tnum">✓</div>
            {block.doneNote && <div className="it-note">{block.doneNote}</div>}
            <div className="seq-next">
              Next up · <b>{nextBlock.title}</b> · {fmt(secs(nextBlock.steps))}
            </div>
          </>
        ) : showing ? (
          // No clock on this one. It's the move, how to do it, and the video —
          // you go at your own pace and tap on when you're done.
          <>
            <div className="seq-now">{step.label}</div>
            {step.cue && <p className="seq-cue">{step.cue}</p>}
            {(step.video || step.q) && (
              <div className="seq-video">
                <HowToVideo videoId={step.video} slug={step.label} query={step.q} title={`${step.label} how-to`} />
              </div>
            )}
            <div className="seq-next">
              {next
                ? <>Next · <b>{next.label}</b></>
                : nextBlock
                  ? <>Last one — <b>{nextBlock.title}</b> after this.</>
                  : "Last one — finish strong."}
            </div>
          </>
        ) : preview ? (
          <>
            <div className="it-phase">Up next</div>
            <div className="seq-now">{step.label}</div>
            <div className="seq-len tnum">{fmt(step.seconds)}</div>
            {step.cue && <p className="seq-cue">{step.cue}</p>}
            {(step.video || step.q) && (
              <div className="seq-video">
                <HowToVideo videoId={step.video} slug={step.label} query={step.q} title={`${step.label} how-to`} />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="seq-now">{step.label}</div>
            <div className="it-count tnum">{fmt(remaining)}</div>
            {step.cue && <p className="seq-cue">{step.cue}</p>}
            <div className="seq-next">
              {next
                ? <>Next · <b>{next.label}</b> · {fmt(next.seconds)}</>
                : nextBlock
                  ? <>Last of the {block.title.toLowerCase()} — <b>{nextBlock.title}</b> after this.</>
                  : "Last one — finish strong."}
            </div>
          </>
        )}

        {timed && <div className="it-progress"><span style={{ width: `${pct * 100}%` }} /></div>}
        {/* The handoff card already names what's next and how long it is. */}
        {!done && !handoff && (
          <div className="it-elapsed tnum">
            {untimed
              ? laterTimed > 0
                ? `${idx + 1} of ${steps.length} · ${fmt(laterTimed)} timed after this`
                : `${idx + 1} of ${steps.length}`
              : `${fmt(overallLeft)} left of ${fmt(total)}`}
          </div>
        )}

        <div className="it-controls">
          {done ? (
            <button className="btn btn-primary it-main" onClick={() => { onComplete?.(); onClose(); }}>{doneLabel}</button>
          ) : handoff ? (
            <button className="btn btn-primary it-main" onClick={continueOn}>
              {nextBlock.title} ▶
            </button>
          ) : showing ? (
            <button className="btn btn-primary it-main" onClick={skip}>
              {next || nextBlock ? "Next ›" : "Finish ›"}
            </button>
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
            {list.map((b, j) => (
              <span key={j} className={`seq-group ${j === bi ? "on" : ""}`} title={b.title}>
                {b.steps.map((s, i) => {
                  // On the handoff card the block is finished, so its last
                  // step should read done rather than still-in-progress.
                  const past = j < bi || (j === bi && (handoff || i < idx));
                  const here = j === bi && i === idx && !handoff;
                  return <span key={i} className={`seq-pip ${past ? "done" : here ? "on" : ""}`} title={s.label} />;
                })}
              </span>
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
