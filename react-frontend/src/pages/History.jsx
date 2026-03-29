import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import RiskTrendChart from '../components/RiskTrendChart';

const CIRC = 2 * Math.PI * 28;

function MiniRing({ probability }) {
  const pct = Math.round(probability * 100);
  const color = pct < 35 ? '#16a34a' : pct < 65 ? '#d97706' : '#e53e3e';
  const offset = CIRC - (pct / 100) * CIRC;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-label={`${pct}%`}>
      <circle cx="32" cy="32" r="28" fill="none" stroke="#eceef0" strokeWidth="6" />
      <circle cx="32" cy="32" r="28" fill="none" stroke={color} strokeWidth="6"
        strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={offset}
        style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.8s ease' }} />
      <text x="32" y="36" textAnchor="middle" fontSize="12" fontWeight="700" fill={color}>{pct}%</text>
    </svg>
  );
}

function riskBadgeStyle(level) {
  if (!level) return { bg: '#f1f5f9', color: '#64748b' };
  if (level.includes('Low'))  return { bg: '#dcfce7', color: '#16a34a' };
  if (level.includes('High')) return { bg: '#fee2e2', color: '#dc2626' };
  return { bg: '#fef3c7', color: '#d97706' };
}

const PAGE_SIZE = 9;
const FILTERS = [
  { label: 'All Time', days: null },
  { label: '6 Months', days: 180 },
  { label: '30 Days',  days: 30 },
];

export default function History({ user }) {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState(null);
  const [page, setPage]               = useState(1);

  useEffect(() => {
    supabase
      .from('predictions')
      .select('id, risk_probability, risk_level, top_factors, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('History fetch error:', error);
          setPredictions([]);
        } else {
          setPredictions(data || []);
        }
        setLoading(false);
      });
  }, [user.id]);

  const filtered = useMemo(() => {
    if (!filter) return predictions;
    const cutoff = new Date(Date.now() - filter * 24 * 60 * 60 * 1000);
    return predictions.filter(p => new Date(p.created_at) >= cutoff);
  }, [predictions, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleFilter(days) {
    setFilter(days);
    setPage(1);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f9fb' }}>
        <div className="text-sm animate-pulse" style={{ color: '#7c839b' }}>Loading history…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-5xl mx-auto fade-in" style={{ background: '#f7f9fb' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>Assessment History</h1>
          <p className="text-sm mt-0.5" style={{ color: '#7c839b' }}>{filtered.length} assessment{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          to="/assessment"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white hover:opacity-90 transition-all"
          style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          New Assessment
        </Link>
      </div>

      {/* Time filter chips */}
      <div className="flex gap-2 mb-6">
        {FILTERS.map(f => (
          <button
            key={f.label}
            onClick={() => handleFilter(f.days)}
            className="px-4 py-2 rounded-full text-xs font-bold transition-all"
            style={{
              background: filter === f.days ? '#131b2e' : '#fff',
              color: filter === f.days ? '#fff' : '#45464d',
              border: `2px solid ${filter === f.days ? '#131b2e' : '#eceef0'}`,
              fontFamily: 'Plus Jakarta Sans',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {predictions.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: '#f7f9fb' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '2rem', color: '#006c49', fontVariationSettings: "'FILL' 1" }}>history</span>
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>No assessments yet</h2>
          <p className="text-sm mb-6" style={{ color: '#7c839b' }}>Your assessment history will appear here.</p>
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white hover:opacity-90 transition-all"
            style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
          >
            Start First Assessment
          </Link>
        </div>
      ) : (
        <>
          {/* Trend chart */}
          <div className="bg-white rounded-3xl p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)] mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-base" style={{ color: '#006c49', fontVariationSettings: "'FILL' 1" }}>show_chart</span>
              <h2 className="text-base font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>Risk Trend Analysis</h2>
            </div>
            <RiskTrendChart predictions={filtered} />
          </div>

          {/* Assessment cards */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
              <p className="text-sm" style={{ color: '#7c839b' }}>No assessments in this time period.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                {(paginated || []).map(p => {
                  const badge = riskBadgeStyle(p.risk_level);
                  const topFactors = (p.top_factors || []).slice(0, 3);
                  return (
                    <div key={p.id} className="bg-white rounded-3xl p-5 shadow-[0_20px_40px_rgba(15,23,42,0.06)] flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <MiniRing probability={p.risk_probability} />
                        <div className="flex-1 min-w-0">
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{ background: badge.bg, color: badge.color }}
                          >
                            {p.risk_level}
                          </span>
                          <p className="text-xs mt-1.5" style={{ color: '#7c839b' }}>
                            {new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </p>
                          {p.updated_at !== p.created_at && (
                            <p className="text-xs" style={{ color: '#c6c6cd' }}>
                              Updated {new Date(p.updated_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {topFactors.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#7c839b' }}>Top Factors</p>
                          <div className="flex flex-wrap gap-1.5">
                            {topFactors.map(f => (
                              <span
                                key={f.feature}
                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  background: f.shap > 0 ? '#fee2e2' : '#dcfce7',
                                  color: f.shap > 0 ? '#dc2626' : '#16a34a',
                                }}
                              >
                                {f.feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 mt-auto">
                        <Link
                          to={`/assessment/${p.id}`}
                          className="flex-1 text-center py-2 rounded-full text-xs font-bold transition-all hover:opacity-80"
                          style={{ border: '2px solid #eceef0', color: '#45464d', fontFamily: 'Plus Jakarta Sans' }}
                        >
                          Update Values
                        </Link>
                        <Link
                          to={`/results/${p.id}`}
                          className="flex-1 text-center py-2 rounded-full text-xs font-bold text-white transition-all hover:opacity-80"
                          style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
                        >
                          View Full Report
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
                    style={{ background: '#fff', border: '2px solid #eceef0' }}
                  >
                    <span className="material-symbols-outlined text-base" style={{ color: '#45464d' }}>chevron_left</span>
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className="w-9 h-9 rounded-full text-sm font-bold transition-all"
                      style={{
                        background: page === n ? '#131b2e' : '#fff',
                        color: page === n ? '#fff' : '#45464d',
                        border: `2px solid ${page === n ? '#131b2e' : '#eceef0'}`,
                        fontFamily: 'Plus Jakarta Sans',
                      }}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
                    style={{ background: '#fff', border: '2px solid #eceef0' }}
                  >
                    <span className="material-symbols-outlined text-base" style={{ color: '#45464d' }}>chevron_right</span>
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
