import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './lib/supabase';

import Landing       from './pages/Landing';
import Auth          from './pages/Auth';
import Dashboard     from './pages/Dashboard';
import Assessment    from './pages/Assessment';
import Results       from './pages/Results';
import History       from './pages/History';
import HospitalFinder from './pages/HospitalFinder';
import Profile       from './pages/Profile';
import Navbar        from './components/Navbar';

function ProtectedRoute({ user, children }) {
  const location = useLocation();
  if (!user) return <Navigate to="/auth" state={{ from: location }} replace />;
  return children;
}

function AppRoutes({ user }) {
  return (
    <>
      {user && <Navbar user={user} onSignOut={() => supabase.auth.signOut()} />}
      <div className={user ? 'lg:ml-64' : ''}>
      <Routes>
        <Route path="/"         element={<Landing user={user} />} />
        <Route path="/auth"     element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
        <Route path="/dashboard" element={
          <ProtectedRoute user={user}><Dashboard user={user} /></ProtectedRoute>
        } />
        <Route path="/assessment" element={
          <ProtectedRoute user={user}><Assessment user={user} /></ProtectedRoute>
        } />
        <Route path="/assessment/:id" element={
          <ProtectedRoute user={user}><Assessment user={user} /></ProtectedRoute>
        } />
        <Route path="/results/:id" element={
          <ProtectedRoute user={user}><Results user={user} /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute user={user}><History user={user} /></ProtectedRoute>
        } />
        <Route path="/hospitals" element={
          <ProtectedRoute user={user}><HospitalFinder /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute user={user}><Profile user={user} /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </div>
    </>
  );
}

export default function App() {
  const [user, setUser]         = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setAuthReady(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 text-sm animate-pulse">Loading…</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes user={user} />
    </BrowserRouter>
  );
}
