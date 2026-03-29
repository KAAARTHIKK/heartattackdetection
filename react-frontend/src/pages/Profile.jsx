import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const FEATURE_LABELS = {
  age: 'Age', sex: 'Sex', cp: 'Chest Pain Type', trestbps: 'Resting BP (mmHg)',
  chol: 'Cholesterol (mg/dl)', fbs: 'Fasting Blood Sugar', restecg: 'Resting ECG',
  thalach: 'Max Heart Rate (bpm)', exang: 'Exercise Angina', oldpeak: 'ST Depression',
  slope: 'ST Slope', ca: 'Major Vessels', thal: 'Thalassemia',
};

function downloadCSV(predictions) {
  const headers = ['id', 'created_at', 'risk_probability', 'risk_level', 'predicted_class', ...Object.keys(FEATURE_LABELS)];
  const rows = predictions.map(p => [
    p.id, p.created_at, p.risk_probability, p.risk_level, p.predicted_class,
    ...Object.keys(FEATURE_LABELS).map(k => p.input_data?.[k] ?? ''),
  ]);
  const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `heartify-data-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatPill({ label, value, color }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-extrabold" style={{ fontFamily: 'Plus Jakarta Sans', color: color || '#131b2e' }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: '#7c839b' }}>{label}</p>
    </div>
  );
}

export default function Profile({ user }) {
  const [profile,     setProfile]     = useState({ full_name: '', dob: '', sex: '' });
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState('');
  const [exporting,   setExporting]   = useState(false);
  const [predictions, setPredictions] = useState([]);
  const [deleting,    setDeleting]    = useState(false);
  const [confirmDel,  setConfirmDel]  = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('profiles').select('full_name, dob, sex').eq('id', user.id).single(),
      supabase.from('predictions').select('risk_probability, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]).then(([{ data: prof, error: profError }, { data: preds, error: predsError }]) => {
      if (profError) console.error('Profile fetch error:', profError);
      if (predsError) console.error('Predictions fetch error:', predsError);
      
      if (prof) setProfile({
        full_name: prof.full_name || '',
        dob:       prof.dob || '',
        sex:       prof.sex != null ? String(prof.sex) : '',
      });
      setPredictions(preds || []);
      setLoading(false);
    });
  }, [user.id]);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    const { error: err } = await supabase.from('profiles').upsert({
      id:        user.id,
      full_name: profile.full_name || null,
      dob:       profile.dob || null,
      sex:       profile.sex !== '' ? parseInt(profile.sex) : null,
    });
    if (err) setError(err.message);
    else setSaved(true);
    setSaving(false);
  }

  async function handleExport() {
    setExporting(true);
    const { data } = await supabase.from('predictions').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    downloadCSV(data || []);
    setExporting(false);
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    await supabase.from('predictions').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.signOut();
  }

  const initials = (profile.full_name || user.email || 'U')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const patientId = user.id?.slice(-8).toUpperCase() || '—';
  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—';

  const scores = (predictions || []).map(p => p.risk_probability);
  const avgScore = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) : null;
  const minScore = scores.length ? Math.round(Math.min(...scores) * 100) : null;
  const maxScore = scores.length ? Math.round(Math.max(...scores) * 100) : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f7f9fb' }}>
        <div className="text-sm animate-pulse" style={{ color: '#7c839b' }}>Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 fade-in" style={{ background: '#f7f9fb' }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-extrabold mb-6" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left column: identity card + stats */}
          <div className="space-y-4">

            {/* Identity card */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)] text-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-extrabold text-white mx-auto mb-4"
                style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
              >
                {initials}
              </div>
              <h2 className="text-lg font-bold mb-0.5" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>
                {profile.full_name || 'Patient'}
              </h2>
              <p className="text-xs mb-3" style={{ color: '#7c839b' }}>{user.email}</p>
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: '#dcfce7', color: '#16a34a' }}>Active</span>
              </div>
              <div className="text-left space-y-2 border-t pt-4" style={{ borderColor: '#eceef0' }}>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#7c839b' }}>Patient ID</span>
                  <span className="font-mono font-bold" style={{ color: '#131b2e' }}>{patientId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: '#7c839b' }}>Joined</span>
                  <span style={{ color: '#131b2e' }}>{joinedDate}</span>
                </div>
                {profile.dob && (
                  <div className="flex justify-between text-xs">
                    <span style={{ color: '#7c839b' }}>Date of Birth</span>
                    <span style={{ color: '#131b2e' }}>{new Date(profile.dob).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats summary */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: '#7c839b' }}>Assessment Summary</h3>
              <div className="grid grid-cols-3 gap-2">
                <StatPill label="Total" value={predictions.length} />
                <StatPill label="Avg Score" value={avgScore != null ? `${avgScore}%` : '—'} />
                <StatPill label="Best" value={minScore != null ? `${minScore}%` : '—'} color="#16a34a" />
              </div>
              {maxScore != null && (
                <div className="mt-3 pt-3 border-t text-center" style={{ borderColor: '#eceef0' }}>
                  <p className="text-xs" style={{ color: '#7c839b' }}>Highest risk score: <span className="font-bold" style={{ color: '#dc2626' }}>{maxScore}%</span></p>
                </div>
              )}
            </div>
          </div>

          {/* Right 2 columns: form + data management */}
          <div className="lg:col-span-2 space-y-4">

            {/* Clinical Profile form */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-base" style={{ color: '#006c49', fontVariationSettings: "'FILL' 1" }}>person</span>
                <h2 className="text-base font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>Clinical Profile Data</h2>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#45464d' }}>Email</label>
                  <input type="text" value={user.email} disabled
                    className="w-full px-4 py-3 rounded-xl text-sm"
                    style={{ background: '#f7f9fb', border: '1px solid #eceef0', color: '#7c839b' }} />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#45464d' }}>Full Name</label>
                  <input
                    type="text"
                    value={profile.full_name}
                    onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{ background: '#f2f4f6', border: '1px solid #eceef0', color: '#191c1e' }}
                    onFocus={e => e.target.style.borderColor = '#131b2e'}
                    onBlur={e => e.target.style.borderColor = '#eceef0'}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#45464d' }}>Date of Birth</label>
                    <input
                      type="date"
                      value={profile.dob}
                      onChange={e => setProfile(p => ({ ...p, dob: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: '#f2f4f6', border: '1px solid #eceef0', color: '#191c1e' }}
                      onFocus={e => e.target.style.borderColor = '#131b2e'}
                      onBlur={e => e.target.style.borderColor = '#eceef0'}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: '#45464d' }}>Biological Sex</label>
                    <select
                      value={profile.sex}
                      onChange={e => setProfile(p => ({ ...p, sex: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                      style={{ background: '#f2f4f6', border: '1px solid #eceef0', color: '#191c1e' }}
                      onFocus={e => e.target.style.borderColor = '#131b2e'}
                      onBlur={e => e.target.style.borderColor = '#eceef0'}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="1">Male</option>
                      <option value="0">Female</option>
                    </select>
                  </div>
                </div>
                {error && (
                  <div className="p-3 rounded-xl text-sm" style={{ background: '#fee2e2', color: '#dc2626' }}>{error}</div>
                )}
                {saved && (
                  <div className="p-3 rounded-xl text-sm" style={{ background: '#dcfce7', color: '#16a34a' }}>Profile saved successfully.</div>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                  style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
                >
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </form>
            </div>

            {/* Data Management */}
            <div className="bg-white rounded-2xl p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)]">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-base" style={{ color: '#006c49', fontVariationSettings: "'FILL' 1" }}>database</span>
                <h2 className="text-base font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>Data Management</h2>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl mb-3" style={{ background: '#f7f9fb', border: '1px solid #eceef0' }}>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#131b2e' }}>Export Your Data</p>
                  <p className="text-xs mt-0.5" style={{ color: '#7c839b' }}>Download all assessments as CSV</p>
                </div>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all hover:opacity-80 disabled:opacity-60"
                  style={{ border: '2px solid #eceef0', color: '#45464d', fontFamily: 'Plus Jakarta Sans' }}
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  {exporting ? 'Preparing…' : 'Export CSV'}
                </button>
              </div>

              {/* Danger zone */}
              <div className="p-4 rounded-xl" style={{ background: '#fff8f8', border: '1px solid #fecaca' }}>
                <p className="text-sm font-bold mb-0.5" style={{ color: '#dc2626' }}>Danger Zone</p>
                <p className="text-xs mb-3" style={{ color: '#7c839b' }}>Permanently delete your account and all data. This cannot be undone.</p>
                {!confirmDel ? (
                  <button
                    onClick={() => setConfirmDel(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all hover:opacity-80"
                    style={{ background: '#fee2e2', color: '#dc2626', fontFamily: 'Plus Jakarta Sans' }}
                  >
                    <span className="material-symbols-outlined text-sm">delete_forever</span>
                    Delete Account
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDel(false)}
                      className="px-4 py-2 rounded-full text-xs font-bold transition-all"
                      style={{ border: '2px solid #eceef0', color: '#45464d', fontFamily: 'Plus Jakarta Sans' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="px-4 py-2 rounded-full text-xs font-bold text-white transition-all hover:opacity-80 disabled:opacity-60"
                      style={{ background: '#dc2626', fontFamily: 'Plus Jakarta Sans' }}
                    >
                      {deleting ? 'Deleting…' : 'Yes, Delete Everything'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
