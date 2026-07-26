// Quick jump to Spotify. Music keeps playing in the background when you
// switch back to the app, so this is just a fast launcher.
export default function MusicButton({ compact }) {
  return (
    <a
      className={`music-btn ${compact ? "compact" : ""}`}
      href="https://open.spotify.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Open Spotify"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.6 14.4a.8.8 0 01-1.1.3c-3-1.8-6.8-2.2-11.2-1.2a.8.8 0 11-.4-1.6c4.8-1.1 9-.6 12.4 1.4.4.2.5.7.3 1.1zm1.2-2.7a1 1 0 01-1.4.3c-3.5-2.1-8.7-2.7-12.8-1.5a1 1 0 11-.6-1.9c4.7-1.4 10.5-.7 14.5 1.7.5.3.6 1 .3 1.4zm.1-2.8C13.7 8.6 7.3 8.4 3.6 9.5A1.2 1.2 0 112.9 7.2c4.3-1.3 11.3-1 15.8 1.6a1.2 1.2 0 01-1.2 2.1z" />
      </svg>
      {!compact && <span>Music</span>}
    </a>
  );
}
