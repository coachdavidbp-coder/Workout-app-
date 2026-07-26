// Donut progress ring with center value.
export default function Ring({ value, max, color = "var(--ac)", center, unit }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const r = 30;
  const c = 2 * Math.PI * r;
  const off = c * (1 - pct);
  return (
    <svg className="ring-svg" viewBox="0 0 74 74">
      <circle cx="37" cy="37" r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
      <circle
        cx="37"
        cy="37"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={off}
        transform="rotate(-90 37 37)"
        style={{ transition: "stroke-dashoffset 0.5s ease" }}
      />
      <text className="big" x="37" y="37" textAnchor="middle" fontSize="16">
        {center}
      </text>
      {unit && (
        <text className="small" x="37" y="49" textAnchor="middle" fontSize="8">
          {unit}
        </text>
      )}
    </svg>
  );
}
