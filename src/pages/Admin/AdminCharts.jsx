// AdminCharts.jsx — Lightweight responsive pastel SVG charts (zero bloat, real data only)
import { useState } from 'react';

const PALETTE = ['#e8638a', '#a87de8', '#5aaad4', '#f4845f', '#6aaa6a', '#ffb347', '#c084fc', '#ff85aa'];

export function EmptyChartState({ icon = '🌸', message = 'No data recorded in this date window yet.' }) {
  return (
    <div className="adm-empty-chart">
      <span className="adm-empty-icon">{icon}</span>
      <p>{message}</p>
    </div>
  );
}

export function PastelLineChart({ data = [], valueKey = 'count', labelKey = 'label', color = '#e8638a', unit = '' }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  if (!data || data.length === 0) return <EmptyChartState />;

  const values = data.map(d => Number(d[valueKey] || 0));
  const maxVal = Math.max(...values, 1);
  const w = 360;
  const h = 150;
  const padX = 24;
  const padY = 18;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;

  const pts = data.map((d, i) => {
    const x = data.length === 1 ? w / 2 : padX + (i / (data.length - 1)) * plotW;
    const y = padY + plotH - (Number(d[valueKey] || 0) / maxVal) * plotH;
    return { x, y, item: d, val: Number(d[valueKey] || 0) };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = pts.length > 0
    ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(h - padY).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(h - padY).toFixed(1)} Z`
    : '';

  const gradId = `grad-${valueKey}-${color.replace('#', '')}`;
  const labelStep = data.length > 10 ? Math.ceil(data.length / 6) : 1;

  return (
    <div className="adm-chart-wrap">
      {hoverIdx != null && pts[hoverIdx] && (
        <div className="adm-chart-tooltip">
          <strong>{pts[hoverIdx].item[labelKey]}</strong>: {pts[hoverIdx].val}{unit}
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${h + 22}`} className="adm-svg-chart" role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((t, idx) => {
          const yLine = padY + plotH * (1 - t);
          return (
            <line
              key={idx}
              x1={padX}
              x2={w - padX}
              y1={yLine}
              y2={yLine}
              stroke="#f2e4f8"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          );
        })}
        {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
        {linePath && <path d={linePath} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
        {pts.map((p, i) => (
          <g key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
            <circle cx={p.x} cy={p.y} r={hoverIdx === i ? 5 : 3.4} fill="#ffffff" stroke={color} strokeWidth="2.2" />
            {(i % labelStep === 0 || i === pts.length - 1) && (
              <text x={p.x} y={h + 14} textAnchor="middle" className="adm-svg-axis-label">
                {p.item[labelKey]}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

export function PastelBarChart({ data = [], valueKey = 'count', labelKey = 'label', color = '#a87de8', unit = '' }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  if (!data || data.length === 0) return <EmptyChartState />;

  const maxVal = Math.max(...data.map(d => Number(d[valueKey] || 0)), 1);
  const w = 360;
  const h = 150;
  const padX = 18;
  const padY = 18;
  const plotW = w - padX * 2;
  const plotH = h - padY * 2;
  const barSlot = plotW / data.length;
  const barW = Math.min(34, Math.max(8, barSlot * 0.58));
  const labelStep = data.length > 10 ? Math.ceil(data.length / 6) : 1;

  return (
    <div className="adm-chart-wrap">
      {hoverIdx != null && data[hoverIdx] && (
        <div className="adm-chart-tooltip">
          <strong>{data[hoverIdx][labelKey]}</strong>: {data[hoverIdx][valueKey]}{unit}
        </div>
      )}
      <svg viewBox={`0 0 ${w} ${h + 22}`} className="adm-svg-chart" role="img" aria-label="Bar chart">
        {[0, 0.5, 1].map((t, idx) => {
          const yLine = padY + plotH * (1 - t);
          return (
            <line key={idx} x1={padX} x2={w - padX} y1={yLine} y2={yLine} stroke="#f2e4f8" strokeDasharray="3 3" strokeWidth="1" />
          );
        })}
        {data.map((d, i) => {
          const val = Number(d[valueKey] || 0);
          const barH = Math.max(val > 0 ? 4 : 1.5, (val / maxVal) * plotH);
          const x = padX + i * barSlot + (barSlot - barW) / 2;
          const y = padY + plotH - barH;
          return (
            <g key={i} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx="5"
                fill={PALETTE[i % PALETTE.length] || color}
                opacity={hoverIdx === i ? 1 : 0.85}
              />
              {val > 0 && data.length <= 10 && (
                <text x={x + barW / 2} y={Math.max(11, y - 4)} textAnchor="middle" className="adm-svg-val-label">
                  {val}{unit}
                </text>
              )}
              {(i % labelStep === 0 || i === data.length - 1) && (
                <text x={x + barW / 2} y={h + 14} textAnchor="middle" className="adm-svg-axis-label">
                  {d[labelKey]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function PastelDonutChart({ data = [], emptyMessage = 'No completed activities yet.' }) {
  if (!data || data.length === 0) return <EmptyChartState message={emptyMessage} />;

  const total = data.reduce((sum, d) => sum + Number(d.count || 0), 0);
  if (total === 0) return <EmptyChartState message={emptyMessage} />;

  const radius = 52;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="adm-donut-layout">
      <svg viewBox="0 0 140 140" className="adm-donut-svg" role="img" aria-label="Activity distribution chart">
        {data.slice(0, 8).map((item, idx) => {
          const frac = item.count / total;
          const segLen = frac * circ;
          const dashOffset = -offset;
          offset += segLen;
          return (
            <circle
              key={item.label}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={PALETTE[idx % PALETTE.length]}
              strokeWidth="20"
              strokeDasharray={`${segLen} ${circ - segLen}`}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 70 70)"
            />
          );
        })}
        <text x="70" y="67" textAnchor="middle" className="adm-donut-total">{total}</text>
        <text x="70" y="83" textAnchor="middle" className="adm-donut-sub">total</text>
      </svg>

      <div className="adm-donut-legend">
        {data.slice(0, 8).map((item, idx) => (
          <div key={item.label} className="adm-legend-row">
            <span className="adm-legend-dot" style={{ background: PALETTE[idx % PALETTE.length] }} />
            <span className="adm-legend-label">{item.label}</span>
            <span className="adm-legend-val">{item.count} ({item.pct}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}
