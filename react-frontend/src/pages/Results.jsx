import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import RiskRing  from '../components/RiskRing';
import ShapChart from '../components/ShapChart';
import NLPReport from '../components/NLPReport';

const FEATURE_LABELS = {
  age: 'Age (years)', sex: 'Sex', cp: 'Chest Pain Type', trestbps: 'Resting BP (mmHg)',
  chol: 'Cholesterol (mg/dl)', fbs: 'Fasting Blood Sugar', restecg: 'Resting ECG',
  thalach: 'Max Heart Rate (bpm)', exang: 'Exercise Angina', oldpeak: 'ST Depression',
  slope: 'ST Slope', ca: 'Major Vessels', thal: 'Thalassemia',
};

const REFERENCE_RANGES = {
  age: '18–120 yrs', sex: '0=F, 1=M', cp: '1–4', trestbps: '80–200 mmHg',
  chol: '<200 mg/dl', fbs: '0=No, 1=Yes', restecg: '0–2',
  thalach: '60–220 bpm', exang: '0=No, 1=Yes', oldpeak: '0–6.2',
  slope: '1–3', ca: '0–3', thal: '3/6/7',
};

const DONUT_COLORS = ['#e53e3e', '#0d9488', '#f59e0b', '#6366f1', '#8b5cf6'];

