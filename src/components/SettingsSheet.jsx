import Sheet from "./Sheet.jsx";
import { useStore } from "../store.jsx";
import { haptic } from "../lib/fx.js";
import {
  speak, listVoices, setVoiceName, setCoachStyle, COACH_STYLES,
  hasHumanVoice, currentVoiceInfo,
} from "../lib/voice.js";

const VOICE_SAMPLES = [
  "Let's get to work.",
  "Nice work — that's the standard.",
  "Halfway there. Keep pushing!",
  "Sprint! Go go go!",
  "That's a new personal best. Proud of that.",
];

// All app settings in one sheet — opened from the gear on Home
// (and from the You tab).
export default function SettingsSheet({ open, onClose }) {
  const { state, actions } = useStore();
  const voiceOn = state.settings?.voice !== false;
  const style = state.settings?.coachStyle || "balanced";
  const sample = () => VOICE_SAMPLES[Math.floor(Math.random() * VOICE_SAMPLES.length)];

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="settings-head">
        <img className="settings-head-ico" src="/icons/nav-settings.png" alt="" />
        <div>
          <h3 className="sheet-title">Settings</h3>
          <div className="sheet-sub">Coach voice, goals &amp; appearance</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 14 }}>
        <div className="setting-row">
          <div className="lab">Coach voice<small>Spoken cues during workouts (on-device, free)</small></div>
          <button
            className={`toggle ${voiceOn ? "on" : ""}`}
            role="switch"
            aria-checked={voiceOn}
            onClick={() => {
              const nv = !voiceOn;
              actions.setSetting("voice", nv);
              if (nv) speak("Coach voice on. Let's get to work.");
            }}
          >
            <span className="knob" />
          </button>
        </div>

        {voiceOn && (() => {
          const voices = listVoices();
          const recommended = voices.filter((v) => v.recommended);
          const others = voices.filter((v) => !v.recommended);
          const humanReady = hasHumanVoice();
          const cur = currentVoiceInfo();
          return (
            <>
              {humanReady ? (
                <div className="voice-guide ok">
                  ✅ <b>Human voice ready.</b> Pick a <b>Premium</b> or <b>Enhanced</b> voice below, then preview.
                  {cur.name && !cur.human && (
                    <div className="vg-note">You're currently on “{cur.name}” — switch to a Premium/Enhanced one for the human sound.</div>
                  )}
                </div>
              ) : (
                <div className="voice-guide">
                  <div className="vg-title">🎙️ Make the coach sound human (free, ~30 sec)</div>
                  <ol className="vg-steps">
                    <li>Open iPhone <b>Settings</b> → <b>Accessibility</b></li>
                    <li>Tap <b>Spoken Content</b> → <b>Voices</b> → <b>English</b></li>
                    <li>Pick <b>Aaron</b> or <b>Nathan</b> → tap the cloud to download the <b>Premium</b> version</li>
                    <li>Come back here and choose it below</li>
                  </ol>
                  <div className="vg-note">Apps can't use Siri's voice directly — Aaron and Nathan (Premium) are the same neural family and sound nearly identical.</div>
                </div>
              )}

              <div className="setting-row" style={{ flexWrap: "wrap", gap: 10 }}>
                <div className="lab" style={{ flexBasis: "100%" }}>Coach's voice<small>Human voices first — pick one, then preview</small></div>
                <select
                  className="login-input"
                  style={{ flex: 1, minWidth: 0 }}
                  value={state.settings?.voiceName || ""}
                  onChange={(e) => { const n = e.target.value || null; actions.setSetting("voiceName", n); setVoiceName(n); }}
                >
                  <option value="">Auto (best available)</option>
                  {recommended.length > 0 && (
                    <optgroup label="★ Recommended">
                      {recommended.map((v) => (
                        <option key={v.name} value={v.name}>
                          {v.name}{v.tier >= 4 ? " — Premium (human)" : v.tier === 3 ? " — Enhanced (human)" : ""} ({v.lang})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {others.length > 0 && (
                    <optgroup label="Other voices">
                      {others.map((v) => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
                    </optgroup>
                  )}
                </select>
                <button
                  className="btn"
                  onClick={() => { setVoiceName(state.settings?.voiceName || null); setCoachStyle(style); speak(sample()); }}
                >
                  ▶ Preview
                </button>
              </div>

              <div className="setting-row" style={{ flexWrap: "wrap", gap: 10 }}>
                <div className="lab" style={{ flexBasis: "100%" }}>Coach style<small>How the coach delivers it</small></div>
                <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                  {Object.entries(COACH_STYLES).map(([key, s]) => (
                    <button
                      key={key}
                      className={`week-pill ${style === key ? "on" : ""}`}
                      onClick={() => {
                        actions.setSetting("coachStyle", key);
                        setCoachStyle(key);
                        setVoiceName(state.settings?.voiceName || null);
                        speak(sample());
                        haptic();
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          );
        })()}

        <div className="setting-row">
          <div className="lab">Daily ring goals<small>Move (calories) &amp; Exercise (minutes)</small></div>
          <div className="row gap-2">
            <input
              type="number" inputMode="numeric" aria-label="Move goal (calories)"
              defaultValue={state.profile?.moveGoal ?? 600}
              onBlur={(e) => actions.setProfile({ moveGoal: Math.max(50, parseInt(e.target.value, 10) || 600) })}
            />
            <input
              type="number" inputMode="numeric" aria-label="Exercise goal (minutes)"
              defaultValue={state.profile?.exerciseGoal ?? 30}
              onBlur={(e) => actions.setProfile({ exerciseGoal: Math.max(5, parseInt(e.target.value, 10) || 30) })}
            />
          </div>
        </div>

        <div className="setting-row" style={{ flexWrap: "wrap", gap: 10 }}>
          <div className="lab">Appearance<small>Light, dark, or follow your device</small></div>
          <div className="row gap-2">
            {["system", "light", "dark"].map((t) => (
              <button
                key={t}
                className={`week-pill ${(state.settings?.theme || "system") === t ? "on" : ""}`}
                onClick={() => { actions.setSetting("theme", t); haptic(); }}
              >
                {t === "system" ? "Auto" : t === "light" ? "Light" : "Dark"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="btn btn-primary btn-block" style={{ marginTop: 14 }} onClick={onClose}>Done</button>
    </Sheet>
  );
}
