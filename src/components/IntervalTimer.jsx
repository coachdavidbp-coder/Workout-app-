import { useEffect, useRef, useState } from "react";

// Interval countdown for the day's protocol: N rounds of work + rest.
// Short beeps (Web Audio) duck background music rather than stopping it,
// plus vibration. Sound is toggleable.
export default function IntervalTimer({ rounds, work, rest, workLabel = "Work", onClose }) {
  const phases = buildPhases(rounds, work, rest);
  const total = phases.reduce((a, p) => a + p.dur, 0);

  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(phases[0]?.dur || 0);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [sound, setSound] = useState(true);
  const remRef = useRef(remaining);
  const idxRef = useRef(0);
  const tick = useRef(null);
  const audioRef = useRef(null);
  const wakeRef = useRef(null);

  const cur = phases[idx] || phases[phases.length - 1];
  const elapsed = phases.slice(0, idx).reduce((a, p) => a + p.dur, 0) + (cur.dur - remaining);

  // ---- audio + haptics ----
  const beep = (freq, dur = 0.12) => {
    if (!sound) return;
    try {
      const ctx = audioRef.current;
      if (!ctx) return;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      o.type = "sine";
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + dur);
    } catch (e) { /* ignore */ }
  };
  const buzz = (ms) => { try { navigator.vibrate?.(ms); } catch (e) { /* ignore */ } };

  const cue = (kind) => {
    if (kind === "work") { beep(880); buzz([0, 80, 60, 80]); }
    else if (kind === "rest") { beep(440); buzz(120); }
    else if (kind === "end") { beep(660, 0.5); buzz([0, 200, 100, 200]); }
    else beep(600, 0.05);
  };

  async function ensureAudio() {
    if (!audioRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioRef.current = new AC();
    }
    try { await audioRef.current?.resume(); } catch (e) { /* ignore */ }
  }
  async function requestWake() {
    try { wakeRef.current = await navigator.wakeLock?.request("screen"); } catch (e) { /* ignore */ }
  }
  function releaseWake() { try { wakeRef.current?.release(); wakeRef.current = null; } catch (e) { /* ignore */ } }

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => {
      remRef.current -= 1;
      if (remRef.current > 0) {
        setRemaining(remRef.current);
        if (remRef.current <= 3) cue("count");
        return;
      }
      // advance
      const next = idxRef.current + 1;
      if (next >= phases.length) {
        clearInterval(tick.current);
        setRunning(false);
        setDone(true);
        setRemaining(0);
        cue("end");
        releaseWake();
        return;
      }
      idxRef.current = next;
      remRef.current = phases[next].dur;
      setIdx(next);
      setRemaining(phases[next].dur);
      cue(phases[next].kind);
    }, 1000);
    return () => clearInterval(tick.current);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => releaseWake(), []);

  const start = async () => {
    await ensureAudio();
    await requestWake();
    if (done) reset();
    cue(cur.kind);
    setRunning(true);
  };
  const pause = () => { setRunning(false); releaseWake(); };
  const skip = () => {
    const next = idxRef.current + 1;
    if (next >= phases.length) { setDone(true); setRunning(false); return; }
    idxRef.current = next; remRef.current = phases[next].dur;
    setIdx(next); setRemaining(phases[next].dur);
  };
  const reset = () => {
    setRunning(false);
    idxRef.current = 0; remRef.current = phases[0].dur;
    setIdx(0); setRemaining(phases[0].dur); setDone(false);
  };

  const isWork = cur.kind === "work";
  const pct = cur.dur ? 1 - remaining / cur.dur : 0;

  return (
    <div className={`itimer ${done ? "done" : isWork ? "work" : "rest"}`}>
      <div className="it-top">
        <button className="it-close" onClick={onClose} aria-label="Close timer">✕</button>
        <div className="it-round">
          Round {Math.min(cur.round, rounds)} / {rounds}
        </div>
        <button className="it-sound" onClick={() => setSound((s) => !s)} aria-label="Toggle sound">
          {sound ? "🔊" : "🔇"}
        </button>
      </div>

      <div className="it-phase">{done ? "Finished" : isWork ? workLabel : "Recover"}</div>
      <div className="it-count tnum">{done ? "✓" : fmt(remaining)}</div>

      <div className="it-progress"><span style={{ width: `${done ? 100 : pct * 100}%` }} /></div>
      <div className="it-elapsed tnum">{fmt(elapsed)} / {fmt(total)}</div>

      <div className="it-controls">
        {!done && (
          <button className="btn" onClick={skip}>Skip</button>
        )}
        <button className="btn btn-primary it-main" onClick={running ? pause : start}>
          {done ? "Restart" : running ? "Pause" : elapsed > 0 ? "Resume" : "Start"}
        </button>
        {!running && elapsed > 0 && !done && (
          <button className="btn" onClick={reset}>Reset</button>
        )}
      </div>
    </div>
  );
}

function buildPhases(rounds, work, rest) {
  const p = [];
  for (let r = 1; r <= rounds; r++) {
    p.push({ kind: "work", dur: work, round: r });
    if (r < rounds && rest) p.push({ kind: "rest", dur: rest, round: r });
  }
  return p.length ? p : [{ kind: "work", dur: work || 30, round: 1 }];
}

function fmt(s) {
  s = Math.max(0, Math.round(s));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
