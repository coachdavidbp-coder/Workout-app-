import { useEffect, useState } from "react";
import { subscribeToast } from "../lib/toast.js";

// Global toast stack, top-center, auto-dismissing.
export default function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(
    () =>
      subscribeToast((t) => {
        const id = Date.now() + Math.random();
        setItems((x) => [...x, { ...t, id }]);
        setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3600);
      }),
    []
  );
  return (
    <div className="toaster">
      {items.map((t) => (
        <div key={t.id} className={`toast-item glass ${t.tone || ""}`}>
          <span className="ti-emoji">{t.emoji}</span>
          <div className="ti-body">
            <div className="ti-title">{t.title}</div>
            {t.sub && <div className="ti-sub">{t.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
