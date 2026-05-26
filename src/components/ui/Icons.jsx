import React from 'react';

export const Icons = {
  Menu: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>,
  ChevronRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  Traceability: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>,
  Uncertainty: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>,
  Finance: (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Coin */}
      <circle cx="58" cy="35" r="18" fill="#FFD043" stroke="#222" strokeWidth="5" />
      <path d="M50 25c3-4 10-4 14-1" stroke="#FFF" strokeWidth="3" strokeLinecap="round" />
      <path d="M58 24v22M63 28h-9c-2 0-3 1.5-3 2.5s1 2.5 3 2.5h8c2 0 3 1.5 3 2.5s-1 2.5-3 2.5h-9" stroke="#222" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Sleeve / Cuff */}
      <path d="M21 55l14 30-10 5-14-30 10-5z" fill="#3B82F6" stroke="#222" strokeWidth="5" strokeLinejoin="round" />
      <circle cx="21" cy="74" r="3" fill="#222" />

      {/* Hand */}
      <path d="M31 60c8-6 19-10 27-6s12 5 20-2l14 12c4 4-2 11-8 13l-20 8-27-10-6-15z" fill="#FCD5B5" />
      <path d="M31 60c8-6 19-10 27-6s12 5 20-2l14 12c4 4-2 11-8 13L64 85 37 75 31 60z" stroke="#222" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M52 64c5-2 11-1 15 3" stroke="#222" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  Shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  User: (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Background white sticker outline */}
      <path d="M50 6C36.7 6 25.6 14.8 23.4 28.2c-6.7 4.5-8.9 11.2-8.9 20.2 0 11.2 6.7 20.2 15.6 24.7v9c0 4.5 4.5 9 9 9h22c4.5 0 9-4.5 9-9v-9c8.9-4.5 15.6-13.5 15.6-24.7 0-9-2.2-15.7-8.9-20.2C74.4 14.8 63.3 6 50 6z" fill="#FFFFFF" />
      
      {/* Blue shirt */}
      <path d="M30 81c0-11.2 9-18 20-18s20 6.8 20 18v6.7H30V81z" fill="#6979BC" stroke="#3D4075" strokeWidth="5" strokeLinejoin="round" />
      {/* Neck */}
      <path d="M43.3 60.8v9.9c0 3.6 3.1 5.8 6.7 5.8s6.7-2.2 6.7-5.8v-9.9" fill="#FCD5B5" stroke="#3D4075" strokeWidth="5" />
      {/* Ears */}
      <circle cx="30" cy="45" r="6.7" fill="#FCD5B5" stroke="#3D4075" strokeWidth="5" />
      <circle cx="70" cy="45" r="6.7" fill="#FCD5B5" stroke="#3D4075" strokeWidth="5" />
      {/* Head */}
      <path d="M34.4 45c0 11.2 6.7 18 15.6 18s15.6-6.8 15.6-18c0-12.6-6.7-20.2-15.6-20.2S34.4 32.4 34.4 45z" fill="#FCD5B5" stroke="#3D4075" strokeWidth="5" />
      {/* Hair */}
      <path d="M33 38.2c-0.9-6.7 3.6-15.7 17-15.7s18 9 17.1 15.7c0 0-3.6-6.7-9-6.7s-9.9 5.4-17.1 6.7z" fill="#3D4075" stroke="#3D4075" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Dashboard: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>,
  Inventory: (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Box */}
      {/* Left side */}
      <path d="M12 30v40l35 20V50L12 30z" fill="#E28700" stroke="#000000" strokeWidth="5" strokeLinejoin="round" />
      {/* Right side */}
      <path d="M47 50v40l35-20V30L47 50z" fill="#F09F09" stroke="#000000" strokeWidth="5" strokeLinejoin="round" />
      {/* Top side (Left flap + Right flap) */}
      <path d="M12 30l35-20 35 20-35 20-35-20z" fill="#FFB300" stroke="#000000" strokeWidth="5" strokeLinejoin="round" />
      {/* Flap partition lines */}
      <path d="M47 10v40M29.5 20l35 20" stroke="#000000" strokeWidth="5" strokeLinecap="round" />

      {/* Checkmark Circle at bottom right */}
      <circle cx="70" cy="70" r="22" fill="#10B981" stroke="#000000" strokeWidth="5" />
      <path d="M60 70l7 7 15-15" stroke="#000000" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  AlertTriangle: (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M50 8L8 85h84L50 8z" fill="#FFC72C" stroke="#000000" strokeWidth="5" strokeLinejoin="round" />
      <path d="M50 35v22" stroke="#000000" strokeWidth="6" strokeLinecap="round" />
      <circle cx="50" cy="72" r="4" fill="#000000" />
    </svg>
  ),
  Settings: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Truck: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>,
  Sun: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>,
  Moon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>,
  Eye: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
  EyeOff: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
};
