import LogoCuartelAmigo from '../ui/LogoCuartelAmigo';

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-brand">
          <a href="#" className="logo" onClick={(e) => { e.preventDefault(); }}>
            <LogoCuartelAmigo size={220} />
          </a>
          <p className="footer-slogan">Transformando la infraestructura digital para un futuro escalable.</p>
        </div>
        <div className="footer-credits">
          Desarrollado para 1ª Cía. Bomberos Coquimbo<br />
          © 2026 SYNETIX · Ingeniería en Informática · Santo Tomás Coquimbo
        </div>
      </div>
    </footer>
  );
}

export default Footer;
