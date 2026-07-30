import { useEffect, useRef, useState } from "react";

// Lottie player.
//
// The runtime (lottie-web, MIT) is pulled in with a dynamic import, so it
// only downloads the first time something actually animates instead of
// riding along in the main bundle. We use the "light" build — SVG renderer
// only, no expressions — which is about a third smaller and covers
// everything these animations do.
//
// Drop any Lottie JSON into src/data/lottie and pass it as `data`; files
// exported from After Effects or downloaded from LottieFiles work as-is.
//
// Honours prefers-reduced-motion by holding a still frame rather than
// looping, so the celebration still reads without the movement.
let lottiePromise = null;
const loadLottie = () => {
  if (!lottiePromise) {
    lottiePromise = import("lottie-web/build/player/lottie_light")
      .then((m) => m.default || m)
      .catch(() => null);
  }
  return lottiePromise;
};

export default function Lottie({
  data,
  loop = false,
  autoplay = true,
  speed = 1,
  className = "",
  size = 96,
  onComplete,
}) {
  const hostRef = useRef(null);
  const animRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    loadLottie().then((lottie) => {
      if (cancelled || !hostRef.current) return;
      if (!lottie) { setFailed(true); return; }
      try {
        const anim = lottie.loadAnimation({
          container: hostRef.current,
          renderer: "svg",
          loop: reduced ? false : loop,
          autoplay: reduced ? false : autoplay,
          animationData: data,
        });
        anim.setSpeed(speed);
        if (reduced) {
          // Sit on a frame where the shape is fully drawn.
          anim.goToAndStop(Math.round(anim.totalFrames * 0.8), true);
        }
        if (onComplete) anim.addEventListener("complete", onComplete);
        animRef.current = anim;
      } catch (e) {
        setFailed(true);
      }
    });

    return () => {
      cancelled = true;
      try { animRef.current?.destroy(); } catch (e) { /* ignore */ }
      animRef.current = null;
    };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // If the runtime can't load, render nothing rather than an empty box —
  // every use of this is decoration on top of something that already reads.
  if (failed) return null;

  return (
    <div
      ref={hostRef}
      className={`lottie ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
