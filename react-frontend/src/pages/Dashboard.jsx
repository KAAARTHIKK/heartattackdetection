import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import RiskTrendChart from '../components/RiskTrendChart';

function riskBadge(level) {
  if (!level) return { bg: '#f1f5f9', color: '#64748b' };
  if (level.includes('Low'))  return { bg: '#dcfce7', color: '#16a34a' };
  if (level.includes('High')) return { bg: '#fee2e2', color: '#dc2626' };
  return { bg: '#fef3c7', color: '#d97706' };
}

function riskTrend(predictions) {
  if (predictions.length < 2) return null;
  const latest = predictions[0].risk_probability;
  const prev   = predictions[1].risk_probability;
  const diff   = latest - prev;
  if (diff < -0.05) return { label: 'Improving', icon: 'trending_down', color: '#16a34a' };
  if (diff >  0.05) return { label: 'Worsening', icon: 'trending_up',   color: '#dc2626' };
  return { label: 'Stable', icon: 'trending_flat', color: '#d97706' };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [profile, setProfile]         = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      supabase
        .from('predictions')
        .select('id, risk_probability, risk_level, top_factors, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single(),
    ]).then(([{ data: preds }, { data: prof }]) => {
      setPredictions(preds || []);
      setProfile(prof);
      setLoading(false);
    }).catch(err => {
      console.error('Dashboard data fetch error:', err);
      setPredictions([]);
      setLoading(false);
    });
  }, [user.id]);

  const latest  = predictions[0];
  const trend   = riskTrend(predictions);
  const badge   = riskBadge(latest?.risk_level);
  const firstName = profile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'there';
  const initials  = (profile?.full_name || user.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f9fb' }}>
        <div className="text-sm animate-pulse" style={{ color: '#7c839b' }}>Loading dashboard…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto fade-in" style={{ background: '#f7f9fb' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>
            {getGreeting()}, {firstName}
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#7c839b' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-white" style={{ background: '#eceef0' }}>
            <span className="material-symbols-outlined text-base" style={{ color: '#45464d' }}>notifications</span>
          </button>
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer transition-opacity hover:opacity-80" style={{ background: '#131b2e' }}>
            {initials}
          </button>
        </div>
      </div>

      {predictions.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: '#f7f9fb' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2.5rem', color: '#006c49', fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </div>
          <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>No assessments yet</h2>
          <p className="text-sm mb-8" style={{ color: '#7c839b' }}>Run your first cardiac risk assessment to see your results here.</p>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-white font-bold text-sm hover:opacity-90 transition-all"
            style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Start Assessment
          </Link>
        </div>
      ) : (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

            {/* Card 1: Last Risk Score */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_20px_40px_rgba(15,23,42,0.06)] relative overflow-hidden">
              <div className="absolute -top-3 -right-3 pointer-events-none" aria-hidden>
                <span className="material-symbols-outlined" style={{ fontSize: '5rem', color: '#131b2e', opacity: 0.04, fontVariationSettings: "'FILL' 1" }}>monitor_heart</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7c839b' }}>Last Risk Score</p>
              <p className="text-4xl font-extrabold mb-2" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>
                {Math.round((latest?.risk_probability ?? 0) * 100)}%
              </p>
              <div className="h-1.5 rounded-full mb-3" style={{ background: '#eceef0' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.round((latest?.risk_probability ?? 0) * 100)}%`, background: badge.color }}
                />
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                {latest?.risk_level || '—'}
              </span>
            </div>

            {/* Card 2: Total Assessments */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_20px_40px_rgba(15,23,42,0.06)] relative overflow-hidden">
              <div className="absolute -top-3 -right-3 pointer-events-none" aria-hidden>
                <span className="material-symbols-outlined" style={{ fontSize: '5rem', color: '#131b2e', opacity: 0.04, fontVariationSettings: "'FILL' 1" }}>history</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7c839b' }}>Total Assessments</p>
              <p className="text-4xl font-extrabold mb-2" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>
                {predictions.length}
              </p>
              <p className="text-xs" style={{ color: '#7c839b' }}>
                Last: {latest ? new Date(latest.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
              </p>
            </div>

            {/* Card 3: Risk Trend */}
            <div className="bg-white rounded-2xl p-5 shadow-[0_20px_40px_rgba(15,23,42,0.06)] relative overflow-hidden">
              <div className="absolute -top-3 -right-3 pointer-events-none" aria-hidden>
                <span className="material-symbols-outlined" style={{ fontSize: '5rem', color: '#131b2e', opacity: 0.04, fontVariationSettings: "'FILL' 1" }}>trending_up</span>
              </div>
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#7c839b' }}>Risk Trend</p>
              {trend ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-2xl" style={{ color: trend.color, fontVariationSettings: "'FILL' 1" }}>{trend.icon}</span>
                    <p className="text-2xl font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans', color: trend.color }}>{trend.label}</p>
                  </div>
                  <p className="text-xs" style={{ color: '#7c839b' }}>Compared to previous assessment</p>
                </>
              ) : (
                <p className="text-sm" style={{ color: '#7c839b' }}>Need 2+ assessments</p>
              )}
            </div>
          </div>

          {/* Longitudinal Risk Analysis */}
          <div className="bg-white rounded-2xl p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)] mb-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>Longitudinal Risk Analysis</h2>
                <p className="text-xs mt-0.5" style={{ color: '#7c839b' }}>Your cardiac risk score over time</p>
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: '#7c839b' }}>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded inline-block" style={{ background: '#16a34a' }} />Low
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded inline-block" style={{ background: '#d97706' }} />Moderate
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded inline-block" style={{ background: '#dc2626' }} />High
                </span>
              </div>
            </div>
            <RiskTrendChart predictions={predictions} />
          </div>

          {/* Recent Assessments */}
          <div className="bg-white rounded-2xl shadow-[0_20px_40px_rgba(15,23,42,0.06)] p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>Recent Assessments</h2>
              <Link to="/history" className="text-xs font-bold hover:underline" style={{ color: '#006c49' }}>View all →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(predictions || []).slice(0, 3).map(p => {
                const b = riskBadge(p.risk_level);
                return (
                  <div key={p.id} className="bg-white border rounded-xl p-5 hover:shadow-lg transition-all" style={{ borderColor: '#eceef0' }}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold" style={{ color: '#7c839b' }}>
                        {new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="material-symbols-outlined text-base" style={{ color: '#7c839b' }}>calendar_today</span>
                    </div>
                    <div className="mb-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: b.bg, color: b.color }}>
                        {p.risk_level}
                      </span>
                    </div>
                    <p className="text-2xl font-extrabold mb-4" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>
                      {Math.round(p.risk_probability * 100)}%
                    </p>
                    <Link
                      to={`/results/${p.id}`}
                      className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-full text-xs font-bold transition-all hover:opacity-80"
                      style={{ background: '#131b2e', color: '#fff' }}
                    >
                      View Results
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
