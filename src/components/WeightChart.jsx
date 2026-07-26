// Responsive weight trend line chart from an array of {date, weight}.
export default function WeightChart({ data }) {
  const W = 320;
  const H = 150;
  const padL = 30;
  const padR = 10;
  const padT = 12;
  const padB = 22;

  if (!data.length) {
    return <div className="empty-hint">No weigh-ins in this range yet.</div>;
  }

  const weights = data.map((d) => d.weight);
  let min = Math.min(...weights);
  let max = Math.max(...weights);
  if (max - min < 4) {
    min -= 2;
    max += 2;
  } else {
    const pad = (max - min) * 0.15;
    min -= pad;
    max += pad;
  }

  const n = data.length;
  const x = (i) => padL + (n === 1 ? (W - padL - padR) / 2 : (i * (W - padL - padR)) / (n - 1));
  const y = (w) => padT + ((max - w) / (max - min)) * (H - padT - padB);

  const line = data.map((d, i) => `${x(i)},${y(d.weight)}`).join(" ");
  const area = `${padL},${H - padB} ${line} ${x(n - 1)},${H - padB}`;

  const ticks = [max, (max + min) / 2, min];
  const lastIdx = n - 1;

  // sparse x labels (first, mid, last)
  const xLabelIdx = n <= 3 ? data.map((_, i) => i) : [0, Math.floor(n / 2), n - 1];

  return (
    <svg className="wchart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="wgrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--ac)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--ac)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => (
        <g key={i}>
          <line className="grid" x1={padL} y1={y(t)} x2={W - padR} y2={y(t)} />
          <text className="axis-txt" x={padL - 6} y={y(t) + 3} textAnchor="end">
            {Math.round(t)}
          </text>
        </g>
      ))}

      <polygon className="area" points={area} />
      <polyline className="line" points={line} />

      {data.map((d, i) => (
        <circle key={i} className={`pt ${i === lastIdx ? "last" : ""}`} cx={x(i)} cy={y(d.weight)} r={i === lastIdx ? 4 : 2.5} />
      ))}

      {xLabelIdx.map((i) => (
        <text key={i} className="axis-txt" x={x(i)} y={H - 6} textAnchor="middle">
          {fmtShort(data[i].date)}
        </text>
      ))}
    </svg>
  );
}

function fmtShort(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const mo = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1];
  return `${mo} ${d}`;
}
