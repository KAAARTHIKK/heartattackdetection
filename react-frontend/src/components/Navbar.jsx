import { Link, useLocation } from 'react-router-dom';

const NAV_LINKS = [
  { to: '/dashboard',  label: 'Dashboard',  icon: 'dashboard' },
  { to: '/assessment', label: 'Assessment', icon: 'quiz' },
  { to: '/history',    label: 'History',    icon: 'history' },
  { to: '/hospitals',  label: 'Hospitals',  icon: 'local_hospital' },
];

export default function Navbar({ user, onSignOut }) {
  const { pathname } = useLocation();

  return (
    <aside className="no-print fixed left-0 top-0 h-full w-64 bg-slate-50 flex flex-col py-8 z-40 hidden lg:flex">
      {/* Logo */}
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#131b2e' }}>
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'Plus Jakarta Sans' }}>Heartify</h1>
          <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#7c839b' }}>Clinical Precision</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 space-y-1 px-4">
        {NAV_LINKS.map(({ to, label, icon }) => {
          const active = pathname === to || (to !== '/dashboard' && pathname.startsWith(to));
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 hover:translate-x-1 ${
                active
                  ? 'bg-white text-teal-600 shadow-sm font-bold'
                  : 'text-slate-500 hover:bg-slate-100 font-medium'
              }`}
              style={{ fontFamily: 'Plus Jakarta Sans' }}
            >
              <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {icon}
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-4 mt-auto space-y-2">
        <Link
          to="/assessment"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-full text-white text-sm font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all"
          style={{ background: '#131b2e', fontFamily: 'Plus Jakarta Sans' }}
        >
          <span className="material-symbols-outlined text-sm">add_circle</span>
          New Assessment
        </Link>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 rounded-xl text-sm font-medium transition-all"
          style={{ fontFamily: 'Plus Jakarta Sans' }}
        >
          <span className="material-symbols-outlined">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
