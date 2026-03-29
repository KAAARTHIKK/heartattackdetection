import { useState, useEffect } from 'react';

const CIRC = 2 * Math.PI * 50;

function riskColor(pct) {
  if (pct < 35) return '#16a34a';
  if (pct < 65) return '#d97706';
  return '#e53e3e';
}

export default function RiskRing({ probability, riskLevel, size = 140 }) {
  const pct = Math.round(probability * 100);
  const targetOffset = CIRC - (pct / 100) * CIRC;
  const [offset, setOffset] = useState(CIRC);

  useEffect(() => {
    const t = setTimeout(() => setOffset(targetOffset), 100);
    return () => clearTimeout(t);
  }, [targetOffset]);

  const color = riskColor(pct);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 120 120" aria-label={`Risk: ${pct}%`}>
        <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <circle
          cx="60" cy="60" r="50"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)',
            transform: 'rotate(-90deg)',
            transformOrigin: 'center',
          }}
        />
        <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="700" fill={color}>{pct}%</text>
        <text x="60" y="70" textAnchor="middle" fontSize="9" fill="#94a3b8">Risk Score</text>
      </svg>
      <span
        className="mt-2 text-xs font-semibold px-3 py-1 rounded-full"
        style={{ background: `${color}20`, color }}
      >
        {riskLevel}
      </span>
    </div>
  );
}
