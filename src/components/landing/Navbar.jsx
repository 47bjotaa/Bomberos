import { Icons } from '../../components/ui/Icons';
import { useTheme } from '../../context/ThemeContext';

function Navbar({ mobileMenuOpen, setMobileMenuOpen, setView }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <div className="container flex items-center justify-between" style={{ width: '100%' }}>
        <div className="flex items-center">
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
          <button onClick={() => setView('auth')} className="btn btn-primary nav-btn">Registrarse</button>
          <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <Icons.Menu />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
