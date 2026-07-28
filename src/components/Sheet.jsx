import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// Bottom sheet modal. Click scrim or Esc to close.
// The grabber at the top is draggable: pull down to dismiss (follows your
// finger, snaps back if you don't pull far enough) — the standard iOS sheet
// gesture. Tracks the on-screen keyboard via visualViewport so the sheet sits
// above it. Rendered via a portal on <body> so it escapes each screen's
// `.scroll` stacking context and overlays the fixed bottom nav.
export default function Sheet({ open, onClose, children }) {
  const sheetRef = useRef(null);
  const drag = useRef({ startY: 0, dy: 0, active: false });

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    const vv = window.visualViewport;
    const setVVH = () => {
      const h = vv ? vv.height : window.innerHeight;
      document.documentElement.style.setProperty("--vvh", `${h}px`);
    };
    setVVH();
    vv?.addEventListener("resize", setVVH);
    vv?.addEventListener("scroll", setVVH);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      vv?.removeEventListener("resize", setVVH);
      vv?.removeEventListener("scroll", setVVH);
      document.documentElement.style.removeProperty("--vvh");
    };
  }, [open, onClose]);

  const onPointerDown = (e) => {
    drag.current = { startY: e.clientY, dy: 0, active: true };
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (sheetRef.current) sheetRef.current.style.transition = "none";
  };
  const onPointerMove = (e) => {
    if (!drag.current.active) return;
    let dy = e.clientY - drag.current.startY;
    if (dy < 0) dy *= 0.3; // resist pulling up past the top
    drag.current.dy = dy;
    if (sheetRef.current) sheetRef.current.style.transform = `translateY(${Math.max(dy, 0)}px)`;
  };
  const onPointerUp = () => {
    if (!drag.current.active) return;
    const dy = drag.current.dy;
    drag.current.active = false;
    const el = sheetRef.current;
    if (!el) return;
    if (dy > 120) {
      // pulled far enough — slide it out and close
      el.style.transition = "transform 0.2s ease-in";
      el.style.transform = "translateY(100%)";
      setTimeout(onClose, 180);
    } else {
      // snap back
      el.style.transition = "transform 0.25s cubic-bezier(0.2,0.9,0.3,1)";
      el.style.transform = "";
    }
  };

  if (!open) return null;
  return createPortal(
    <div className="scrim" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
        <div
          className="sheet-grab"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="sheet-handle" />
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
