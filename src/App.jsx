import { useEffect, useState } from 'react';
import Landing from './pages/Landing';
import AuthView from './pages/Auth';
import Dashboard from './pages/Dashboard';
import PaginaDonacion from './pages/PaginaDonacion';
import './App.css';

const hasAuthToken = () => Boolean(localStorage.getItem('token'));

const getViewFromPath = (pathname) => {
  if (pathname.startsWith('/donar/')) return 'donacion';
  if (pathname.startsWith('/dashboard')) return 'dashboard';
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/recuperar-password') ||
    pathname.startsWith('/restablecer-password')
  ) return 'auth';
  return 'landing';
};

const getAuthModeFromPath = (pathname) => {
  if (pathname.startsWith('/login')) return 'login';
  if (pathname.startsWith('/recuperar-password')) return 'recover';
  if (pathname.startsWith('/restablecer-password')) return 'reset';
  return 'register';
};

const pathByView = {
  landing: '/',
  auth: '/login',
  dashboard: '/dashboard',
};

const getRouteStateFromPath = (pathname) => {
  if (pathname.startsWith('/dashboard') && !hasAuthToken()) {
    return {
      view: 'auth',
      authMode: 'login',
      path: '/login',
      shouldReplace: true,
    };
  }

  return {
    view: getViewFromPath(pathname),
    authMode: getAuthModeFromPath(pathname),
    path: pathname,
    shouldReplace: false,
  };
};

export default function App() {
  const [routeState, setRouteState] = useState(() => {
    const initialRoute = getRouteStateFromPath(window.location.pathname);

    if (initialRoute.shouldReplace && window.location.pathname !== initialRoute.path) {
      window.history.replaceState({}, '', initialRoute.path);
    }

    return initialRoute;
  });
  const { view, authMode } = routeState;

  const applyRouteFromPath = (pathname) => {
    const nextRoute = getRouteStateFromPath(pathname);

    if (nextRoute.shouldReplace && window.location.pathname !== nextRoute.path) {
      window.history.replaceState({}, '', nextRoute.path);
    }

    setRouteState(nextRoute);
  };

  useEffect(() => {
    const handlePopState = () => {
      applyRouteFromPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setView = (nextView) => {
    if (nextView === 'dashboard' && !hasAuthToken()) {
      window.history.pushState({}, '', '/login');
      setRouteState({ view: 'auth', authMode: 'login', path: '/login', shouldReplace: false });
      return;
    }

    const nextPath = pathByView[nextView];
    if (nextPath && window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }

    setRouteState({
      view: nextView,
      authMode: nextView === 'auth' ? getAuthModeFromPath(nextPath || window.location.pathname) : authMode,
      path: nextPath || window.location.pathname,
      shouldReplace: false,
    });
  };

  return (
    <div className="app-container">
      {view === 'landing' && <Landing />}
      {view === 'auth' && <AuthView initialMode={authMode} />}
      {view === 'dashboard' && <Dashboard setView={setView} />}
      {view === 'donacion' && <PaginaDonacion />}
    </div>
  );
}
