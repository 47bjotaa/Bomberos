import React from 'react';
import { useTheme } from '../../context/ThemeContext';

function LogoCuartelAmigo({ className = "", size = 200 }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`flex items-center gap-4 ${className}`} style={{ height: size / 2 }}>
      <svg 
        viewBox="0 0 400 400" 
        className="h-full w-auto"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shield Shape */}
        <path 
          d="M40 80 L200 40 L360 80 L360 240 Q360 340 200 380 Q40 340 40 240 Z" 
          fill={isDark ? "#0F1729" : "#F8FAFC"} 
          stroke={isDark ? "white" : "#0F1729"} 
          strokeWidth="6"
        />
        {/* Red Header of the Shield */}
        <path 
          d="M40 80 L200 40 L360 80 L360 140 L40 140 Z" 
          fill="#E8372A" 
        />
        
        {/* Fire Station / Garage Shape */}
        <path 
          d="M100 240 L200 160 L300 240 L300 320 L100 320 Z" 
          fill={isDark ? "white" : "#0F1729"} 
        />
        <rect x="185" y="195" width="30" height="30" fill={isDark ? "#0F1729" : "white"} rx="2" />
        <path d="M200 195 V225 M185 210 H215" stroke={isDark ? "white" : "#0F1729"} strokeWidth="2" />

        {/* Fire Truck Simplified */}
        <rect x="140" y="250" width="120" height="60" fill="#E8372A" rx="4" />
        <rect x="150" y="255" width="100" height="30" fill="#131D35" rx="2" />
        <rect x="160" y="295" width="20" height="20" fill="black" rx="10" />
        <rect x="220" y="295" width="20" height="20" fill="black" rx="10" />
        
        {/* Flame Icon */}
        <path 
          d="M200 60 Q215 85 200 110 Q185 85 200 60" 
          fill="white" 
        />
      </svg>
      
      <div className="flex flex-col">
        <div className="flex items-baseline font-display font-bold leading-none" style={{ fontSize: size / 4 }}>
          <span className={isDark ? "text-white" : "text-black"}>Cuartel</span>
          <span className="text-brand-red">Amigo</span>
        </div>
        <div 
          className="text-text-muted tracking-[0.2em] font-medium uppercase mt-2" 
          style={{ fontSize: size / 14 }}
        >
          Organización • Equipo • Servicio
        </div>
      </div>
    </div>
  );
}

export default LogoCuartelAmigo;
