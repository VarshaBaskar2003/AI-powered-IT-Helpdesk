// Hand-crafted SVG charts enhanced with 3D gradients, glowing filters and cylindrical depth

export function Sparkline({ values, color = "var(--brand)" }) {
  const max = Math.max(1, ...values);
  const step = 100 / Math.max(1, values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(28 - (v / max) * 22).toFixed(1)}`).join(" ");
  const areaPoints = `0,32 ${points} 100,32`;
  const gradId = `spark-grad-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <svg className="spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.38" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#${gradId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Donut({ data }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-3d">
      <div className="donut-canvas-wrap">
        <svg viewBox="0 0 100 100" role="img" aria-label="Tickets by category">
          <defs>
            <filter id="donut3d-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(0, 0, 0, 0.25)" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--track)" strokeWidth="14" opacity="0.4" />
          <g filter="url(#donut3d-shadow)">
            {data.filter((d) => d.value > 0).map((d) => {
              const length = (d.value / total) * circumference;
              const circle = (
                <circle
                  key={d.label}
                  cx="50"
                  cy="50"
                  r={radius}
                  fill="none"
                  stroke={d.color}
                  strokeWidth="14"
                  strokeDasharray={`${length} ${circumference - length}`}
                  strokeDashoffset={-offset}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  className="donut-segment-3d"
                />
              );
              offset += length;
              return circle;
            })}
          </g>
        </svg>
        <div className="donut-center-badge">
          <span className="donut-center-val">{total}</span>
          <span className="donut-center-lbl">Total</span>
        </div>
      </div>
      <ul className="legend-3d">
        {data.filter((d) => d.value > 0).map((d) => (
          <li key={d.label} className="legend-item-3d">
            <i style={{ background: d.color, boxShadow: `0 0 8px ${d.color}88` }} />
            <span>{d.label}</span>
            <b>{d.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VolumeBars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="volume-3d" role="img" aria-label="Tickets created per day">
      {data.map((d) => {
        const heightPct = Math.max(6, (d.value / max) * 100);
        return (
          <div key={d.label} className="volume-col-3d" title={`${d.label}: ${d.value} tickets`}>
            <span className="volume-num-3d">{d.value}</span>
            <div className="volume-track-3d">
              <div
                className="volume-bar-3d"
                style={{ height: `${heightPct}%` }}
              >
                <span className="volume-cap-3d" />
              </div>
            </div>
            <span className="volume-label-3d">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default { Sparkline, Donut, VolumeBars };