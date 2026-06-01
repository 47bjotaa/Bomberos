import { useEffect, useState } from 'react';
import { Icons } from '../../components/ui/Icons';
import { useTheme } from '../../context/ThemeContext';
import { getAppUrl } from '../../utils/constants';
import LogoCuartelAmigo from '../ui/LogoCuartelAmigo';

function Navbar({ mobileMenuOpen, setMobileMenuOpen }) {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 120);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <nav className={`navbar landing-nav ${scrolled ? 'scrolled title-docked' : ''}`}>
      <div className="container nav-shell">
        <div className="nav-side nav-side-left">
          <a href="#" className="nav-logo" onClick={closeMenu} aria-label="Ir al inicio">
            <LogoCuartelAmigo size={72} />
          </a>
          <a href="#solucion" onClick={closeMenu}>Módulos</a>
          <a href="#plataforma" onClick={closeMenu}>Vista mini</a>
        </div>

        <a href="#" className="nav-brand-word" onClick={closeMenu} aria-label="CuartelAmigo">
          CuartelAmigo
        </a>

        <div className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
          <a href="#solucion" onClick={closeMenu}>Módulos</a>
          <a href="#plataforma" onClick={closeMenu}>Vista mini</a>
          <a href="#planes" onClick={closeMenu}>Planes</a>
        </div>

        <div className="nav-side nav-side-right">
          <a href="#planes" onClick={closeMenu}>Planes</a>
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
