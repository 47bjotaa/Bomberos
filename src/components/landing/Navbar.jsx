import React from 'react';
import { Icons } from '../../components/ui/Icons';

function Navbar({ mobileMenuOpen, setMobileMenuOpen, setView }) {
  return (
    <nav className="navbar">
      <div className="container flex items-center justify-between" style={{ width: '100%' }}>
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); setView('landing'); }}>
          <img src="/images/logo.png" className="brand-logo" alt="SYNETIX" />
        </a>
        <div className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
          <a href="#problema" onClick={() => setMobileMenuOpen(false)}>Problema</a>
          <a href="#solucion" onClick={() => setMobileMenuOpen(false)}>Solución</a>
          <a href="#plataforma" onClick={() => setMobileMenuOpen(false)}>Plataforma</a>
          <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)}>Cómo Funciona</a>
        </div>
        <button onClick={() => setView('auth')} className="btn btn-primary nav-btn">Registrarse</button>
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Icons.Menu />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