export default function Results({ user }) {
  const { id } = useParams();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [profile, setProfile]       = useState(null);
  const [rawOpen, setRawOpen]       = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('predictions').select('*').eq('id', id).single(),
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
    ]).then(([{ data: pred, error: predError }, { data: prof, error: profError }]) => {
      if (predError) console.error('Prediction fetch error:', predError);
      if (profError) console.error('Profile fetch error:', profError);
      
      setPrediction(pred);
      setProfile(prof);
      setLoading(false);
    });
  }, [id, user.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f9fb' }}>
        <div className="text-sm animate-pulse" style={{ color: '#7c839b' }}>Loading results…</div>
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p style={{ color: '#7c839b' }}>Assessment not found.</p>
        <Link to="/history" className="text-sm hover:underline mt-2 block" style={{ color: '#ba1a1a' }}>← Back to History</Link>
      </div>
    );
  }

  const { risk_probability, risk_level, top_factors, shap_values, nlp_report, input_data, created_at } = prediction;
  const safeTopFactors = top_factors || [];
  const donutData = safeTopFactors.map(f => ({
    name: FEATURE_LABELS[f.feature] || f.feature,
    value: Math.abs(f.shap),
  }));

  return (
    <div className="min-h-screen px-4 py-8 fade-in" style={{ background: '#f7f9fb' }}>
      {/* Print header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-xl font-bold">Heartify Assessment Report — {new Date(created_at).toLocaleDateString()}</h1>
        {profile?.full_name && <p className="text-sm" style={{ color: '#45464d' }}>Patient: {profile.full_name}</p>}
      </div>

      {/* Action buttons row */}
      <div className="no-print flex items-center justify-between mb-6 max-w-6xl mx-auto">
        <Link to="/history" className="flex items-center gap-1 text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: '#45464d' }}>
          <span className="material-symbols-outlined text-base">arrow_back</span>
          History
        </Link>
        <div className="flex gap-2">
          <Link
            to={`/assessment/${id}`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all hover:opacity-80"
            style={{ border: '2px solid #eceef0', color: '#45464d', fontFamily: 'Plus Jakarta Sans' }}
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Update Values
          </Link>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-white transition-all hover:opacity-80"
            style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Print Report
          </button>
          <Link
            to="/hospitals"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all hover:opacity-80"
            style={{ background: '#006c49', color: '#fff', fontFamily: 'Plus Jakarta Sans' }}
          >
            <span className="material-symbols-outlined text-sm">local_hospital</span>
            Find Hospital
          </Link>
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-6xl mx-auto">

        {/* Risk ring — lg:col-span-4 */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-8 shadow-[0_20px_40px_rgba(15,23,42,0.06)] flex flex-col items-center justify-center print-card">
          <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#7c839b' }}>
            {new Date(created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <RiskRing probability={risk_probability} riskLevel={risk_level} size={200} />
          <div className="mt-6 w-full space-y-2">
            {safeTopFactors.slice(0, 3).map(f => {
              const maxShap = Math.max(...safeTopFactors.map(x => Math.abs(x.shap)));
              return (
                <div key={f.feature}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span style={{ color: '#45464d' }}>{FEATURE_LABELS[f.feature] || f.feature}</span>
                    <span className="font-bold" style={{ color: f.shap > 0 ? '#e53e3e' : '#0d9488' }}>
                      {f.shap > 0 ? '+' : ''}{f.shap.toFixed(3)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#eceef0' }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(Math.abs(f.shap) / maxShap) * 100}%`,
                        background: f.shap > 0 ? '#e53e3e' : '#0d9488',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Charts — lg:col-span-8 */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* SHAP waterfall */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)] print-card">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-base" style={{ color: '#006c49', fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
              <h2 className="text-sm font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>SHAP Feature Impact</h2>
            </div>
            <p className="text-xs mb-4" style={{ color: '#7c839b' }}>Red = increases risk · Teal = decreases risk</p>
            {shap_values ? <ShapChart shapValues={shap_values} /> : (
              <p className="text-xs italic" style={{ color: '#7c839b' }}>No SHAP data available.</p>
            )}
          </div>

          {/* Donut chart */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)] print-card">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-base" style={{ color: '#006c49', fontVariationSettings: "'FILL' 1" }}>donut_large</span>
              <h2 className="text-sm font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>Top Factor Contributions</h2>
            </div>
            <p className="text-xs mb-2" style={{ color: '#7c839b' }}>Relative SHAP magnitude</p>
            {donutData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={donutData} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                      dataKey="value" isAnimationActive animationDuration={700}>
                      {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [v.toFixed(3), 'SHAP']}
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #eceef0' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center mt-1">
                  {donutData.map((d, i) => (
                    <span key={i} className="text-xs flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                      <span style={{ color: '#45464d' }}>{d.name}</span>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs italic" style={{ color: '#7c839b' }}>No factor data available.</p>
            )}
          </div>

          {/* Population comparison gauge */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)] print-card md:col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-base" style={{ color: '#006c49', fontVariationSettings: "'FILL' 1" }}>speed</span>
              <h2 className="text-sm font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>Population Comparison</h2>
            </div>
            <p className="text-xs mb-4" style={{ color: '#7c839b' }}>Your risk vs. dataset average (54%)</p>
            <div className="flex items-center justify-center gap-8">
              {/* Semicircular gauge */}
              <div className="relative" style={{ width: '200px', height: '100px' }}>
                <svg viewBox="0 0 200 100" className="w-full h-full">
                  {/* Background arc */}
                  <path
                    d="M 20 90 A 80 80 0 0 1 180 90"
                    fill="none"
                    stroke="#eceef0"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  {/* User risk arc */}
                  <path
                    d="M 20 90 A 80 80 0 0 1 180 90"
                    fill="none"
                    stroke={risk_probability < 0.35 ? '#0d9488' : risk_probability <= 0.65 ? '#f59e0b' : '#e53e3e'}
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeDasharray={`${risk_probability * 251.33} 251.33`}
                    className="transition-all duration-1000"
                    style={{ transformOrigin: 'center', transform: 'rotate(0deg)' }}
                  />
                  {/* Population average marker (54%) */}
                  <line
                    x1={100 + 70 * Math.cos((Math.PI * (1 - 0.54)))}
                    y1={90 - 70 * Math.sin((Math.PI * (1 - 0.54)))}
                    x2={100 + 90 * Math.cos((Math.PI * (1 - 0.54)))}
                    y2={90 - 90 * Math.sin((Math.PI * (1 - 0.54)))}
                    stroke="#7c839b"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  {/* Center text */}
                  <text x="100" y="75" textAnchor="middle" style={{ fontSize: '24px', fontWeight: 'bold', fill: '#131b2e' }}>
                    {(risk_probability * 100).toFixed(0)}%
                  </text>
                  <text x="100" y="90" textAnchor="middle" style={{ fontSize: '10px', fill: '#7c839b' }}>
                    Your Risk
                  </text>
                </svg>
              </div>
              {/* Legend */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: risk_probability < 0.35 ? '#0d9488' : risk_probability <= 0.65 ? '#f59e0b' : '#e53e3e' }} />
                  <span className="text-xs" style={{ color: '#45464d' }}>Your Risk: {(risk_probability * 100).toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5" style={{ background: '#7c839b', borderTop: '2px dashed #7c839b' }} />
                  <span className="text-xs" style={{ color: '#45464d' }}>Population Avg: 54%</span>
                </div>
                <div className="text-xs mt-2" style={{ color: '#7c839b' }}>
                  {risk_probability < 0.54 ? (
                    <span>✓ Below average risk</span>
                  ) : (
                    <span>⚠ Above average risk</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NLP Report — lg:col-span-12 */}
        <div className="lg:col-span-12 bg-white rounded-3xl p-8 shadow-[0_20px_40px_rgba(15,23,42,0.06)] print-card">
          <NLPReport report={nlp_report} riskLevel={risk_level} />
        </div>

        {/* Raw data — lg:col-span-12 */}
        <div className="lg:col-span-12 bg-white rounded-3xl shadow-[0_20px_40px_rgba(15,23,42,0.06)] overflow-hidden print-card">
          <button
            onClick={() => setRawOpen(o => !o)}
            className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-[#f7f9fb]"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base" style={{ color: '#006c49', fontVariationSettings: "'FILL' 1" }}>table_chart</span>
              <span className="text-sm font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>Clinical Data</span>
            </div>
            <span className="material-symbols-outlined text-base" style={{ color: '#7c839b' }}>
              {rawOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>
          {rawOpen && input_data && (
            <div className="overflow-x-auto border-t" style={{ borderColor: '#eceef0' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: '#f7f9fb' }}>
                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#7c839b' }}>Parameter</th>
                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#7c839b' }}>Value</th>
                    <th className="text-left px-6 py-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#7c839b' }}>Reference Range</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(input_data).map(([k, v]) => (
                    <tr key={k} className="border-t" style={{ borderColor: '#eceef0' }}>
                      <td className="px-6 py-3" style={{ color: '#45464d' }}>{FEATURE_LABELS[k] || k}</td>
                      <td className="px-6 py-3 font-semibold" style={{ color: '#131b2e' }}>{v}</td>
                      <td className="px-6 py-3 text-xs" style={{ color: '#7c839b' }}>{REFERENCE_RANGES[k] || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
