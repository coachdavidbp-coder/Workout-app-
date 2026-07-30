import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { beep, haptic } from "../lib/fx.js";

// Camera barcode scanner for packaged food.
//
// Two engines, picked at runtime:
//   • BarcodeDetector — built into the browser, no download, very fast.
//     Chrome/Android has it; Safari historically hasn't.
//   • @zxing/browser — pure-JS decoder, loaded only if the native one is
//     missing, so iPhone users still get a scanner (it's a ~200 KB lazy
//     chunk, not part of the main bundle).
//
// The camera needs HTTPS. Localhost is fine; a plain-http host is not, and
// we say so instead of showing a black rectangle.
const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf"];

export default function BarcodeScanner({ open, onClose, onDetect }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const stopRef = useRef(null);      // engine-specific teardown
  const doneRef = useRef(false);     // fire onDetect exactly once
  const [err, setErr] = useState("");
  const [engine, setEngine] = useState("");
  const [torch, setTorch] = useState(null); // null = unsupported

  useEffect(() => {
    if (!open) return;
    doneRef.current = false;
    setErr("");
    let cancelled = false;

    const hit = (code) => {
      if (doneRef.current || cancelled) return;
      const clean = String(code || "").replace(/\D/g, "");
      if (clean.length < 8) return; // ignore partial / noisy reads
      doneRef.current = true;
      beep(920, 0.12);
      haptic("success");
      onDetect(clean);
    };

    (async () => {
      if (!window.isSecureContext) {
        setErr("The camera only works over a secure (https) connection. Open the installed app or the https link.");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setErr("This browser won't give the app camera access. You can still type the barcode number in.");
        return;
      }

      const constraints = { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false };

      try {
        if ("BarcodeDetector" in window) {
          setEngine("native");
          const supported = await window.BarcodeDetector.getSupportedFormats();
          const detector = new window.BarcodeDetector({
            formats: FORMATS.filter((f) => supported.includes(f)),
          });
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
          streamRef.current = stream;
          const v = videoRef.current;
          if (!v) return;
          v.srcObject = stream;
          await v.play().catch(() => {});
          setTorchSupport(stream, setTorch);

          let raf = 0;
          const scan = async () => {
            if (cancelled || doneRef.current) return;
            try {
              const found = await detector.detect(v);
              if (found?.length) hit(found[0].rawValue);
            } catch (e) { /* frame not ready — try the next one */ }
            if (!doneRef.current && !cancelled) raf = requestAnimationFrame(scan);
          };
          raf = requestAnimationFrame(scan);
          stopRef.current = () => cancelAnimationFrame(raf);
        } else {
          setEngine("zxing");
          const { BrowserMultiFormatReader } = await import("@zxing/browser");
          if (cancelled) return;
          const reader = new BrowserMultiFormatReader();
          const controls = await reader.decodeFromConstraints(
            constraints,
            videoRef.current,
            (result) => { if (result) hit(result.getText()); }
          );
          if (cancelled) { controls.stop(); return; }
          stopRef.current = () => { try { controls.stop(); } catch (e) { /* ignore */ } };
          const s = videoRef.current?.srcObject;
          if (s) { streamRef.current = s; setTorchSupport(s, setTorch); }
        }
      } catch (e) {
        if (cancelled) return;
        const name = e?.name || "";
        if (name === "NotAllowedError" || name === "SecurityError") {
          setErr("Camera access was blocked. Allow it in Settings → the app → Camera, then try again.");
        } else if (name === "NotFoundError" || name === "OverconstrainedError") {
          setErr("No back camera found on this device.");
        } else {
          setErr("Couldn't start the camera. You can type the barcode number in instead.");
        }
      }
    })();

    return () => {
      cancelled = true;
      try { stopRef.current?.(); } catch (e) { /* ignore */ }
      stopRef.current = null;
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch (e) { /* ignore */ }
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks?.()[0];
    if (!track) return;
    const on = !torch;
    try { await track.applyConstraints({ advanced: [{ torch: on }] }); setTorch(on); haptic(); } catch (e) { /* ignore */ }
  };

  if (!open) return null;

  return createPortal(
    <div className="scan-overlay">
      <div className="scan-top">
        <button className="it-close" onClick={onClose} aria-label="Close scanner">✕</button>
        <div className="it-round">Scan barcode</div>
        <span style={{ width: 40 }} />
      </div>

      <div className="scan-stage">
        <video ref={videoRef} className="scan-video" playsInline muted autoPlay />
        {!err && (
          <>
            <div className="scan-frame"><span /><span /><span /><span /></div>
            <div className="scan-line" />
          </>
        )}
        {err && <div className="scan-err">{err}</div>}
      </div>

      <div className="scan-hint">
        {err
          ? "Tap Close and use the barcode field."
          : "Line the barcode up inside the box. Hold steady — it reads on its own."}
      </div>

      <div className="scan-controls">
        {torch !== null && !err && (
          <button className="btn" onClick={toggleTorch}>{torch ? "Light off" : "💡 Light"}</button>
        )}
        <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>Close</button>
      </div>
      {engine === "zxing" && !err && <div className="scan-engine">Using the in-app decoder</div>}
    </div>,
    document.body
  );
}

function setTorchSupport(stream, set) {
  try {
    const track = stream.getVideoTracks()[0];
    const caps = track?.getCapabilities?.();
    if (caps && "torch" in caps) set(false);
  } catch (e) { /* ignore */ }
}
