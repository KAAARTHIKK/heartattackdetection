import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, ReferenceLine } from 'recharts';

const FEATURE_LABELS = {
  age: 'Age', sex: 'Sex', cp: 'Chest Pain', trestbps: 'Resting BP',
  chol: 'Cholesterol', fbs: 'Fasting Sugar', restecg: 'Resting ECG',
  thalach: 'Max Heart Rate', exang: 'Exercise Angina', oldpeak: 'ST Depression',
  slope: 'ST Slope', ca: 'Major Vessels', thal: 'Thalassemia', risk_score: 'Risk Score',
};

export default function ShapChart({ shapValues }) {
  const data = Object.entries(shapValues)
    .map(([key, val]) => ({ name: FEATURE_LABELS[key] || key, value: val }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 28)}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 40, left: 110, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={v => v.toFixed(2)} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#475569' }} width={95} />
        <Tooltip
          formatter={(v) => [v > 0 ? `+${v.toFixed(3)}` : v.toFixed(3), 'SHAP']}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <ReferenceLine x={0} stroke="#cbd5e1" />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive animationDuration={700}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.value > 0 ? '#e53e3e' : '#0d9488'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
