import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function Field({ label, id, type, value, onChange, placeholder, extra }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center px-1">
        <label
          htmlFor={id}
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: '#45464d', fontFamily: 'Inter' }}
        >
          {label}
        </label>
        {extra}
      </div>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-[#f2f4f6] border-0 ring-1 ring-[#c6c6cd]/20 focus:ring-2 focus:ring-[#131b2e] rounded-xl px-4 py-3.5 text-sm transition-all outline-none"
      />
    </div>
  );
}

function LoginForm({ onSwitch }) {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) { setError(err.message); setLoading(false); return; }
    navigate('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#191c1e' }}>Welcome back</h2>
        <p className="text-sm" style={{ color: '#45464d' }}>Enter your credentials to access your clinical dashboard.</p>
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email Address" id="email" type="email" value={email}
          onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
        <Field label="Password" id="password" type="password" value={password}
          onChange={e => setPassword(e.target.value)} placeholder="••••••••"
          extra={
            <a href="#" className="text-[11px] font-bold uppercase tracking-wider hover:opacity-70 transition-colors"
              style={{ color: '#7c839b' }}>
              Forgot password?
            </a>
          }
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full text-white font-bold py-4 rounded-full shadow-md hover:opacity-90 active:scale-[0.98] transition-all mt-4 disabled:opacity-60"
          style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
      <p className="text-center text-sm" style={{ color: '#45464d' }}>
        No account?{' '}
        <button type="button" onClick={onSwitch} className="font-bold hover:underline" style={{ color: '#131b2e' }}>
          Register here
        </button>
      </p>
    </div>
  );
}

function RegisterForm({ onSwitch }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [dob, setDob]           = useState('');
  const [sex, setSex]           = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    // Create profile row
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        dob: dob || null,
        sex: sex === 'male' ? 1 : sex === 'female' ? 0 : null,
      });
    }
    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); setLoading(false); return; }
    }
    navigate('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans', color: '#191c1e' }}>Join Heartify</h2>
        <p className="text-sm" style={{ color: '#45464d' }}>Start your journey toward clinical cardiac clarity.</p>
      </div>
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Full Name" id="reg-name" type="text" value={fullName}
          onChange={e => setFullName(e.target.value)} placeholder="" />
        <Field label="Email Address" id="reg-email" type="email" value={email}
          onChange={e => setEmail(e.target.value)} placeholder="" />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date of Birth" id="reg-dob" type="date" value={dob}
            onChange={e => setDob(e.target.value)} placeholder="" />
          <div>
            <div className="flex justify-between items-center px-1 mb-1.5">
              <label className="text-xs font-bold uppercase tracking-widest" style={{ color: '#45464d', fontFamily: 'Inter' }}>Sex</label>
            </div>
            <div className="flex gap-4 h-[50px] items-center">
              {['male', 'female'].map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="sex" value={s} checked={sex === s}
                    onChange={() => setSex(s)}
                    className="accent-[#131b2e]" />
                  <span className="text-sm capitalize">{s}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <Field label="Password" id="reg-pass" type="password" value={password}
          onChange={e => setPassword(e.target.value)} placeholder="" />
        <Field label="Confirm Password" id="reg-confirm" type="password" value={confirm}
          onChange={e => setConfirm(e.target.value)} placeholder="" />
        <button
          type="submit"
          disabled={loading}
          className="w-full text-white font-bold py-4 rounded-full shadow-md hover:opacity-90 active:scale-[0.98] transition-all mt-2 disabled:opacity-60"
          style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
        >
          {loading ? 'Creating…' : 'Create Account'}
        </button>
      </form>
      <p className="text-center text-sm" style={{ color: '#45464d' }}>
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} className="font-bold hover:underline" style={{ color: '#131b2e' }}>
          Sign in
        </button>
      </p>
    </div>
  );
}

export default function Auth() {
  const [mode, setMode] = useState('login');

  return (
    <div className="flex h-screen w-full" style={{ background: '#f7f9fb' }}>
      {/* Left editorial panel */}
      <section
        className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden p-20"
        style={{ background: '#131b2e' }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="relative z-10 max-w-lg">
          <div className="mb-8">
            <svg className="w-full h-32" fill="none" viewBox="0 0 400 100" style={{ color: '#006c49', opacity: 0.8 }}>
              <path d="M0 50H120L130 20L150 80L170 10L190 90L210 30L220 50H400"
                stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Your heart tells a story. Let's understand it.
          </h1>
          <p className="text-lg font-medium leading-relaxed" style={{ color: '#7c839b' }}>
            Advanced clinical intelligence for your most vital organ. Join 20,000+ patients tracking their cardiac health with medical-grade precision.
          </p>
          <div className="mt-12 flex gap-4 items-center">
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: '#7c839b' }}>Trusted by Experts</span>
          </div>
        </div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full blur-[120px]" style={{ background: 'rgba(0,108,73,0.1)' }} />
      </section>

      {/* Right form panel */}
      <section className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto" style={{ background: '#f2f4f6' }}>
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-8 md:p-10">
            {/* Tab toggle */}
            <div className="flex p-1 rounded-full mb-10" style={{ background: '#eceef0' }}>
              {['login', 'register'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setMode(tab)}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-full transition-all capitalize"
                  style={{
                    fontFamily: 'Plus Jakarta Sans',
                    background: mode === tab ? '#ffffff' : 'transparent',
                    color: mode === tab ? '#191c1e' : '#45464d',
                    boxShadow: mode === tab ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {tab === 'login' ? 'Login' : 'Register'}
                </button>
              ))}
            </div>

            {mode === 'login'
              ? <LoginForm onSwitch={() => setMode('register')} />
              : <RegisterForm onSwitch={() => setMode('login')} />
            }
          </div>
          <p className="mt-8 text-center text-[11px] uppercase tracking-widest" style={{ color: 'rgba(69,70,77,0.6)', fontFamily: 'Inter' }}>
            © {new Date().getFullYear()} Heartify Clinical. All rights reserved.
            <br />Medical Disclaimer: For informational purposes only.
          </p>
        </div>
      </section>
    </div>
  );
}
