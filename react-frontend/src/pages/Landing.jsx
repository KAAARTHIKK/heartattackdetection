import { Link } from 'react-router-dom';

const FEATURES = [
  {
    icon: 'shield',
    iconBg: 'bg-[#6cf8bb]/30',
    iconColor: '#00714d',
    title: 'Clinically Validated',
    desc: 'Based on UCI Heart Disease dataset, 303+ patient records analyzed to provide peer-reviewed statistical confidence.',
  },
  {
    icon: 'psychology',
    iconBg: 'bg-[#dae2fd]',
    iconColor: '#131b2e',
    title: 'AI Explainability',
    desc: "SHAP analysis shows exactly which factors drive your risk. We don't believe in \"black box\" medical diagnostics.",
  },
  {
    icon: 'description',
    iconBg: 'bg-[#ffdad8]',
    iconColor: '#410007',
    title: 'Plain English Reports',
    desc: 'AI converts clinical data into language you understand. Actionable takeaways without the medical jargon.',
  },
];

const STATS = [
  { value: '98.4%', label: 'Accuracy Rate' },
  { value: '120k+', label: 'Assessments' },
  { value: 'UCI',   label: 'Validated Data' },
  { value: 'HIPAA', label: 'Secure Tech' },
];

export default function Landing({ user }) {
  return (
    <div className="min-h-screen" style={{ background: '#f7f9fb', fontFamily: 'Inter, sans-serif' }}>
      {/* Top Nav */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="flex justify-between items-center h-16 px-6 md:px-12">
          <span className="text-2xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Heartify
          </span>
          <div className="flex gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="px-6 py-2.5 rounded-full text-sm font-bold text-white hover:opacity-90 transition-all"
                style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/auth" className="px-5 py-2.5 text-slate-600 rounded-full text-sm font-semibold hover:bg-slate-100 transition-colors">
                  Sign In
                </Link>
                <Link
                  to="/auth"
                  className="px-6 py-2.5 rounded-full text-sm font-bold text-white hover:opacity-90 transition-all"
                  style={{ background: '#ba1a1a', fontFamily: 'Plus Jakarta Sans' }}
                >
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
        <div className="h-px bg-slate-100 w-full" />
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden pt-16">
        {/* ECG animation */}
        <div className="absolute top-20 left-0 w-full h-24 opacity-20 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 1000 100" fill="none">
            <path
              className="ecg-animate"
              d="M0,50 L200,50 L210,30 L220,70 L230,50 L350,50 L360,10 L375,90 L390,50 L550,50 L560,45 L570,55 L580,50 L700,50 L715,20 L730,80 L745,50 L1000,50"
              stroke="#f1414d"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 pt-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[11px] font-bold uppercase tracking-widest"
            style={{ background: '#6cf8bb30', color: '#00714d', borderColor: '#6cf8bb50' }}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            Clinical Intelligence Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1]" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>
            Know Your Heart Risk{' '}
            <br />
            <span style={{ color: '#f1414d' }}>Before It's Too Late</span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: '#7c839b' }}>
            AI-powered cardiac risk assessment in under 2 minutes. Get precision insights powered by clinical datasets.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/auth"
              className="px-8 py-4 rounded-full font-bold text-lg text-white flex items-center gap-2 hover:shadow-lg transition-all active:scale-95 group"
              style={{ background: '#ba1a1a', fontFamily: 'Plus Jakarta Sans' }}
            >
              Get Started Free
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </Link>
            <a
              href="#features"
              className="px-8 py-4 border-2 rounded-full font-bold text-lg hover:text-white transition-all active:scale-95"
              style={{ borderColor: '#131b2e', color: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#131b2e'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#131b2e'; }}
            >
              See How It Works
            </a>
          </div>

          {/* Stats */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60">
            {STATS.map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>{s.value}</span>
                <span className="text-[11px] uppercase tracking-wider" style={{ fontFamily: 'Inter' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Background glows */}
        <div className="absolute -bottom-48 -left-48 w-96 h-96 rounded-full blur-[120px]" style={{ background: '#6cf8bb20' }} />
        <div className="absolute -top-48 -right-48 w-96 h-96 rounded-full blur-[120px]" style={{ background: '#ffdad620' }} />
      </section>

      {/* Feature cards */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map(f => (
            <div
              key={f.title}
              className="group p-8 rounded-2xl bg-white transition-all duration-300 hover:-translate-y-2 relative overflow-hidden shadow-sm"
            >
              <div className={`w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center mb-6`}>
                <span className="material-symbols-outlined text-3xl" style={{ color: f.iconColor, fontVariationSettings: "'FILL' 1" }}>
                  {f.icon}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-3" style={{ fontFamily: 'Plus Jakarta Sans', color: '#131b2e' }}>{f.title}</h3>
              <p className="leading-relaxed text-sm" style={{ color: '#7c839b' }}>{f.desc}</p>
              <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined" style={{ fontSize: '6rem', color: '#131b2e' }}>{f.icon}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dark CTA section */}
      <section className="py-24 overflow-hidden" style={{ background: '#131b2e' }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Precision at your fingertips
            </h2>
            <p className="text-lg leading-relaxed" style={{ color: '#7c839b' }}>
              Our dashboard provides a 360-degree view of your cardiovascular health. Monitor trends, get alerts, and stay ahead of potential issues.
            </p>
            <ul className="space-y-4">
              {['Real-time heart rate variability tracking', 'Automated medical report generation', 'Secure sharing with primary care physicians'].map(item => (
                <li key={item} className="flex items-center gap-3 text-white/90">
                  <span className="material-symbols-outlined" style={{ color: '#6cf8bb', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white hover:opacity-90 transition-all active:scale-95"
              style={{ background: '#ba1a1a', fontFamily: 'Plus Jakarta Sans' }}
            >
              Start Free Assessment
              <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700" style={{ border: '8px solid rgba(255,255,255,0.1)' }}>
              <div className="bg-white/10 h-64 flex items-center justify-center">
                <span className="material-symbols-outlined text-white/30" style={{ fontSize: '8rem', fontVariationSettings: "'FILL' 1" }}>monitor_heart</span>
              </div>
            </div>
            <div className="absolute -top-10 -right-10 px-6 py-4 rounded-2xl shadow-xl hidden md:block" style={{ background: '#006c49' }}>
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg" style={{ background: 'rgba(255,255,255,0.2)' }}>
                  <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
                </div>
                <div className="text-white">
                  <div className="text-[10px] uppercase tracking-widest font-bold opacity-80">Health Score</div>
                  <div className="text-xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>94/100</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-slate-100 w-full mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="font-bold text-slate-900 text-xl" style={{ fontFamily: 'Plus Jakarta Sans' }}>Heartify</div>
              <p className="text-xs uppercase tracking-widest text-slate-400 leading-relaxed">
                © {new Date().getFullYear()} Heartify Clinical. All rights reserved.
                <br />Medical Disclaimer: For informational purposes only.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-4 md:justify-end items-center">
              {['Privacy Policy', 'Terms of Service', 'Contact Support', 'Medical Advisory'].map(l => (
                <a key={l} href="#" className="text-xs uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
