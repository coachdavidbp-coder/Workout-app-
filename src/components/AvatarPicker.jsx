import { useRef, useState } from "react";
import Sheet from "./Sheet.jsx";
import { useStore } from "../store.jsx";
import { profileIcons } from "../lib/gamify.js";
import { haptic } from "../lib/fx.js";
import { toast } from "../lib/toast.js";

// Upload a photo (downscaled + compressed so it stays small enough to sync)
// or pick one of the unlocked icons.
export default function AvatarPicker({ open, onClose }) {
  const { state, actions } = useStore();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const icons = profileIcons(state);
  const currentIconId = state.game?.profileIcon;
  const photo = state.profile?.avatar || null;

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\//.test(file.type)) { setErr("That file isn't an image."); return; }
    setBusy(true);
    setErr("");

    const reader = new FileReader();
    reader.onerror = () => { setBusy(false); setErr("Couldn't read that file."); };
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => { setBusy(false); setErr("Couldn't open that image."); };
      img.onload = () => {
        try {
          // square centre-crop, downscaled to 256px, JPEG ~40 KB
          const S = 256;
          const side = Math.min(img.width, img.height);
          const sx = (img.width - side) / 2;
          const sy = (img.height - side) / 2;
          const canvas = document.createElement("canvas");
          canvas.width = S; canvas.height = S;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, sx, sy, side, side, 0, 0, S, S);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          actions.setProfile({ avatar: dataUrl });
          haptic("success");
          toast({ emoji: "📸", title: "Photo updated", sub: "That's your new profile picture.", tone: "good" });
          setBusy(false);
          onClose();
        } catch (e2) {
          setBusy(false);
          setErr("Couldn't process that image.");
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <h3 className="sheet-title">Profile picture</h3>
      <div className="sheet-sub">Upload a photo or pick an icon</div>

      <div className="ap-current">
        {photo
          ? <img className="ap-photo" src={photo} alt="" />
          : <img className="ap-photo" src={icons.find((i) => i.id === currentIconId)?.img || icons[0].img} alt="" />}
        <div className="ap-actions">
          <button className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={busy}>
            {busy ? "Working…" : photo ? "📸 Change photo" : "📸 Upload photo"}
          </button>
          {photo && (
            <button
              className="btn"
              onClick={() => { actions.setProfile({ avatar: null }); haptic(); toast({ emoji: "↩️", title: "Photo removed", sub: "Back to your icon.", tone: "neutral" }); }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
      {err && <p className="login-err" style={{ marginTop: 10 }}>{err}</p>}

      <div className="section-label" style={{ marginTop: 18 }}>Or pick an icon</div>
      <div className="icon-grid">
        {icons.map((ic) => (
          <button
            key={ic.id}
            className={`icon-opt ${!photo && currentIconId === ic.id ? "on" : ""} ${ic.unlocked ? "" : "locked"}`}
            onClick={() => {
              if (!ic.unlocked) return;
              actions.setProfileIcon(ic.id);
              actions.setProfile({ avatar: null });
              haptic();
              onClose();
            }}
            title={ic.unlocked ? ic.name : "Locked — keep leveling up"}
          >
            <img className="icon-opt-img" src={ic.img} alt="" />
            {!ic.unlocked && <span className="lock">🔒</span>}
          </button>
        ))}
      </div>

      <button className="btn btn-block" style={{ marginTop: 16 }} onClick={onClose}>Done</button>
    </Sheet>
  );
}
