// Generic line/area trend chart. points = [{ label, value }].
export default function TrendChart({ points, color = "var(--ac)", height = 150, valueFmt = (v) => v }) {
  const data = points.filter((p) => p.value != null && isFinite(p.value));
  if (data.length < 1) {
    return <div className="empty-hint">Not enough data yet — log a few sessions.</div>;
  }
  const W = 320;
  const H = height;
  const padL = 34, padR = 12, padT = 14, padB = 24;

  const vals = data.map((d) => d.value);
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (max - min < 1e-6) { min -= 1; max += 1; }
  else { const pad = (max - min) * 0.15; min -= pad; max += pad; }

  const n = data.length;
  const x = (i) => padL + (n === 1 ? (W - padL - padR) / 2 : (i * (W - padL - padR)) / (n - 1));
  const y = (v) => padT + ((max - v) / (max - min)) * (H - padT - padB);

  const line = data.map((d, i) => `${x(i)},${y(d.value)}`).join(" ");
  const area = `${x(0)},${H - padB} ${line} ${x(n - 1)},${H - padB}`;
  // Path length drives the draw-on animation (CSS reads it as --len).
  let lineLen = 0;
  for (let i = 1; i < n; i++) {
    lineLen += Math.hypot(x(i) - x(i - 1), y(data[i].value) - y(data[i - 1].value));
  }
  lineLen = Math.ceil(lineLen) || 1;

  const ticks = [max, (max + min) / 2, min];
  const last = n - 1;
  const xIdx = n <= 3 ? data.map((_, i) => i) : [0, Math.floor(n / 2), n - 1];

  return (
    <svg className="wchart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="tgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.26" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t, i) => (
        <g key={i}>
          <line className="grid" x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} />
          <text className="axis-txt" x={padL - 6} y={y(t) + 3} textAnchor="end">{valueFmt(Math.round(t))}</text>
        </g>
      ))}
      <polygon className="area-fade" points={area} fill="url(#tgrad)" />
      <polyline
        className="line-draw"
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ "--len": lineLen }}
      />
      {data.map((d, i) => (
        <circle key={i} cx={x(i)} cy={y(d.value)} r={i === last ? 4 : 2.5} fill={i === last ? "var(--good)" : color} stroke="var(--g)" strokeWidth="1.5" />
      ))}
      {xIdx.map((i) => (
        <text key={i} className="axis-txt" x={x(i)} y={H - 6} textAnchor="middle">{data[i].label}</text>
      ))}
    </svg>
  );
}
