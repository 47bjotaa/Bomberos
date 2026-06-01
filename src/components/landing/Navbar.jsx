import { useEffect, useState } from 'react';
import { Icons } from '../../components/ui/Icons';
import { useTheme } from '../../context/ThemeContext';
import { getAppUrl } from '../../utils/constants';
import LogoCuartelAmigo from '../ui/LogoCuartelAmigo';

function Navbar({ mobileMenuOpen, setMobileMenuOpen }) {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      setHidden(currentScrollY > lastScrollY && currentScrollY > 80);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''} ${hidden ? 'nav-hidden' : ''}`}>
      <div className="container flex items-center justify-between" style={{ width: '100%' }}>
        <a href="#" className="flex items-center" onClick={closeMenu} aria-label="Ir al inicio">
          <LogoCuartelAmigo size={80} />
        </a>
        <div className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
          <a href="#solucion" onClick={closeMenu}>Módulos</a>
          <a href="#semaforo" onClick={closeMenu}>Semáforo</a>
          <a href="#plataforma" onClick={closeMenu}>Dashboard</a>
          <a href="#como-funciona" onClick={closeMenu}>Implementación</a>
          <a href="#planes" onClick={closeMenu}>Planes</a>
          <a href="#contacto" onClick={closeMenu}>Contacto</a>
        </div>
        <div className="flex items-center gap-4">
          <a href={getAppUrl('/login')} className="nav-cta">Ingresar</a>
          <button
            onClick={toggleTheme}
            className="icon-btn theme-toggle"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
          </button>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Abrir menú">
            <Icons.Menu />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
