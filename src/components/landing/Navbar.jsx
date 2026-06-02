import { useEffect, useState } from 'react';
import { Icons } from '../../components/ui/Icons';
import { getAppUrl } from '../../utils/constants';

function Navbar({ mobileMenuOpen, setMobileMenuOpen }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      setScrolled(scrollTop > 16);
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
          <a href="#solucion" onClick={closeMenu}>Módulos</a>
          <a href="#plataforma" onClick={closeMenu}>Vista mini</a>
        </div>

        <div className={`nav-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
          <a href="#solucion" onClick={closeMenu}>Módulos</a>
          <a href="#plataforma" onClick={closeMenu}>Vista mini</a>
          <a href="#planes" onClick={closeMenu}>Planes</a>
        </div>

        <div className="nav-side nav-side-right">
          <a href="#planes" onClick={closeMenu}>Planes</a>
          <a href={getAppUrl('/login')} className="nav-cta">Ingresar</a>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Abrir menú">
            <Icons.Menu />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
