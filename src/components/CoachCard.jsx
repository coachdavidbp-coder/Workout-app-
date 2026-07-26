// The Coach speaking card. `msg` = { tone, title, body }.
export default function CoachCard({ msg }) {
  if (!msg) return null;
  return (
    <div className={`coach-card ${msg.tone}`}>
      <div className="coach-avatar" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 6a4 4 0 10-4 4h1.5" />
          <path d="M10.5 10L4 15c-1.2 1-1 3 .5 3.6 1.2.5 2.6 0 3.2-1.1L11 13" />
          <circle cx="14" cy="6" r="0.6" fill="currentColor" />
          <path d="M15 9l5-2M15 11l5 0" />
        </svg>
      </div>
      <div className="coach-body">
        <div className="coach-name">{msg.name || "Coach"}</div>
        <div className="coach-title">{msg.title}</div>
        <div className="coach-msg">{msg.body}</div>
      </div>
    </div>
  );
}
