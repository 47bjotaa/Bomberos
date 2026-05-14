import { useEffect, useState } from 'react';
import Landing from './pages/Landing';
import AuthView from './pages/Auth';
import Dashboard from './pages/Dashboard';
import './App.css';

const getViewFromPath = (pathname) => {
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) return 'auth';
  return 'landing';
};

const getAuthModeFromPath = (pathname) => (
  pathname.startsWith('/login') ? 'login' : 'register'
);

const pathByView = {
  landing: '/',
  auth: '/login',
  dashboard: '/dashboard',
};

export default function App() {
  const [view, setCurrentView] = useState(() => getViewFromPath(window.location.pathname));
  const [authMode, setAuthMode] = useState(() => getAuthModeFromPath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setCurrentView(getViewFromPath(window.location.pathname));
      setAuthMode(getAuthModeFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setView = (nextView) => {
    const nextPath = pathByView[nextView];
    if (nextPath && window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }

    if (nextView === 'auth') {
      setAuthMode(getAuthModeFromPath(nextPath || window.location.pathname));
    }

    setCurrentView(nextView);
  };

  return (
    <div className="app-container">
      {view === 'landing' && <Landing />}
      {view === 'auth' && <AuthView initialMode={authMode} />}
      {view === 'dashboard' && <Dashboard setView={setView} />}
    </div>
  );
}
