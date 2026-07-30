import { useEffect, useState } from "react";
import {
  resolveVideoId, embedUrl, youtubeSearchEnabled,
  videoOverride, setVideoOverride,
} from "../lib/youtube.js";

// Plays a how-to in-app when a real video id can be resolved (or is already
// known), and falls back to opening YouTube otherwise — so it never shows a
// dead player. Used for yoga poses, stretches, and anything else without a
// fixed id.
//
// Pass `slug` and the player becomes repointable: if the shipped video is
// wrong or region-blocked, you paste a link once and this device remembers it.
export default function HowToVideo({ query, videoId = null, slug = null, title = "How-to", compact = false }) {
  const fixed = videoOverride(slug) || videoId;
  const [id, setId] = useState(fixed);
  const [state, setState] = useState(fixed ? "ready" : youtubeSearchEnabled ? "loading" : "link");

  useEffect(() => {
    const pinned = videoOverride(slug) || videoId;
    setId(pinned || null);
    if (pinned) { setState("ready"); return; }
    if (!youtubeSearchEnabled) { setState("link"); return; }
    setState("loading");
    const ctrl = new AbortController();
    resolveVideoId(query, ctrl.signal).then((v) => {
      if (ctrl.signal.aborted) return;
      if (v) { setId(v); setState("ready"); } else setState("link");
    });
    return () => ctrl.abort();
  }, [query, videoId, slug]);

  const open = () =>
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, "_blank", "noopener");

  const repoint = () => {
    const url = window.prompt(
      `Paste a YouTube link for "${slug || title}".\n\nFind one you like on YouTube, tap Share → Copy link, then paste it here. It'll play in the app from now on.`,
      ""
    );
    if (url == null) return;
    const saved = setVideoOverride(slug, url);
    if (saved) { setId(saved); setState("ready"); }
    else if (url.trim()) window.alert("That didn't look like a YouTube link. Copy the whole thing, e.g. https://youtu.be/abc123XYZ90");
  };

  if (state === "ready" && id) {
    return (
      <>
        <div className="video-wrap">
          <iframe
            src={embedUrl(id)}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <div className="video-alt-row">
          <button className="video-alt" onClick={open}>Find another ›</button>
          {slug && <button className="video-alt" onClick={repoint}>Use my own link</button>}
        </div>
      </>
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
    <>
      <button className="video-card" onClick={open}>
        <span className="vc-play">▶</span>
        <span className="vc-txt">
          <span className="vc-k">{state === "loading" ? "Finding a video…" : "Watch how-to on YouTube"}</span>
          <span className="vc-s">{query}</span>
        </span>
      </button>
      {slug && <button className="video-alt" onClick={repoint}>Play it in the app — paste a link</button>}
    </>
  );
}
