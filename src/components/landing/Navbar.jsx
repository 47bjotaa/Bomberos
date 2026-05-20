import { Icons } from '../../components/ui/Icons';
import { useTheme } from '../../context/ThemeContext';
import { APP_LOGIN_URL } from '../../utils/constants';
import LogoCuartelAmigo from '../ui/LogoCuartelAmigo';
import { useState, useEffect } from 'react';

function Navbar({ mobileMenuOpen, setMobileMenuOpen }) {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container flex items-center justify-between" style={{ width: '100%' }}>
        <div className="flex items-center">
          <LogoCuartelAmigo size={80} />
        </div>
        <div className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
          <a href="#problema" onClick={() => setMobileMenuOpen(false)}>Problema</a>
          <a href="#solucion" onClick={() => setMobileMenuOpen(false)}>Solución</a>
          <a href="#plataforma" onClick={() => setMobileMenuOpen(false)}>Plataforma</a>
          <a href="#como-funciona" onClick={() => setMobileMenuOpen(false)}>Cómo Funciona</a>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="icon-btn theme-toggle" 
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
          </button>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Icons.Menu />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
