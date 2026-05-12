import React, { useState } from 'react';
import Landing from './pages/Landing';
import AuthView from './pages/Auth';
import Dashboard from './pages/Dashboard';
import './App.css';

export default function App() {
  const [view, setView] = useState('landing'); // landing, auth, dashboard

  return (
    <div className="app-container">
      {view === 'landing' && <Landing setView={setView} />}
      {view === 'auth' && <AuthView setView={setView} />}
      {view === 'dashboard' && <Dashboard setView={setView} />}
    </div>
  );
}
