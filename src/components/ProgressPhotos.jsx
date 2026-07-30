import { useRef, useState } from "react";
import { useStore, todayKey } from "../store.jsx";
import EmptyState from "./EmptyState.jsx";
import { haptic } from "../lib/fx.js";
import { toast } from "./../lib/toast.js";

const fmt = (d) => {
  try { return new Date(d + "T12:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); }
  catch (e) { return d; }
};

// Progress pictures stored alongside the weight for that day, with a
// first-vs-latest compare. Photos are downscaled before saving so a year of
// them doesn't blow past the storage limit.
export default function ProgressPhotos() {
  const { state, actions } = useStore();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [compare, setCompare] = useState(false);

  const photos = [...(state.photos || [])].sort((a, b) => a.date.localeCompare(b.date));
  const latestWeight = [...(state.weights || [])].sort((a, b) => a.date.localeCompare(b.date)).pop()?.weight ?? null;

  const pick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\//.test(file.type)) { setErr("That file isn't an image."); return; }
    setBusy(true); setErr("");

    const reader = new FileReader();
    reader.onerror = () => { setBusy(false); setErr("Couldn't read that file."); };
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => { setBusy(false); setErr("Couldn't open that image."); };
      img.onload = () => {
        try {
          const MAX = 520; // portrait-friendly, still small enough to sync
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const w = Math.round(img.width * scale);
          const h = Math.round(img.height * scale);
          const c = document.createElement("canvas");
          c.width = w; c.height = h;
          c.getContext("2d").drawImage(img, 0, 0, w, h);
          actions.addPhoto({ date: todayKey(), img: c.toDataURL("image/jpeg", 0.78), weight: latestWeight });
          haptic("success");
          toast({ emoji: "📸", title: "Photo saved", sub: "Added to your progress timeline.", tone: "good" });
          setBusy(false);
        } catch (e2) { setBusy(false); setErr("Couldn't process that image."); }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const first = photos[0];
  const last = photos[photos.length - 1];
  const canCompare = photos.length >= 2;

  return (
    <div>
      <div className="section-title">Progress photos</div>

      {photos.length === 0 ? (
        <EmptyState
          icon="📸"
          title="No progress photos yet"
          body="Same spot, same light, once a month. The scale lies on any given week — photos don't."
          action={busy ? "Working…" : "Add your first photo"}
          onAction={() => fileRef.current?.click()}
        />
      ) : (
        <>
          <div className="pp-actions">
            <button className="btn" onClick={() => fileRef.current?.click()} disabled={busy}>
              {busy ? "Working…" : "📸 Add photo"}
            </button>
            {canCompare && (
              <button className={`btn ${compare ? "btn-primary" : ""}`} onClick={() => { setCompare((c) => !c); haptic(); }}>
                {compare ? "Show all" : "Compare"}
              </button>
            )}
          </div>

          {compare && canCompare ? (
            <div className="pp-compare">
              {[first, last].map((p, i) => (
                <figure className="pp-side" key={p.date}>
                  <img src={p.img} alt="" />
                  <figcaption>
                    <span className="pp-when">{i === 0 ? "First" : "Latest"}</span>
                    <span className="pp-date">{fmt(p.date)}</span>
                    {p.weight != null && <span className="pp-wt">{p.weight} lb</span>}
                  </figcaption>
                </figure>
              ))}
              {first.weight != null && last.weight != null && first.date !== last.date && (
                <div className="pp-delta">
                  {(last.weight - first.weight) <= 0 ? "▼" : "▲"} {Math.abs(last.weight - first.weight).toFixed(1)} lb between these two
                </div>
              )}
            </div>
          ) : (
            <div className="pp-grid">
              {[...photos].reverse().map((p) => (
                <figure className="pp-cell" key={p.date}>
                  <img src={p.img} alt="" />
                  <figcaption>
                    <span className="pp-date">{fmt(p.date)}</span>
                    {p.weight != null && <span className="pp-wt">{p.weight} lb</span>}
                  </figcaption>
                  <button
                    className="pp-del"
                    aria-label="Remove photo"
                    onClick={() => { if (window.confirm("Delete this photo?")) { actions.removePhoto(p.date); haptic("warning"); } }}
                  >×</button>
                </figure>
              ))}
            </div>
          )}
        </>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
      {err && <p className="login-err" style={{ marginTop: 10 }}>{err}</p>}
    </div>
  );
}
