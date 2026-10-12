// Tiny hand-made SVG charts, so we do not need a chart library.

export function Sparkline({ values, color = "var(--brand)" }) {
  const max = Math.max(1, ...values);
  const step = 100 / Math.max(1, values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(28 - (v / max) * 24).toFixed(1)}`).join(" ");
  return (
    <svg className="spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function Donut({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <div className="donut">
      <svg viewBox="0 0 100 100" role="img" aria-label="Tickets by category">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--track)" strokeWidth="16" />
        {data.filter((d) => d.value > 0).map((d) => {
          const length = (d.value / total) * circumference;
          const circle = (
            <circle key={d.label} cx="50" cy="50" r={radius} fill="none" stroke={d.color} strokeWidth="16"
                    strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset}
                    transform="rotate(-90 50 50)" />
          );
          offset += length;
          return circle;
        })}
      </svg>
      <ul className="legend">
        {data.filter((d) => d.value > 0).map((d) => (
          <li key={d.label}><i style={{ background: d.color }} />{d.label} <b>{d.value}</b></li>
        ))}
      </ul>
    </div>
  );
}

export function VolumeBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="volume" role="img" aria-label="Tickets created per day">
      {data.map((d) => (
        <div key={d.label} className="volume-col" title={`${d.label}: ${d.value}`}>
          <span className="volume-num">{d.value}</span>
          <span className="volume-bar" style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }} />
          <span className="volume-label">{d.label}</span>
        </div>
      ))}
    </div>
  );
}