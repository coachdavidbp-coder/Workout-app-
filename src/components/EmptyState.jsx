// A real empty state: says what's missing, why it's empty, and what to do
// about it — instead of a blank panel on a fresh account.
export default function EmptyState({ icon = "📋", title, body, action, onAction }) {
  return (
    <div className="empty-state">
      <div className="es-ico">{icon}</div>
      <div className="es-title">{title}</div>
      {body && <p className="es-body">{body}</p>}
      {action && onAction && (
        <button className="es-btn" onClick={onAction}>{action}</button>
      )}
    </div>
  );
}
