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
  Shield: (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* Left Orange Vest */}
      <path d="M43 42c-2.3 0-5 2-6.5 4L28 52v20c0 5 4.5 9 9 9h9c2 0 4-2 4-4V42H43z" fill="#FF7824" stroke="#0F172A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M42 42v39M35 52v29M28 62h15" stroke="#DDF521" strokeWidth="4" strokeLinecap="round" />
      <path d="M42 42v39M35 52v29M28 62h15" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />

      {/* Right Green/Yellow Vest */}
      <path d="M57 42c2.3 0 5 2 6.5 4L72 52v20c0 5-4.5 9-9 9h-9c-2 0-4-2-4-4V42H57z" fill="#C1DF1F" stroke="#0F172A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M58 42v39M65 52v29M58 62h14" stroke="#DDF521" strokeWidth="4" strokeLinecap="round" />
      <path d="M58 42v39M65 52v29M58 62h14" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />

      {/* Earmuffs Headband */}
      <path d="M37 38.5c5-9.5 21-9.5 26 0" stroke="#334155" strokeWidth="3.5" fill="none" strokeLinecap="round" />

      {/* Safety Helmet (Yellow) */}
      <path d="M35 34c0-9.4 6.7-17 15-17s15 7.6 15 17H35z" fill="#FFCB14" stroke="#0F172A" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M32 34c4-2 9-3 18-3s14 1 18 3c1.5.5 1.5 2 0 2.5l-3 1c-5 1.5-10 1.5-15 1.5s-10 0-15-1.5l-3-1c-1.5-.5-1.5-2 0-2.5z" fill="#E2AB09" stroke="#0F172A" strokeWidth="3" strokeLinejoin="round" />
      <rect x="47" y="16" width="6" height="15" rx="1.5" fill="#FFCB14" stroke="#0F172A" strokeWidth="2.5" />

      {/* Goggles on Helmet */}
      <path d="M36 28h28v6H36v-6z" fill="#1E293B" rx="2" />
      {/* Left Lens */}
      <rect x="39" y="29.5" width="9" height="5" rx="1.5" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />
      {/* Right Lens */}
      <rect x="52" y="29.5" width="9" height="5" rx="1.5" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />
      {/* Goggles Strap */}
      <path d="M32 30h4M64 30h4" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />

      {/* Earmuffs Cups */}
      {/* Right Cup */}
      <rect x="63" y="38" width="8" height="12" rx="3" fill="#FFCB14" stroke="#0F172A" strokeWidth="2.5" />
      <rect x="61" y="40" width="2" height="8" rx="1" fill="#0F172A" />
      {/* Left Cup */}
      <rect x="29" y="38" width="8" height="12" rx="3" fill="#FFCB14" stroke="#0F172A" strokeWidth="2.5" />
      <rect x="35" y="40" width="2" height="8" rx="1" fill="#0F172A" />

      {/* Glove (on the right) */}
      <path d="M64 62c-2.5 0-5 3.5-3 6.5l8 13c1.5 2.5 5.5 2.5 7 0l8-13c2-3-.5-6.5-3-6.5h-17z" fill="#FFCB14" stroke="#0F172A" strokeWidth="3" strokeLinejoin="round" />
      <path d="M68 70c0 4 2.5 7 5 7s5-3 5-7" fill="#475569" stroke="#0F172A" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Fingers lines */}
      <path d="M67 63v7M71 62v7M75 62v7M79 63v7" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  User: (props) => (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      {/* 1. Jacket / Suit Base */}
      <path d="M15 85c0-15 10-25 25-27h20c15 2 25 12 25 27v5H15v-5z" fill="#202A3A" stroke="#0C1017" strokeWidth="3" strokeLinejoin="round" />

      {/* Shoulder Reflective Stripes (Yellow-Green) */}
      <path d="M22 69l-7 14M78 69l7 14" stroke="#DDF521" strokeWidth="4" strokeLinecap="round" />

      {/* Harness Straps & Buckles */}
      <path d="M37 58v27M63 58v27" stroke="#121820" strokeWidth="6" strokeLinecap="round" />
      <path d="M37 68v14M63 68v14" stroke="#4B5E78" strokeWidth="4" strokeLinecap="round" />
      
      {/* Chest Reflective Stripe */}
      <path d="M37 73h26" stroke="#DDF521" strokeWidth="5" />
      <path d="M37 73h26" stroke="#FE3B30" strokeWidth="2" /> {/* Red center stripe */}

      {/* Buckle Details */}
      <rect x="47" y="77" width="6" height="5" rx="1.5" fill="#94A3B8" stroke="#0C1017" strokeWidth="2" />

      {/* Radio Unit on Left Shoulder Strap */}
      <rect x="67" y="65" width="10" height="18" rx="2" fill="#121820" stroke="#0C1017" strokeWidth="2" />
      <path d="M72 65v-6" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" /> {/* Antenna */}
      <circle cx="74" cy="79" r="1.5" fill="#FF7B00" /> {/* Orange LED dot */}

      {/* 2. Neck & Protective Collar */}
      <path d="M40 50h20v15H40z" fill="#121820" />
      <path d="M40 54c4 4 16 4 20 0v8H40v-8z" fill="#DDF521" stroke="#0C1017" strokeWidth="2.5" />
      <path d="M37 49c8 2 18 2 26 0v6c-8 1-18 1-26 0v-6z" fill="#0C1017" /> {/* Under-chin collar wrap */}

      {/* 3. Face & Head */}
      <path d="M36 34c0 9 6 18 14 18s14-9 14-18V28H36v6z" fill="#F0B58D" />
      {/* Ears */}
      <path d="M36 32c-2 0-3 3-2 5s2 2 2 0" fill="#F0B58D" stroke="#0C1017" strokeWidth="2.5" />
      <path d="M64 32c2 0 3 3 2 5s-2 2-2 0" fill="#F0B58D" stroke="#0C1017" strokeWidth="2.5" />

      {/* Beard & Mustache */}
      <path d="M36 32c1 10 3 19 14 19s13-9 14-19c1 3 1 7-1 10-2 4-6 7-13 7s-11-3-13-7c-2-3-2-7-1-10z" fill="#3A2C22" stroke="#0C1017" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M43 41c2-1 5-2 7-2s5 1 7 2c-2-2-5-3-7-3s-5 1-7 3z" fill="#201813" />

      {/* Eyes & Eyebrows */}
      <path d="M42 29h4M54 29h4" stroke="#0C1017" strokeWidth="2.5" strokeLinecap="round" /> {/* Eyebrows */}
      <circle cx="44" cy="33" r="1.5" fill="#0C1017" />
      <circle cx="56" cy="33" r="1.5" fill="#0C1017" />

      {/* Nose & Mouth */}
      <path d="M50 32v4l-2 2" stroke="#0C1017" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M47 45c2 1 4 1 6 0" stroke="#0C1017" strokeWidth="2" strokeLinecap="round" />

      {/* Hair Under Helmet */}
      <path d="M34 26c-1 4 2 12 3 16M66 26c1 4-2 12-3 16" stroke="#0C1017" strokeWidth="4.5" strokeLinecap="round" />

      {/* 4. Helmet (Casco de Bombero) */}
      {/* Neck guard draping down the back */}
      <path d="M32 25c-2 6-2 15 2 20h32c4-5 4-14 2-20" fill="#121820" stroke="#0C1017" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Red Helmet Dome */}
      <path d="M29 24c0-13 10-18 21-18s21 5 21 18H29z" fill="#D32F2F" stroke="#0C1017" strokeWidth="3" strokeLinejoin="round" />
      <path d="M50 6v18" stroke="#0C1017" strokeWidth="3" /> {/* Crest centerline */}

      {/* Helmet Brim */}
      <path d="M25 24c5-3 12-4 25-4s20 1 25 4c3 1 3 3 0 4l-4 2c-6 2-13 2-21 2s-15 0-21-2l-4-2c-3-1-3-3 0-4z" fill="#B71C1C" stroke="#0C1017" strokeWidth="3" strokeLinejoin="round" />
      
      {/* Front Badge / Shield (Black with Fire Emblem) */}
      <path d="M43 8l7-4 7 4v10l-7 3-7-3V8z" fill="#121820" stroke="#0C1017" strokeWidth="2" strokeLinejoin="round" />
      
      {/* Crossed axes & Flame (Emblem) */}
      <path d="M46 16l8-8M54 16l-8-8" stroke="#DDF521" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M50 14c2 0 3-2 3-4s-2-3-3-3-3 1-3 3 1 4 3 4z" fill="#FE3B30" />
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
  Report: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2h9l3 3v17H6z"></path><path d="M14 2v5h5"></path><path d="M9 17v-4"></path><path d="M12 17V9"></path><path d="M15 17v-6"></path></svg>,
  Sun: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>,
  Moon: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>,
  Eye: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
  EyeOff: (props) => <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
};
