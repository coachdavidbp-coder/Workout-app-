import { useState } from "react";
import { useStore, todayKey } from "../store.jsx";
import BrandLogo from "../components/BrandLogo.jsx";
import Sheet from "../components/Sheet.jsx";

export default function SupplementsScreen() {
  const { state, actions } = useStore();
  const dateKey = todayKey();
  const [adding, setAdding] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const supps = state.supplements || [];
  const taken = state.suppLog?.[dateKey] || {};
  const takenCount = supps.filter((s) => taken[s.id]).length;

  return (
    <div className="scroll">
      <header className="train-head">
        <div className="brandrow">
          <BrandLogo height={24} />
          <span className="mode-badge">
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </div>
        <div className="h-title">
          <div className="kicker">
            {takenCount}/{supps.length} taken today
          </div>
          <h1>Supplements</h1>
        </div>
      </header>

      <main className="content">
        <div className="spread">
          <div className="section-label" style={{ margin: 0 }}>
            Today's stack
          </div>
          {supps.length > 0 && (
            <button className="link-btn" onClick={() => setEditMode((v) => !v)}>
              {editMode ? "Done" : "Edit"}
            </button>
          )}
        </div>

        {supps.length === 0 ? (
          <div className="card empty-hint">
            No supplements yet. Add whatever you take — protein, creatine, vitamins,
            electrolytes, anything.
          </div>
        ) : (
          <div className="supp-list">
            {supps.map((s) => {
              const isTaken = !!taken[s.id];
              return (
                <div className="supp-row" key={s.id}>
                  {editMode ? (
                    <button className="del" aria-label="Remove" onClick={() => actions.removeSupplement(s.id)}>
                      −
                    </button>
                  ) : (
                    <button
                      className={`supp-check ${isTaken ? "on" : ""}`}
                      aria-label={isTaken ? "Taken" : "Mark taken"}
                      onClick={() => actions.toggleSupp(dateKey, s.id)}
                    >
                      {isTaken ? "✓" : ""}
                    </button>
                  )}
                  <div className="supp-info">
                    <div className="sn">{s.name}</div>
                    <div className="sd">
                      {s.dose}
                      {s.dose && s.freq ? " · " : ""}
                      {s.freq === "weekly" ? "Weekly" : "Daily"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button className="btn btn-primary btn-block" onClick={() => setAdding(true)}>
          + Add Supplement
        </button>

        <div className="note-box">
          Tracking only — not medical advice. Confirm doses and any prescription meds
          (including your GLP-1) with your doctor.
        </div>
      </main>

      <AddSupplementSheet open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}

function AddSupplementSheet({ open, onClose }) {
  const { actions } = useStore();
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [freq, setFreq] = useState("daily");

  const save = () => {
    if (!name.trim()) return;
    actions.addSupplement({ name: name.trim(), dose: dose.trim(), freq });
    setName("");
    setDose("");
    setFreq("daily");
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <h3 className="sheet-title">Add Supplement</h3>
      <div className="sheet-sub">Whatever you take</div>

      <div className="section-label" style={{ marginTop: 16 }}>Name</div>
      <input className="login-input" placeholder="e.g. Creatine, Fish Oil, Magnesium" value={name} onChange={(e) => setName(e.target.value)} autoFocus />

      <div className="section-label" style={{ marginTop: 14 }}>Dose (optional)</div>
      <input className="login-input" placeholder="e.g. 5 g, 2 capsules, 1000 mg" value={dose} onChange={(e) => setDose(e.target.value)} />

      <div className="section-label" style={{ marginTop: 14 }}>How often</div>
      <div className="row gap-2">
        {["daily", "weekly"].map((f) => (
          <button key={f} className={`week-pill ${freq === f ? "on" : ""}`} onClick={() => setFreq(f)}>
            {f === "daily" ? "Daily" : "Weekly"}
          </button>
        ))}
      </div>

      <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={save}>
        Add to Stack
      </button>
    </Sheet>
  );
}
