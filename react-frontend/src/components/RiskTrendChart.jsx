import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function riskColor(pct) {
  if (pct < 35) return '#16a34a';
  if (pct < 65) return '#d97706';
  return '#e53e3e';
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const pct = Math.round(payload.probability * 100);
  return <circle cx={cx} cy={cy} r={5} fill={riskColor(pct)} stroke="white" strokeWidth={2} />;
};

export default function RiskTrendChart({ predictions }) {
  const data = [...predictions]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map(p => ({
      date:        formatDate(p.created_at),
      probability: p.risk_probability,
      pct:         Math.round(p.risk_probability * 100),
    }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <YAxis domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
        <Tooltip
          formatter={(v) => [`${Math.round(v * 100)}%`, 'Risk']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <ReferenceLine y={0.35} stroke="#16a34a" strokeDasharray="4 4" strokeOpacity={0.5} />
        <ReferenceLine y={0.65} stroke="#e53e3e" strokeDasharray="4 4" strokeOpacity={0.5} />
        <Line
          type="monotone"
          dataKey="probability"
          stroke="#e53e3e"
          strokeWidth={2}
          dot={<CustomDot />}
          activeDot={{ r: 7 }}
          isAnimationActive={true}
          animationDuration={800}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
