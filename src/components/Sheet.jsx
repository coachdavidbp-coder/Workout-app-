import { useEffect } from "react";

// Bottom sheet modal. Click scrim or Esc to close.
// Tracks the iOS on-screen keyboard via visualViewport so the sheet resizes
// to sit ABOVE the keyboard (search field + results stay visible).
export default function Sheet({ open, onClose, children }) {
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

  if (!open) return null;
  return (
    <div className="scrim" onClick={onClose} role="dialog" aria-modal="true">
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        {children}
      </div>
    </div>
  );
}
