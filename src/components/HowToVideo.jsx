import { useEffect, useState } from "react";
import { resolveVideoId, embedUrl, youtubeSearchEnabled } from "../lib/youtube.js";

// Plays a how-to in-app when a real video id can be resolved (or is already
// known), and falls back to opening YouTube otherwise — so it never shows a
// dead player. Used for yoga poses and anything else without a fixed id.
export default function HowToVideo({ query, videoId = null, title = "How-to", compact = false }) {
  const [id, setId] = useState(videoId);
  const [state, setState] = useState(videoId ? "ready" : youtubeSearchEnabled ? "loading" : "link");

  useEffect(() => {
    setId(videoId || null);
    if (videoId) { setState("ready"); return; }
    if (!youtubeSearchEnabled) { setState("link"); return; }
    setState("loading");
    const ctrl = new AbortController();
    resolveVideoId(query, ctrl.signal).then((v) => {
      if (ctrl.signal.aborted) return;
      if (v) { setId(v); setState("ready"); } else setState("link");
    });
    return () => ctrl.abort();
  }, [query, videoId]);

  const open = () =>
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, "_blank", "noopener");

  if (state === "ready" && id) {
    return (
      <div className="video-wrap">
        <iframe
          src={embedUrl(id)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (compact) {
    return (
      <button className="pose-vid-btn" onClick={open}>
        {state === "loading" ? "…" : "▶ Video"}
      </button>
    );
  }

  return (
    <button className="video-card" onClick={open}>
      <span className="vc-play">▶</span>
      <span className="vc-txt">
        <span className="vc-k">{state === "loading" ? "Finding a video…" : "Watch how-to on YouTube"}</span>
        <span className="vc-s">{query}</span>
      </span>
    </button>
  );
}
