import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useStore, todayKey } from "../store.jsx";
import { fmtDuration, fmtPace } from "../lib/progress.js";
import { bodyweight } from "../lib/gamify.js";
import { beep, haptic } from "../lib/fx.js";
import { speak } from "../lib/voice.js";
import { toast } from "../lib/toast.js";

const M_PER_MI = 1609.344;
const STOP_AFTER = 10;      // seconds without moving → auto-pause
const MOVING_MS = 0.7;      // m/s that counts as "moving again"

// "9 minutes 40" style spoken time for mile callouts.
function spokenTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m <= 0) return `${s} second${s === 1 ? "" : "s"}`;
  return `${m} minute${m === 1 ? "" : "s"} ${s}`;
}

// Trim a route to at most `max` points so it stays light in storage.
function downsample(pts, max = 300) {
  if (pts.length <= max) return pts;
  const step = pts.length / max;
  const out = [];
  for (let i = 0; i < pts.length; i += step) out.push(pts[Math.floor(i)]);
  if (out[out.length - 1] !== pts[pts.length - 1]) out.push(pts[pts.length - 1]);
  return out;
}

function haversine(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Live GPS run/walk tracker with an OpenStreetMap route. Tracks while the
// screen is on and the app is in the foreground (a web-app limit — we hold a
// wake lock to keep the screen awake). Saves the run into history on finish.
export default function RunTracker({ onClose }) {
  const { state, actions } = useStore();

  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const lineRef = useRef(null);
  const markRef = useRef(null);
  const watchRef = useRef(null);
  const wakeRef = useRef(null);
  const tick = useRef(null);

  const lastRef = useRef(null);   // last accepted GPS point
  const distRef = useRef(0);      // meters
  const durRef = useRef(0);       // seconds
  const maxSpeedRef = useRef(0);  // mph
  const splitRef = useRef({ nextMi: 1, lastT: 0 });
  const routeRef = useRef([]);    // [[lat,lng], ...] accepted points
  const lastMoveRef = useRef(0);  // ts of last real movement
  const autoPausedRef = useRef(false);
  const statusRef = useRef("idle");

  const voiceOn = state.settings?.voice !== false;

  const [mode, setMode] = useState("Run");   // Run | Walk
  const [status, setStatus] = useState("idle"); // idle | tracking | paused | done
  const [autoPaused, setAutoPaused] = useState(false);
  const [dist, setDist] = useState(0);
  const [dur, setDur] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [splits, setSplits] = useState([]);
  const [err, setErr] = useState("");
  const [gpsReady, setGpsReady] = useState(false);
  statusRef.current = status;

  const miles = dist / M_PER_MI;
  const pace = miles > 0.01 && dur > 0 ? dur / 60 / miles : null;
  const avgMph = dur > 0 ? miles / (dur / 3600) : 0;

  // ---- map init ----
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, { zoomControl: false, attributionControl: true }).setView([39.5, -98.35], 4);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);
    lineRef.current = L.polyline([], { color: "#4C8DFF", weight: 5, opacity: 0.9 }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 120);
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ---- geolocation watch (starts immediately to center the map) ----
  useEffect(() => {
    if (!("geolocation" in navigator)) { setErr("GPS isn't available on this device."); return; }
    watchRef.current = navigator.geolocation.watchPosition(onPos, onGeoErr, {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 20000,
    });
    return () => { if (watchRef.current != null) navigator.geolocation.clearWatch(watchRef.current); };
  }, []);

  // ---- duration timer + auto-pause watchdog ----
  useEffect(() => {
    tick.current = setInterval(() => {
      if (statusRef.current !== "tracking") return;
      if (autoPausedRef.current) return; // stopped — don't count time
      durRef.current += 1;
      setDur(durRef.current);
      // no movement for a while → auto-pause the clock
      if (Date.now() - lastMoveRef.current > STOP_AFTER * 1000) {
        autoPausedRef.current = true;
        setAutoPaused(true);
        beep(420, 0.1); haptic("light");
      }
    }, 1000);
    return () => clearInterval(tick.current);
  }, []);

  useEffect(() => () => { try { wakeRef.current?.release(); } catch (e) { /* ignore */ } }, []);

  function onGeoErr(e) {
    if (e.code === 1) setErr("Location permission denied. Enable it for this site in your browser settings to track your route.");
    else setErr("Getting a GPS signal… head outside for a clearer fix.");
  }

  function onPos(pos) {
    const { latitude: lat, longitude: lng, accuracy, speed: gpsSpeed } = pos.coords;
    setGpsReady(true);
    setErr("");
    const p = { lat, lng, t: Date.now() };

    // always keep the map centered on you + a location dot
    if (mapRef.current) {
      const z = mapRef.current.getZoom();
      mapRef.current.setView([lat, lng], z < 15 ? 17 : z);
      if (!markRef.current) {
        markRef.current = L.circleMarker([lat, lng], { radius: 7, color: "#fff", weight: 2, fillColor: "#4C8DFF", fillOpacity: 1 }).addTo(mapRef.current);
      } else {
        markRef.current.setLatLng([lat, lng]);
      }
    }

    if (gpsSpeed != null && gpsSpeed >= 0) {
      const mph = gpsSpeed * 2.2369;
      setSpeed(mph);
      if (mph > maxSpeedRef.current) maxSpeedRef.current = mph;
      // GPS reports real speed → treat as moving (fast auto-resume)
      if (gpsSpeed > MOVING_MS && statusRef.current === "tracking") resumeFromAuto();
    }

    if (statusRef.current !== "tracking") { lastRef.current = p; return; }
    if (accuracy && accuracy > 40) { lastRef.current = p; return; } // too noisy to trust

    const last = lastRef.current;
    if (last) {
      const d = haversine(last, p);
      if (d >= 3 && d < 60) { // ignore <3m jitter and >60m/s teleports
        resumeFromAuto();               // real movement → un-pause
        lastMoveRef.current = Date.now();
        distRef.current += d;
        setDist(distRef.current);
        routeRef.current.push([Math.round(lat * 1e5) / 1e5, Math.round(lng * 1e5) / 1e5]);
        lineRef.current?.addLatLng([lat, lng]);
        // per-mile splits (with spoken callout)
        const mi = distRef.current / M_PER_MI;
        while (mi >= splitRef.current.nextMi) {
          const t = durRef.current;
          const sec = t - splitRef.current.lastT;
          const n = splitRef.current.nextMi;
          setSplits((s) => [...s, { mi: n, sec }]);
          splitRef.current.lastT = t;
          splitRef.current.nextMi += 1;
          beep(760, 0.12); haptic("success"); // mile buzz
          if (voiceOn) speak(`Mile ${n}. ${spokenTime(sec)}.`);
        }
      }
    }
    lastRef.current = p;
  }

  function resumeFromAuto() {
    if (autoPausedRef.current) {
      autoPausedRef.current = false;
      setAutoPaused(false);
      beep(700, 0.08);
    }
  }

  async function requestWake() {
    try { wakeRef.current = await navigator.wakeLock?.request("screen"); } catch (e) { /* ignore */ }
  }

  const start = async () => {
    await requestWake();
    lastRef.current = null; // start a fresh segment
    lastMoveRef.current = Date.now();
    autoPausedRef.current = false; setAutoPaused(false);
    setStatus("tracking");
    beep(720, 0.1); haptic("success");
    if (voiceOn) speak(mode === "Run" ? "Run started. Let's go." : "Walk started.");
  };
  const pause = () => { setStatus("paused"); beep(440, 0.1); haptic("light"); };
  const resume = async () => {
    await requestWake();
    lastRef.current = null;
    lastMoveRef.current = Date.now();
    autoPausedRef.current = false; setAutoPaused(false);
    setStatus("tracking");
    beep(720, 0.1); haptic("light");
  };

  const finish = () => {
    setStatus("done");
    if (watchRef.current != null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    try { wakeRef.current?.release(); } catch (e) { /* ignore */ }
    beep(900, 0.4); haptic("success");

    const mi = distRef.current / M_PER_MI;
    const durationSec = durRef.current;
    if (mi >= 0.02 && durationSec > 5) {
      const avg = durationSec > 0 ? mi / (durationSec / 3600) : null;
      const wt = bodyweight(state) || 180;
      const cals = Math.round(mi * wt * (mode === "Run" ? 0.72 : 0.53));
      actions.logRunSession({
        date: todayKey(),
        dayId: `outdoor-${Date.now()}`,
        week: state.week,
        distanceMi: Math.round(mi * 100) / 100,
        durationSec,
        topMph: maxSpeedRef.current ? Math.round(maxSpeedRef.current * 10) / 10 : (avg ? Math.round(avg * 10) / 10 : null),
        avgMph: avg ? Math.round(avg * 10) / 10 : null,
        outdoor: true,
        mode,
        route: downsample(routeRef.current),
      });
      actions.logActivity(todayKey(), { workouts: 1, calories: cals });
      toast({ emoji: mode === "Run" ? "🏃" : "🚶", title: `${mode} saved`, sub: `${mi.toFixed(2)} mi · ${fmtDuration(durationSec)}`, tone: "good" });
      if (voiceOn) speak(`Nice work. ${mi.toFixed(2)} miles in ${spokenTime(durationSec)}.`);
    }
  };

  const close = () => {
    if ((status === "tracking" || status === "paused") && dist > 20) {
      if (!window.confirm("Discard this run? Tap Finish first to save it.")) return;
    }
    if (watchRef.current != null) { navigator.geolocation.clearWatch(watchRef.current); watchRef.current = null; }
    try { wakeRef.current?.release(); } catch (e) { /* ignore */ }
    onClose();
  };

  return createPortal(
    <div className="run-tracker">
      <div className="rt-top">
        <button className="rt-x" onClick={close} aria-label="Exit run">‹ Exit</button>
        <div className="rt-mode">
          {["Run", "Walk"].map((m) => (
            <button key={m} className={`rt-mode-btn ${mode === m ? "on" : ""}`} disabled={status !== "idle"} onClick={() => setMode(m)}>
              {m === "Run" ? "🏃 Run" : "🚶 Walk"}
            </button>
          ))}
        </div>
        <span style={{ width: 40 }} />
      </div>

      <div className="rt-map" ref={mapEl} />

      {(err || !gpsReady) && (
        <div className="rt-banner">{err || "Locating you… make sure location is allowed."}</div>
      )}

      <div className="rt-panel">
        {autoPaused && status === "tracking" && (
          <div className="rt-autopause">⏸ Auto-paused — move to resume</div>
        )}
        <div className="rt-stats">
          <div className="rt-stat big">
            <div className="k tnum">{miles.toFixed(2)}</div>
            <div className="l">Miles</div>
          </div>
          <div className="rt-stat">
            <div className="k tnum">{fmtDuration(dur)}</div>
            <div className="l">Time</div>
          </div>
          <div className="rt-stat">
            <div className="k tnum">{pace ? fmtPace(pace).replace("/mi", "") : "–:--"}</div>
            <div className="l">Pace /mi</div>
          </div>
          <div className="rt-stat">
            <div className="k tnum">{(status === "done" ? avgMph : speed).toFixed(1)}</div>
            <div className="l">{status === "done" ? "Avg mph" : "Now mph"}</div>
          </div>
        </div>

        {splits.length > 0 && (
          <div className="rt-splits">
            {splits.map((s) => (
              <div key={s.mi} className="rt-split">
                <span>Mi {s.mi}</span>
                <span className="tnum">{fmtDuration(s.sec)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="rt-controls">
          {status === "idle" && (
            <button className="btn btn-primary rt-main" onClick={start} disabled={!gpsReady}>
              {gpsReady ? `Start ${mode}` : "Waiting for GPS…"}
            </button>
          )}
          {status === "tracking" && (
            <>
              <button className="btn" onClick={pause}>Pause</button>
              <button className="btn btn-primary rt-main" onClick={finish}>Finish</button>
            </>
          )}
          {status === "paused" && (
            <>
              <button className="btn btn-primary rt-main" onClick={resume}>Resume</button>
              <button className="btn btn-good" onClick={finish}>Finish</button>
            </>
          )}
          {status === "done" && (
            <button className="btn btn-primary rt-main" onClick={onClose}>Done</button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
